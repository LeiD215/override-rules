# 现状速览（收工前必须更新；开工时先核对是否仍准确，起止时间记在 CHANGELOG.md）

> 本文件是 `_fork/` 记录区专用，跟仓库根目录的 `README.md` 无关——那个是上游
> 项目自己在维护的说明文档，会随同步更新变动，不要在里面加我们自己的内容。

- **这是什么**：`powerfullz/override-rules` 的个人 Fork，按照 ADR-0003 的决定，
  自定义规则直接写在 `src/*.ts` 源码里，用项目自带的构建流程产出最终覆写脚本
- **当前阶段**：✅ 首次搭建已完成，端到端验证通过，可以正式使用
- **上次动手时间**：2026-07-21
- **上次做了什么**：
  - 在 Windows 11 上完成了完整的首次搭建流程：Fork → clone → 套用自定义
    改动 → 替换用户名占位符 → 本地验证（`tsc`/`build` 均通过）→ 提交推送
    （`LeiD215/override-rules`）→ 启用 GitHub Actions → 发布 `src-v2.5.6`
    （对应产物版本 `v2.5.6`）→ Release Artifacts 工作流跑通
  - **实测确认最终订阅链接可正常访问**：
    `https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js`
  - 更正了之前记录里一处不准确的信息：最终链接不需要 `@dist` 后缀，jsDelivr
    不带 `@` 版本号时默认取最新 tag，发布脚本会自动把不带 `src-` 前缀的纯
    版本号 tag（如 `v2.5.6`）指向最新产物，所以裸链接会自动跟着每次发布更新；
    锁定某个具体版本用 `@v2.5.6` 这种格式（不是 `@src-v2.5.6`）
- **当前跟踪的上游版本**：Fork 时的 `main` 分支（对应 upstream release v2.5.5，
  2026-06-30）
- **下一步待办**：
  - [x] 在 GitHub 上实际执行 Fork（`LeiD215/override-rules`）
  - [x] 把本地改动 push 上去
  - [x] 替换 `MyDirectCDN` provider 的 `YOUR_GITHUB_USERNAME` 占位符
  - [x] 启用 GitHub Actions
  - [x] 跑 `npm version patch` 触发首次发布，`dist` 分支产出正常
  - [x] 最终链接实测可正常访问
  - [ ] 在 Sub-Store 里把订阅脚本换成这个新链接，实测生成的完整配置（含真实
        节点）符合预期——**这是唯一还没做的验证，做完就可以正式让 hermes
        接手日常维护了**
  - [ ] 交给 hermes 前，先让它做一次小任务（比如往
        `ruleset/MyDirectCDN.list` 加一个域名）验证它有没有按
        `override-rules-fork-ops` Skill 的规矩执行

> 如果时隔很久重新打开这个项目：
> 1. 先看这一节，了解当前进度
> 2. 再看 `_fork/CHANGELOG.md`，按时间倒序过一遍做过什么
> 3. 有疑惑就去 `_fork/adr/` 找对应的决策记录（尤其是 ADR-0003，说明了这个
>    项目为什么长这个样子）
> 4. 要动手前，先读 `_fork/SOP.md`
