# AI Study 技术文档

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (static hosting)                              │
│  https://stem-aistudy.com                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Next.js 16 (output: 'export')                            │  │
│  │  - LoginScreen (Supabase Auth: Google/GitHub/Email)       │  │
│  │  - AppShell (主应用: 聊天/模式/强度/工具)                  │  │
│  │  - Onboarding (首次访问引导, 首次登录使用指南)              │  │
│  │  - ProfileSettings (昵称编辑/主题/语言/积分/退出)          │  │
│  │  - PricingPage (定价/Paddle 支付)                          │  │
│  │  - Legal Pages (Terms/Privacy/Refund)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│           │                    │                   │             │
│           ▼                    ▼                   ▼             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ OpenRouter   │  │ Supabase Auth    │  │ Railway          │  │
│  │ AI chat API  │  │ Google/GitHub    │  │ Payment Server   │  │
│  │ (stream)     │  │ Email/Password   │  │ Paddle checkout  │  │
│  └──────────────┘  └──────────────────┘  │ webhooks         │  │
│                                           └──────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  localStorage (所有用户数据)                                │  │
│  │  对话 / 积分 / 题库 / 知识库 / Wiki / 考试记录 / 偏好       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.2.9 | 静态导出 React 框架 (`output: 'export'`) |
| **React** | 19.2.4 | UI 渲染 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 样式 |
| **Supabase** | ^2.108.2 | Auth (Google OAuth, GitHub OAuth, Email/Password) |
| **OpenRouter API** | — | AI 聊天 (多模型接入) |
| **lucide-react** | — | 图标 |
| **react-markdown + rehype-katex + remark-math** | — | Markdown + LaTeX 渲染 |
| **mermaid** | ^11.15.0 | 图表渲染 |

**支付后端** (Express on Railway):
| 技术 | 用途 |
|------|------|
| **Express** | 支付 API 服务 |
| **@paddle/paddle-node-sdk** | Paddle 支付 |
| **Stripe/PayPal/LemonSqueezy SDK** | 备用支付渠道 (未启用) |

## i18n 多语言系统

| 文件 | 说明 |
|------|------|
| `src/lib/i18n.tsx` | 核心: `I18nProvider`, `useI18n()`, `setLocale()` |
| `src/lib/locales/en.ts` | 英文翻译 (~200 keys) |
| `src/lib/locales/zh.ts` | 中文翻译 (完整对应) |
| `src/components/Providers.tsx` | 包裹 `<I18nProvider>` |

**流程**: 启动 → `navigator.language` 检测 (zh→中文, 其他→英文) → `localStorage` 持久化 → 用户可在 ProfileSettings 切换
**切换方式**: ProfileSettings 模态框 → 语言按钮 (点按 EN ↔ 中文)

## 认证流程

```
页面加载 → supabase.auth.getSession()
  → 有 session → 检测 Onboarding (pre-login & post-login) → AppShell
  → 无 session → 检测 Onboarding pre-login → LoginScreen
```

**支持的登录方式**:
- Google OAuth (Supabase)
- GitHub OAuth (Supabase)
- Email/Password (Supabase，需配置 SMTP)

**开发者模式**: 若 `.env.local` 中 Supabase 变量缺失, 使用 mock Supabase client (localStorage 模拟 session)

## Onboarding 引导系统

| 阶段 | 触发条件 | 内容 |
|------|----------|------|
| **pre-login** | 首次访问网站, 登录前 | 5 页产品介绍 (模式/知识管理/工具/额度), 标记"开发中" |
| **post-login** | 首次登录后 | 4 页使用指南 (快速上手/AI强度/额度/上传文件) |

- 使用 `localStorage` 标记 (`ai-study-onboarding-pre-done`, `ai-study-onboarding-post-done`)
- 每页可单独跳过, 最后一页"开始使用/注册体验"
- 组件: `src/components/Onboarding.tsx`

## Profile & Settings (个人资料与设置)

| 功能 | 说明 |
|------|------|
| **入口** | 侧栏顶部 (头像首字母 + 用户名) |
| **显示名称** | 可编辑, 保存到 localStorage + Supabase |
| **积分/套餐** | 实时显示余额, 点击升级跳转定价页 |
| **主题切换** | 浅色/深色 (同步 sidebar 按钮) |
| **语言切换** | 点按循环 EN ↔ 中文 |
| **退出登录** | 确认后退出 |

组件: `src/components/ProfileSettings.tsx`

## 积分系统

### 每月额度

| 套餐 | 额度/月 |
|------|---------|
| Free | 50 |
| Plus | 200 |
| Pro | 2000 |
| Pro+ | 10000 |

