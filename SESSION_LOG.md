# AI Study - Puter 版项目日志

## 项目位置
`E:\ai-study-puter`

## 部署方式
Puter Hosting (静态站点) — 无服务端 API，纯客户端应用

## 技术栈
- Next.js 16.2.9 (static export) + React 19 + TypeScript + Tailwind CSS 4
- Puter.js (`https://js.puter.com/v2/`) — 认证、AI 聊天、文件存储
- 数据持久化: localStorage (对话、题库、知识库)

## 项目结构
```
src/
├── app/
│   ├── layout.tsx               # 根布局 (Puter.js script)
│   └── page.tsx                 # 入口 (登录Gate + AppShell)
├── components/
│   ├── AppShell.tsx              # 主应用 (Puter AI 流式对话 + 额度 + 所有功能)
│   ├── Sidebar.tsx               # 侧边栏 (New Chat + 题库/知识库/模拟考/检索/闪卡入口)
│   ├── MessageBubble.tsx         # 消息气泡 + 保存到题库 + 举一反三
│   ├── LoginScreen.tsx           # 登录界面 (Puter Auth)
│   ├── PaymentPlans.tsx          # 定价页面 (Plus/Pro/Pro+)
│   ├── CreditDisplay.tsx         # 额度显示
│   ├── DifficultySelector.tsx    # Easy/Medium/Hard 难度选择器
│   ├── QuestionBank.tsx          # 题库 (带搜索/标签/学科分类/闪卡入口)
│   ├── FlashCard.tsx             # 闪卡复习模式
│   ├── SimilarQuestions.tsx      # 举一反三 (AI 生成类似题目)
│   ├── KnowledgeBasePage.tsx     # 知识库 (保存可视化/Mermaid/笔记)
│   ├── MockExam.tsx              # 模拟考 (配置/考试/评分/错题回顾)
│   ├── SearchPanel.tsx           # 检索系统 (学科/TAG/时间/难度过滤)
│   ├── FileUploader.tsx          # 文件上传
│   ├── ImageUploader.tsx         # 图片上传
│   ├── MermaidRenderer.tsx       # Mermaid 图表渲染
│   └── Providers.tsx             # ThemeProvider 隔离
└── lib/
    ├── prompts.ts                # 3 种模式的 System Prompt
    ├── puter.ts                  # Puter 辅助函数 + 模型/额度配置
    ├── puter-types.d.ts          # Puter.js 类型声明
    ├── credits.ts                # 额度管理系统 (50积分/3小时)
    ├── examEngine.ts             # 题库/模拟考引擎
    ├── knowledgeBase.ts          # 知识库存储
    └── questionAnalyzer.ts       # AI 题目分析 (课程预测+TAG)
```

## 核心功能

### 1. 登录系统 (Puter Auth)
- 使用 `puter.auth.signIn()` 弹出窗口认证
- 支持临时用户自动创建
- `puter.auth.isSignedIn()` 自动检测登录状态

### 2. 额度系统
- 新用户 50 积分，每 3 小时自动补充
- 各模式消耗: Solver 20分, Visualizer 15分, Chat 10分
- 额度不足时提示

### 3. 三级难度模型选择
| 难度 | 默认模型 | 颜色 |
|------|----------|------|
| Easy | gpt-5.4-nano | 绿色 |
| Medium | claude-sonnet-4 | 黄色 |
| Hard | gpt-5.4 | 红色 |

### 4. 付费方案 (UI + 额度加成)
| 方案 | 价格 | 额度/3h | 功能 |
|------|------|---------|------|
| Plus | $9.99/月 | 200 | Easy+Medium |
| Pro | $19.99/月 | 500 | 全模型 + 优先处理 |
| Pro+ | $39.99/月 | 无限 | 全功能 + SLA |

### 5. 举一反三
- Solver 回答后, AI 自动生成 3 道类似题目
- 可展开查看答案, 一键保存到题库

### 6. 题库 + Flashcard 闪卡
- 保存问答对到题库
- AI 自动分析预测课程/学科/TAG
- 闪卡模式: 正反翻转、进度追踪、键盘快捷键
- 搜索过滤: 按学科/TAG/时间/难度

### 7. 知识库
- 保存可视化内容 (Mermaid)
- 支持笔记/摘要类型
- 搜索 + 分类过滤

### 8. 模拟考
- 从题库选题, 配置难度/题量/时长
- 倒计时考试界面
- 评分 + 错题回顾 + 闪卡复习错题

### 9. 检索系统
- 全文搜索 + 学科/TAG/难度/时间范围过滤
- 实时搜索结果

## 启动方式
```bash
cd E:\ai-study-puter
npm install
npm run dev    # http://localhost:3000 (开发)
npm run build  # 静态导出到 out/
```
