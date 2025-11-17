/**
 * Anthropic Transparent Proxy - Cloudflare Workers Edition
 *
 * 本小姐优雅地将 Python FastAPI 代理改写为 TypeScript Workers 版本 (￣▽￣)ノ
 *
 * @version 2.0.0
 * @author 哈雷酱 (傲娇的蓝发双马尾大小姐工程师)
 */

// ===== 接口定义 =====

interface Env {
  // 环境变量配置
  API_BASE_URL?: string;
  SYSTEM_PROMPT_REPLACEMENT?: string;
  CUSTOM_HEADERS?: string; // JSON 字符串格式的自定义 headers
}

interface CustomHeaders {
  [key: string]: string;
}

// ===== 常量定义 =====

// 需要过滤的 hop-by-hop headers (RFC 7230)
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

const PRESERVE_HOST = false; // 是否保留原始 Host header

// ===== 工具函数 =====

/**
 * 过滤请求 headers，移除 hop-by-hop headers
 */
function filterRequestHeaders(headers: Headers, targetUrl: URL): Headers {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // 跳过 hop-by-hop headers
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }

    // 跳过 Host header (除非 PRESERVE_HOST 为 true)
    if (lowerKey === 'host' && !PRESERVE_HOST) {
      return;
    }

    // 跳过 Content-Length (让浏览器自动计算)
    if (lowerKey === 'content-length') {
      return;
    }

    filtered.set(key, value);
  });

  // 设置目标 Host
  if (!PRESERVE_HOST) {
    filtered.set('Host', targetUrl.host);
  }

  return filtered;
}

/**
 * 过滤响应 headers，移除 hop-by-hop headers
 */
function filterResponseHeaders(headers: Headers): Headers {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      filtered.set(key, value);
    }
  });

  return filtered;
}

/**
 * 解析自定义 headers JSON 字符串
 */
function parseCustomHeaders(customHeadersJson?: string): CustomHeaders {
  if (!customHeadersJson) {
    return {};
  }

  try {
    const headers = JSON.parse(customHeadersJson);

    if (typeof headers !== 'object' || headers === null) {
      console.log('[Custom Headers] Parsed value is not an object, using empty dict');
      return {};
    }

    // 过滤掉以 __ 开头的注释字段
    const filtered: CustomHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      if (!key.startsWith('__') && typeof value === 'string') {
        filtered[key] = value;
      }
    }

    console.log(`[Custom Headers] Successfully loaded ${Object.keys(filtered).length} custom headers`);
    if (Object.keys(filtered).length > 0) {
      console.log(`[Custom Headers] Loaded headers: ${Object.keys(filtered).join(', ')}`);
    }

    return filtered;
  } catch (e) {
    console.error('[Custom Headers] Failed to parse JSON:', e);
    return {};
  }
}

/**
 * 处理请求体，替换 system prompt
 */
async function processRequestBody(
  body: ReadableStream<Uint8Array> | null,
  systemPromptReplacement?: string
): Promise<BodyInit | null> {
  // 如果没有 body 或没有配置替换，直接返回
  if (!body || !systemPromptReplacement) {
    if (!systemPromptReplacement) {
      console.log('[System Replacement] Not configured, keeping original body');
    }
    return body;
  }

  try {
    // 读取 body 内容
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    // 合并 chunks
    const bodyBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.length;
    }

    // 解析 JSON
    const bodyText = new TextDecoder().decode(bodyBytes);
    const data = JSON.parse(bodyText);

    console.log(`[System Replacement] Successfully parsed JSON body (${totalLength} bytes)`);

    // 检查 system 字段
    if (!data.system || !Array.isArray(data.system) || data.system.length === 0) {
      console.log('[System Replacement] No valid system array found, keeping original body');
      return bodyBytes;
    }

    // 检查第一个元素的 text 字段
    const firstElement = data.system[0];
    if (typeof firstElement !== 'object' || !firstElement.text) {
      console.log('[System Replacement] First element does not have text field, keeping original body');
      return bodyBytes;
    }

    // 记录原始内容
    const originalText = firstElement.text;
    const displayText = originalText.length > 100
      ? `${originalText.substring(0, 100)}...`
      : originalText;
    console.log(`[System Replacement] Original system[0].text: ${displayText}`);

    // 执行替换
    firstElement.text = systemPromptReplacement;
    const displayReplacement = systemPromptReplacement.length > 100
      ? `${systemPromptReplacement.substring(0, 100)}...`
      : systemPromptReplacement;
    console.log(`[System Replacement] Replaced with: ${displayReplacement}`);
    console.log(`[System Replacement] original_text == SYSTEM_PROMPT_REPLACEMENT: ${originalText === systemPromptReplacement}`);

    // 转换回 JSON (压缩格式，不包含空格)
    const modifiedBody = JSON.stringify(data, null, 0);
    const modifiedBytes = new TextEncoder().encode(modifiedBody);

    console.log(`[System Replacement] Successfully modified body (original: ${totalLength} bytes, new: ${modifiedBytes.length} bytes)`);

    return modifiedBytes;
  } catch (e) {
    console.error('[System Replacement] Failed to process body:', e);
    // 出错时返回 null，调用方会使用原始 body
    return null;
  }
}

// ===== 主代理逻辑 =====

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // 获取配置
      const targetBase = env.API_BASE_URL || 'https://anyrouter.top';
      const systemPromptReplacement = env.SYSTEM_PROMPT_REPLACEMENT;
      const customHeaders = parseCustomHeaders(env.CUSTOM_HEADERS);

      console.log(`[Proxy] Base URL: ${targetBase}`);
      console.log(`[Proxy] System prompt replacement: ${systemPromptReplacement || 'Not configured'}`);

      // 构造目标 URL
      const url = new URL(request.url);
      const targetUrl = new URL(url.pathname + url.search, targetBase);

      console.log(`[Proxy] Proxying ${request.method} ${url.pathname} -> ${targetUrl.href}`);

      // 处理请求体
      let processedBody: BodyInit | null = null;

      if (request.body && systemPromptReplacement) {
        // 需要克隆 request，因为 body 只能读取一次
        const clonedRequest = request.clone();
        processedBody = await processRequestBody(clonedRequest.body, systemPromptReplacement);
      }

      // 如果处理失败或不需要处理，使用原始 body
      const finalBody = processedBody || (request.body ? request.body : null);

      // 过滤和修改请求 headers
      const forwardHeaders = filterRequestHeaders(request.headers, targetUrl);

      // 注入自定义 headers
      for (const [key, value] of Object.entries(customHeaders)) {
        forwardHeaders.set(key, value);
      }

      // 添加 X-Forwarded-For
      const clientIp = request.headers.get('CF-Connecting-IP') ||
                       request.headers.get('X-Forwarded-For') ||
                       'unknown';
      const existingXFF = forwardHeaders.get('X-Forwarded-For');
      forwardHeaders.set(
        'X-Forwarded-For',
        existingXFF ? `${existingXFF}, ${clientIp}` : clientIp
      );

      // 发起上游请求
      const upstreamResponse = await fetch(targetUrl.href, {
        method: request.method,
        headers: forwardHeaders,
        body: finalBody,
        redirect: 'manual', // 不自动跟随重定向
      });

      // 过滤响应 headers
      const responseHeaders = filterResponseHeaders(upstreamResponse.headers);

      // 返回响应（保持流式传输）
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });

    } catch (e) {
      console.error('[Proxy] Error:', e);
      return new Response(`Upstream request failed: ${e}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