### 每次请求消耗

**总消耗 = MODEL_CREDIT_COST[intensity] + MODE_COST[mode]**

| 强度 | 模型 | 消耗 |
|------|------|------|
| Auto | 自动选择 | 1 |
| Light | deepseek/deepseek-v4-pro | 2 |
| Balanced | qwen/qwen3.7-max | 5 |
| Deep | openai/gpt-5.5 | 30 |
| Extreme | 7模型交叉验证 | 700 |

| 模式 | 消耗 |
|------|------|
| Chat | +0 |
| Solver | +1 |
| Visualizer | +1 |

**免费额度示例**: Chat+Light = 2 额度 → 25 次对话; Solver+Light = 3 额度 → ~16 次

### 数据存储
- `localStorage` key: `ai-study-credits-{userId}`
- 可选同步到 Supabase `credits` 表

## 模式系统

| 模式 | ID | 用途 |
|------|----|------|
| Solver | `solver` | 分步解题 (STEM 题目) |
| Visualizer | `visualizer` | 生成 Mermaid 图表 |
| Chat | `chat` | 自由问答 |

模式切换在 Header 中央 (胶囊按钮)。

## 强度选择器

滑块组件, 位于聊天输入框上方:
| 强度 | key | 付费 |
|------|-----|------|
| Auto 🔄 | auto | 免费 |
| Light 🌱 | easy | 免费 |
| Balanced ⚖️ | medium | 付费 |
| Deep 🔬 | hard | 付费 |
| Extreme ⚡ | extreme | 付费 |

组件: `src/components/IntensitySelector.tsx`

## 支付系统

### 架构
```
Frontend (Cloudflare) ──POST checkout──→ Railway (payment-server)
                                                 │
                                          Paddle API
                                                 │
                                    Paddle Webhook → Railway
```

### 定价页
- 组件: `src/components/PaymentPlans.tsx` (独立定价页), `src/components/UpgradeModal.tsx` (弹窗)
- 入口: 侧栏 Upgrade、账户余额点击、额度耗尽自动弹出、点击付费强度时弹出
- 支付处理: Railway Express server → Paddle
- `src/lib/payment-client.ts` → 调用 Railway API `/api/paddle/create-checkout`

### Railway 支付服务器
- `payment-server/src/index.ts` — Express 入口
- `payment-server/src/paddle.ts` — Paddle checkout + webhook
- `payment-server/.env` — Paddle API keys, prices, ALLOWED_ORIGINS, FRONTEND_URL
- `railway.json` — Railway 部署配置

### Paddle 配置要求
- Checkout Settings: 提交 `stem-aistudy.com` 域名审批
- Webhooks: `https://aistudy-production-d3da.up.railway.app/api/paddle/webhook`
- 法律页面: Terms (含公司名) / Privacy / Refund 必须通过导航可访问

## 图片识别流程

```
用户发送含图片的消息
  → tencent/hy3-preview (VISION_MODEL) 识别图片内容
  → 识别结果作为上下文发送给主 AI 模型
  → 主模型根据识别内容 + 用户问题生成回答
```

## 部署

### Cloudflare Pages (前端)
- `output: 'export'` → `npm run build` → `out/` 目录
- 自定义域名: `stem-aistudy.com`
- 自动部署: GitHub 仓库连接

### Railway (支付后端)
- `payment-server/` 目录
- 部署配置: `railway.json`
- 自动部署: GitHub 仓库连接 (push 到 main)

### 环境变量

