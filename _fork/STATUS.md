# 现状速览（收工前必须更新；开工时先核对是否仍准确，起止时间记在 CHANGELOG.md）

> 本文件是 `_fork/` 记录区专用，跟仓库根目录的 `README.md` 无关——那个是上游
> 项目自己在维护的说明文档，会随同步更新变动，不要在里面加我们自己的内容。

- **这是什么**：`powerfullz/override-rules` 的个人 Fork，按照 ADR-0003 的决定，
  自定义规则直接写在 `src/*.ts` 源码里，用项目自带的构建流程产出最终覆写脚本
- **当前阶段**：源码定制已完成第一版，本地验证通过，尚未推送到真实 GitHub 仓库
- **上次动手时间**：2026-07-21
- **上次做了什么**：
  - Fork 架构定型（ADR-0003），迁移了 ADR-0001（已废弃）、ADR-0002（更新实现位置）
  - 完成三处自定义修改并用真实节点数据验证通过：
    1. 静态资源规则集替换为自维护小名单（`ruleset/MyDirectCDN.list` +
       `src/rule_providers.ts` 的 `MyDirectCDN` + `src/rules.ts` 里挪到所有
       专属服务规则之后）
    2. AI服务策略组重做：手动固定 US-LAX-Bwh1 优先 + AI故障转移 fallback 兜底
       + 香港节点垫底保留（`src/proxy_groups.ts`）
    3. 移除低倍率节点分组（`src/proxy_groups.ts`，自建 VPS 用不上这个概念）
  - 本地跑通 `npm run build`，并用真实的 14 个节点数据调用产物的 `main()`
    函数验证：分组内容、规则顺序、rule-providers 列表全部符合预期
- **当前跟踪的上游版本**：Fork 时的 `main` 分支（对应 upstream release v2.5.5，
  2026-06-30）
- **下一步待办**：
  - [ ] 在 GitHub 上实际执行 Fork（`powerfullz/override-rules` → 自己账号下）
  - [ ] 把这份本地改动 push 上去
  - [ ] 把 `src/rule_providers.ts` 里 `MyDirectCDN` provider 的
        `YOUR_GITHUB_USERNAME` 占位符替换成实际用户名
  - [ ] 在 Fork 仓库启用 GitHub Actions（Actions 标签页里手动启用一次）
  - [ ] 跑 `npm version patch` 触发首次发布，确认 `dist` 分支产出正常
  - [ ] 拿到最终链接（`https://cdn.jsdelivr.net/gh/<用户名>/override-rules@dist/convert.min.js`），
        在 Sub-Store 里替换成这个链接，实测生成的订阅是否符合预期
  - [ ] 整理成可以交给 hermes 执行/维护的操作指南（`_fork/SOP.md` 已有草稿，
        待实际跑通一遍流程后再确认补全）

> 如果时隔很久重新打开这个项目：
> 1. 先看这一节，了解当前进度
> 2. 再看 `_fork/CHANGELOG.md`，按时间倒序过一遍做过什么
> 3. 有疑惑就去 `_fork/adr/` 找对应的决策记录（尤其是 ADR-0003，说明了这个
>    项目为什么长这个样子）
> 4. 要动手前，先读 `_fork/SOP.md`
