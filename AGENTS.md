<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:auto-commit -->
# Auto-commit after changes

After completing any set of code changes (e.g. fixing bugs, adding features, modifying config), ALWAYS commit the changes to git.

Follow these steps:
1. Run `git status` to see what files changed
2. Stage appropriate files — NEVER stage secrets, API keys, `.env` files, `node_modules/`, `dist/`, or `.next/`
3. Write a concise commit message in Chinese describing the changes made
4. Commit with `git commit -m "..."` (do NOT push)

Examples of good commit messages:
- `修复订阅流程：await onSelect + 修正 Paddle checkout URL 构造`
- `添加自动 Git 提交流程`
<!-- END:auto-commit -->