**前端 `.env.local`**:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYMENT_SERVER_URL=https://aistudy-production-d3da.up.railway.app
OPENROUTER_API_KEY=...
```

**支付服务器 `payment-server/.env`**:
```
PADDLE_API_KEY=...
PADDLE_ENV=production
PADDLE_WEBHOOK_SECRET=...
PADDLE_PRICE_PLUS=...
PADDLE_PRICE_PRO=...
PADDLE_PRICE_PRO_PLUS=...
PORT=3001
ALLOWED_ORIGINS=https://stem-aistudy.com
SERVER_URL=https://aistudy-production-d3da.up.railway.app
FRONTEND_URL=https://stem-aistudy.com
```

## 数据库 (Supabase)

`supabase/migrations/001_schema.sql`:
- `profiles` — id, email, full_name, avatar_url, tier
- `credits` — user_id, balance, tier
- `subscriptions` — 多支付渠道订阅
- `conversations` + `messages` — 对话数据
- `questions` — 题库
- `exam_results` — 考试记录
- `knowledge_entries` — 知识库
- `wiki_entries` + `wiki_links` — 个人 Wiki

## 文件结构

```
E:\ai-study-puter
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根布局 + SEO meta
│   │   ├── page.tsx                # Auth gate + Onboarding
│   │   ├── globals.css             # 全局样式 (light/dark)
│   │   ├── auth/callback/          # OAuth 回调处理
│   │   ├── api/chat/route.ts       # OpenRouter API 代理 (仅 dev)
│   │   ├── pricing/page.tsx        # 定价页
│   │   ├── payment/success/        # 支付成功页
│   │   ├── payment/cancel/         # 支付取消页
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── refund/page.tsx
│   ├── components/
│   │   ├── AppShell.tsx           # 主应用壳
│   │   ├── Sidebar.tsx            # 侧栏 (对话/工具/用户)
│   │   ├── LoginScreen.tsx        # 登录页
│   │   ├── Onboarding.tsx         # 引导幻灯片 (pre/post login)
│   │   ├── ProfileSettings.tsx    # 个人资料 & 设置
│   │   ├── MessageBubble.tsx      # 消息气泡 (Markdown/LaTeX/Mermaid)
│   │   ├── UpgradeModal.tsx       # 升级弹窗
│   │   ├── PaymentPlans.tsx       # 定价页组件
│   │   ├── IntensitySelector.tsx  # 强度选择器滑块
│   │   ├── Providers.tsx          # ThemeProvider + I18nProvider
│   │   ├── QuestionBank.tsx       # 题库
│   │   ├── FlashCard.tsx          # 闪卡
│   │   ├── KnowledgeBasePage.tsx  # 知识库
│   │   ├── PersonalWiki.tsx       # 个人 Wiki
│   │   ├── WikiNodeGraph.tsx      # 节点图可视化
│   │   ├── MockExam.tsx           # 模拟考试
│   │   ├── SearchPanel.tsx        # 全文搜索
│   │   ├── SimilarQuestions.tsx   # 举一反三
│   │   ├── FileUploader.tsx       # 文件上传
│   │   ├── ImageUploader.tsx      # 图片上传
│   │   ├── MermaidRenderer.tsx    # Mermaid 渲染
│   │   ├── AdminStats.tsx         # 站点统计
│   │   └── LegalPage.tsx          # 法律页面包装
│   └── lib/
│       ├── i18n.tsx              # 多语言引擎
│       ├── locales/en.ts         # 英文翻译
│       ├── locales/zh.ts         # 中文翻译
│       ├── puter.ts              # 模型/积分/套餐配置
│       ├── credits.ts            # 积分系统
│       ├── api.ts                # OpenRouter API 封装
│       ├── backend.ts            # localStorage 持久化
│       ├── supabase.ts           # Supabase client (含 mock)
│       ├── supabase-db.ts        # Supabase CRUD
│       ├── payment-client.ts     # 支付 API 客户端
│       ├── prompts.ts            # 模式 prompts
│       ├── examEngine.ts         # 题库/考试引擎
│       ├── knowledgeBase.ts      # 知识库引擎
│       ├── wikiEngine.ts         # Wiki 引擎
│       ├── questionAnalyzer.ts   # AI 分类
│       ├── fileParser.ts         # 文件解析
│       └── rate-limit.ts         # 速率限制 (server)
├── payment-server/               # Express 支付服务
│   ├── src/
│   │   ├── index.ts              # 入口
│   │   ├── paddle.ts             # Paddle checkout + webhook
│   │   ├── stripe.ts / paypal.ts / lemonsqueezy.ts / payoneer.ts
│   │   └── subscription-status.ts
│   ├── .env
│   └── package.json
├── supabase/migrations/
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── favicon.ico
└── railwary.json
```

## 启动

```bash
npm install
npm run dev       # http://localhost:3000 (前端)
npm run build     # 输出到 out/ 目录

# 支付后端 (独立终端)
cd payment-server
npm install
npm run build
npm run start     # http://localhost:3001
```

## 部署

```bash
# 前端 → Cloudflare Pages
npm run build
# 自动通过 GitHub 连接部署

# 支付后端 → Railway
# 自动通过 GitHub 连接部署 (railway.json)
```

## 版本历史

### v0.1.0 (当前)
- 移除 Puter.js, 接入 Supabase Auth
- 重构积分系统: 50免费额度/月, 消耗全面下调
- 新增 i18n 多语言: 英文/中文, 自动检测浏览器语言
- 新增 Onboarding 引导系统 (pre-login + post-login)
- 新增 Profile & Settings (昵称编辑/主题/语言切换)
- 新增 Railway 支付后端 (Paddle)
- 更新主题: stem-aistudy.com 上线
- 侧栏顶部改为用户信息区 (头像+用户名)
