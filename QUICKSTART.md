# 快速部署指南 - 3 分钟搞定！⚡

> 本小姐手把手教你部署，笨蛋也能学会！(￣▽￣)ノ

## 步骤 1: 安装依赖 📦

```bash
npm install
```

## 步骤 2: 登录 Cloudflare 🔐

```bash
npx wrangler login
```

浏览器会打开授权页面，点击允许即可。

## 步骤 3: 部署！🚀

```bash
npm run deploy
```

就这么简单！等待 10-20 秒，你会看到：

```
✨  Built successfully, built project size is 5 KiB.
✨  Successfully published your script to
 https://anthropic-proxy-worker.your-subdomain.workers.dev
```

## 步骤 4: 配置环境变量 ⚙️

### 方法一：通过命令行（推荐）

```bash
# 设置 API 基础 URL
npx wrangler secret put API_BASE_URL
# 输入：https://anyrouter.top

# 设置 System Prompt 替换（可选）
npx wrangler secret put SYSTEM_PROMPT_REPLACEMENT
# 输入：你是一个有用的AI助手

# 设置自定义 Headers（可选）
npx wrangler secret put CUSTOM_HEADERS
# 输入：{"X-Custom":"value"}
```

### 方法二：通过 Dashboard（更简单）

1. 访问 https://dash.cloudflare.com/
2. Workers & Pages → 选择你的 Worker
3. Settings → Variables → Add variable
4. 添加以下变量：
   - `API_BASE_URL` = `https://anyrouter.top`
   - `SYSTEM_PROMPT_REPLACEMENT` = `你的自定义 prompt`（可选）
   - `CUSTOM_HEADERS` = `{"X-Custom":"value"}`（可选）

## 步骤 5: 测试！🧪

```bash
curl https://your-worker.workers.dev/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 完成！✨

你的代理已经运行在全球 CDN 边缘节点上了！

### 获取你的 Worker URL

部署成功后会显示，格式通常是：
```
https://anthropic-proxy-worker.your-subdomain.workers.dev
```

### 绑定自定义域名（可选）

1. Dashboard → Workers → 你的 Worker
2. Triggers → Custom Domains
3. Add Custom Domain
4. 输入你的域名（如 `api.example.com`）
5. Cloudflare 会自动配置 DNS

## 本地开发 🛠️

```bash
# 创建 .dev.vars 文件
cat > .dev.vars << EOF
API_BASE_URL=https://anyrouter.top
SYSTEM_PROMPT_REPLACEMENT=你是一个有用的AI助手
CUSTOM_HEADERS={"X-Custom":"value"}
EOF

# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8787
```

## 查看日志 📊

```bash
npm run tail
```

## 常见问题 ❓

### Q: 部署失败怎么办？
```bash
# 检查配置
npx wrangler deploy --dry-run

# 查看详细错误
npx wrangler deploy --verbose
```

### Q: 如何更新代码？
```bash
# 修改代码后重新部署
npm run deploy
```

### Q: 如何回滚？
访问 Dashboard → Workers → Deployments → 选择之前的版本

---

## 就这么简单！

哼，看吧，本小姐的方案是不是超级简单？(￣ω￣)ノ

有问题就去看详细文档：[CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

或者来问本小姐！(,,><,,)b

---

> 本小姐的作品 ✨ - 傲娇的蓝发双马尾大小姐工程师
