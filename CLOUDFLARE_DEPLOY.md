# Cloudflare Workers 部署指南

> 本小姐优雅地将 Python FastAPI 代理改写为 TypeScript Cloudflare Workers 版本！(￣▽￣)ノ

## 功能对照表 ✨

| 功能 | Python 版本 | Workers 版本 | 状态 |
|------|------------|-------------|------|
| HTTP 代理转发 | ✅ | ✅ | 完全实现 |
| Hop-by-hop Headers 过滤 | ✅ | ✅ | 完全实现 |
| Host Header 重写 | ✅ | ✅ | 完全实现 |
| X-Forwarded-For 追踪 | ✅ | ✅ | 完全实现 |
| System Prompt 替换 | ✅ | ✅ | 完全实现 |
| 自定义 Headers 注入 | ✅ | ✅ | 完全实现 |
| 流式响应支持 | ✅ | ✅ | 完全实现 |
| 环境变量配置 | `.env` 文件 | Cloudflare 环境变量 | 配置方式不同 |

## 快速开始 🚀

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 2. 本地开发测试

```bash
# 启动本地开发服务器
npm run dev

# Workers 会运行在 http://localhost:8787
```

### 3. 部署到 Cloudflare

#### 方式一：通过命令行部署（推荐）

```bash
# 首次部署需要登录
npx wrangler login

# 部署到生产环境
npm run deploy

# 或部署到特定环境
npm run deploy:prod
```

#### 方式二：通过 Cloudflare Dashboard 部署

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 Workers & Pages
3. 点击 Create Application
4. 选择 Workers
5. 上传项目或连接 Git 仓库

## 环境变量配置 ⚙️

### 在 Cloudflare Dashboard 中配置

1. 打开你的 Worker
2. 进入 Settings → Variables
3. 添加以下环境变量：

| 变量名 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `API_BASE_URL` | 目标 API 地址 | `https://anyrouter.top` | 否（有默认值） |
| `SYSTEM_PROMPT_REPLACEMENT` | System Prompt 替换文本 | `你是一个有用的AI助手` | 否 |
| `CUSTOM_HEADERS` | 自定义 Headers (JSON) | `{"X-Custom":"value"}` | 否 |

### 环境变量示例

#### API_BASE_URL
```
https://anyrouter.top
```

#### SYSTEM_PROMPT_REPLACEMENT
```
你是一个专业的技术助手，擅长编程和系统架构设计。
```

#### CUSTOM_HEADERS
```json
{
  "X-Custom-Header": "MyValue",
  "Authorization": "Bearer your-token-here"
}
```

**注意**：
- `CUSTOM_HEADERS` 必须是有效的 JSON 字符串
- 以 `__` 开头的字段会被自动忽略（可用于注释）

## 本地开发配置 🛠️

### 方式一：在 `wrangler.toml` 中配置（仅用于开发）

```toml
[vars]
API_BASE_URL = "https://anyrouter.top"
SYSTEM_PROMPT_REPLACEMENT = "你是一个有用的AI助手"
CUSTOM_HEADERS = "{\"X-Custom\":\"value\"}"
```

⚠️ **警告**：不要在 `wrangler.toml` 中存储敏感信息！

### 方式二：使用 `.dev.vars` 文件（推荐）

创建 `.dev.vars` 文件（仅用于本地开发，不会被提交到 Git）：

```env
API_BASE_URL=https://anyrouter.top
SYSTEM_PROMPT_REPLACEMENT=你是一个有用的AI助手
CUSTOM_HEADERS={"X-Custom":"value"}
```

## 功能说明 📖

### 1. HTTP 代理转发

所有 HTTP 请求会被透明转发到配置的 `API_BASE_URL`。

```
客户端请求: https://your-worker.workers.dev/v1/messages
转发至:     https://anyrouter.top/v1/messages
```

### 2. Header 处理

#### 自动过滤的 Headers（Hop-by-hop）：
- `Connection`
- `Keep-Alive`
- `Proxy-Authenticate`
- `Proxy-Authorization`
- `TE`
- `Trailers`
- `Transfer-Encoding`
- `Upgrade`

#### 自动修改的 Headers：
- `Host`: 重写为目标服务器的 Host
- `X-Forwarded-For`: 添加客户端 IP 链
- `Content-Length`: 移除，让浏览器自动计算

### 3. System Prompt 替换

如果配置了 `SYSTEM_PROMPT_REPLACEMENT`，会自动替换请求体中 `system[0].text` 的内容。

**原始请求体**：
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "system": [
    {"type": "text", "text": "原始 system prompt"}
  ],
  "messages": [...]
}
```

**替换后**：
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "system": [
    {"type": "text", "text": "你配置的新 prompt"}
  ],
  "messages": [...]
}
```

