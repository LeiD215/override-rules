# 现状速览（收工前必须更新；开工时先核对是否仍准确，起止时间记在 CHANGELOG.md）

> 本文件是 `_fork/` 记录区专用，跟仓库根目录的 `README.md` 无关——那个是上游
> 项目自己在维护的说明文档，会随同步更新变动，不要在里面加我们自己的内容。

- **这是什么**：`powerfullz/override-rules` 的个人 Fork，按照 ADR-0003 的决定，
  自定义规则直接写在 `src/*.ts` 源码里，用项目自带的构建流程产出最终覆写脚本
- **当前阶段**：✅ 首次搭建 + 端到端验证全部完成（含一次分支名 bug 修复），
  已完成一次小型日常维护任务的本地验证；发布推送待在有 GitHub 凭据的环境继续
- **上次动手时间**：2026-07-21
- **上次做了什么**：
  - 完成首次搭建全流程（Fork → clone → 套用改动 → 本地验证 → 提交推送 →
    启用 Actions → 发布 `src-v2.5.6`）
  - 排查并修复了一个真实 bug：`MyDirectCDN` provider 的 URL 分支名写错
    （`@master` 应为 `@main`），发布 `src-v2.5.7` 修复
  - Sub-Store 刷新脚本条目后，客户端"规则提供者"面板确认 `MyDirectCDN`
    正常生效（5 条规则）
  - 完成本次测试任务：在 `ruleset/MyDirectCDN.list` 加入
    `cdnjs.cloudflare.com`，本地 `tsc`、lint、build、artifacts 和模拟节点
    功能验证全部通过
  - `npm version patch` 已生成本地 `src-v2.5.8`，但推送因当前环境没有 GitHub
    凭据失败；远端尚未更新
  - **最终确认可用的链接**：
    `https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js`
- **当前跟踪的上游版本**：Fork 时的 `main` 分支（对应 upstream release v2.5.5，
  2026-06-30）
- **下一步待办**：
  - [x] 在 GitHub 上实际执行 Fork（`LeiD215/override-rules`）
  - [ ] 将本地 `src-v2.5.8` 提交和 tag 推送到 GitHub Fork（需要 GitHub 凭据）
  - [ ] 确认 `src-v2.5.8` 的 Release Artifacts 工作流完成
  - [ ] 验证 `convert.min.js` 和 `ruleset/MyDirectCDN.list` 的远端产物包含新规则
  - [x] 把本地改动 push 上去（历史版本）
  - [x] 替换 `MyDirectCDN` provider 的 `YOUR_GITHUB_USERNAME` 占位符
  - [x] 启用 GitHub Actions
  - [x] 跑 `npm version patch` 触发首次发布（历史版本）
  - [x] 最终链接实测可正常访问
  - [x] 在 Sub-Store 里实测生成的完整配置，修复了分支名 bug，确认
        `MyDirectCDN` 等自定义内容全部正常生效
  - [x] 正式交给 hermes：已完成小型规则变更及本地完整验证；待推送收尾

> 如果时隔很久重新打开这个项目：
> 1. 先看这一节，了解当前进度
> 2. 再看 `_fork/CHANGELOG.md`，按时间倒序过一遍做过什么
> 3. 有疑惑就去 `_fork/adr/` 找对应的决策记录（尤其是 ADR-0003，说明了这个
>    项目为什么长这个样子）
> 4. 要动手前，先读 `_fork/SOP.md`
