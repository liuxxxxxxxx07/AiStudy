# Cloudflare Pages 部署

## 前置要求

1. **Cloudflare 账号** — https://dash.cloudflare.com/sign-up
   - 国内用户可以直接注册，Cloudflare 在国内有合作节点，访问速度不错

2. **API Token** — 用于 CI/自动化部署
   - 打开 https://dash.cloudflare.com/profile/api-tokens
   - 点击 "Create Token"
   - 选择 "Edit Cloudflare Workers" 模板
   - 权限: `Cloudflare Pages` → `Edit`
   - 复制生成的 token

## 首次部署

### 方式 A: 浏览器登录（推荐）

```bash
# 1. 登录 Cloudflare（会打开浏览器）
npm run cf:login

# 2. 创建 Pages 项目（只需第一次）
npm run cf:create

# 3. 构建 + 部署
npm run deploy
```

### 方式 B: API Token（CI/无头环境）

```bash
# 设置 token（或者写入 .env 文件）
set CLOUDFLARE_API_TOKEN=your_token_here

# 创建 Pages 项目（只需第一次）
npx wrangler pages project create ai-study

# 构建 + 部署
npm run deploy
```

## 部署后

- 默认域名: `https://ai-study.pages.dev`
- 可在 Cloudflare Dashboard → Pages → ai-study → Custom domains 绑定你自己的域名
- 国内用户推荐绑定一个国内可访问的域名，或者直接用 `.pages.dev` 域名（国内部分地区可能受限）

## 自动部署（GitHub）

1. 推送代码到 GitHub 仓库
2. Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. 选择仓库，配置:
    - Build command: `npm run build`
    - Build output directory: `out`
4. 每次 `git push` 自动构建部署

## 环境变量配置

部署后，必须在 Cloudflare Dashboard 设置以下环境变量，否则 API 功能无法工作：

1. Cloudflare Dashboard → Pages → `ai-study` → **Settings** → **Environment variables** (生产环境)
2. 添加:
    | 变量名 | 值 |
    |--------|-----|
    | `OPENROUTER_API_KEY` | 你的 OpenRouter API Key |
3. 保存后重新部署（Deployments → 点击最新部署 → Retry）

## 更新部署

```bash
npm run deploy
```