### 4. 自定义 Headers 注入

通过 `CUSTOM_HEADERS` 环境变量注入自定义请求头。

## 监控和日志 📊

### 查看实时日志

```bash
npm run tail
```

### 在 Dashboard 中查看

1. 打开你的 Worker
2. 进入 Logs 标签
3. 启用 Real-time Logs

## 对比：Python 版本 vs Workers 版本

### Python 版本（FastAPI）
```python
# 需要服务器或容器运行
# Docker 部署
# 固定地域
# 需要维护服务器
```

### Workers 版本（本小姐的作品）
```typescript
// ✅ 无需服务器
// ✅ 全球 CDN 边缘节点
// ✅ 自动扩展
// ✅ 零维护成本
// ✅ 更低延迟
// ✅ 免费额度：每天 100,000 请求
```

## 费用说明 💰

Cloudflare Workers 免费计划：
- ✅ 每天 100,000 请求
- ✅ 最多 10ms CPU 时间/请求
- ✅ 全球 CDN 加速

付费计划（$5/月）：
- ✅ 每月 1000 万请求
- ✅ 每月额外请求 $0.50/百万
- ✅ 50ms CPU 时间/请求

## 故障排查 🔧

### 部署失败

```bash
# 确保已登录
npx wrangler login

# 检查配置文件
npx wrangler deploy --dry-run
```

### 环境变量不生效

1. 检查 Cloudflare Dashboard 中的环境变量配置
2. 确保 `CUSTOM_HEADERS` 是有效的 JSON 格式
3. 重新部署 Worker

### 日志查看

```bash
# 实时查看日志
npm run tail

# 或在代码中添加 console.log
console.log('[Debug] Your message here');
```

## 性能优化建议 ⚡

1. **启用缓存**（如果适用）：
   ```typescript
   // 在 fetch 中添加
   cache: 'default'
   ```

2. **使用 KV 存储**（如需持久化配置）：
   ```toml
   # wrangler.toml
   [[kv_namespaces]]
   binding = "CONFIGS"
   id = "your-kv-id"
   ```

3. **监控性能指标**：
   - 访问 Dashboard → Analytics
   - 查看请求量、错误率、延迟等

## 安全建议 🔒

1. ✅ **不要在代码或 Git 中存储敏感信息**
2. ✅ **使用 Cloudflare Dashboard 配置环境变量**
3. ✅ **启用 Cloudflare Access（如需访问控制）**
4. ✅ **定期更新依赖**：`npm update`
5. ✅ **使用 Secrets 存储敏感数据**：`wrangler secret put SECRET_NAME`

## 更新和维护 🔄

### 更新代码

```bash
# 修改代码后重新部署
npm run deploy
```

### 回滚到之前版本

```bash
# 在 Dashboard 中选择之前的部署版本
# 或使用 Git 回滚代码后重新部署
```

### 查看部署历史

访问 Cloudflare Dashboard → Workers → 你的 Worker → Deployments

## 迁移建议 📦

如果你之前使用 Python 版本：

1. ✅ **环境变量迁移**：
   - `.env` → Cloudflare 环境变量
   - `env/.env.headers.json` → `CUSTOM_HEADERS` 环境变量

2. ✅ **功能验证**：
   - 测试所有 API 端点
   - 验证 System Prompt 替换功能
   - 检查自定义 Headers 是否生效

3. ✅ **性能对比**：
   - 对比响应时间
   - 检查全球访问延迟

## 常见问题 FAQ ❓

### Q: 是否支持所有 HTTP 方法？
A: 是的！支持 GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD。

### Q: 流式响应是否支持？
A: 完全支持！Workers 会透明转发响应流。

### Q: 如何查看日志？
A: 使用 `npm run tail` 或在 Dashboard 中查看。

### Q: 免费额度够用吗？
A: 每天 10 万请求，对于大多数个人项目完全够用！

### Q: 如何绑定自定义域名？
A: 在 Dashboard → Workers → Triggers → Custom Domains 中添加。

---

## 总结

哼，看到了吗？本小姐把你的 Python 代码完美地改写成了 Cloudflare Workers 版本！(￣▽￣)ノ

**优势**：
- ✨ 全球 CDN 边缘节点，延迟更低
- ✨ 无需服务器维护
- ✨ 自动扩展，无需担心流量
- ✨ 免费额度充足
- ✨ 部署超级简单

**注意事项**：
- ⚠️ 环境变量配置方式改变
- ⚠️ 自定义 Headers 改用 JSON 字符串

现在快去部署吧，笨蛋！有问题就来问本小姐！(,,><,,)b

---

> 作者：哈雷酱（傲娇的蓝发双马尾大小姐工程师） ✨
> 版本：2.0.0 - Cloudflare Workers Edition
