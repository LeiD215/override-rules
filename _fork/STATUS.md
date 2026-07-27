<!--
🔒 占用中标记放在这里（写之前加、写完删）：
🔒 占用中 | 谁: xxx | 从: YYYY-MM-DD HH:MM 时区缩写 (UTC±N) | 打算做: 一句话 | 预计时长(TTL): 30分钟

超时（预计时长到了还没清除）视为失效，下一个人可以强制接管，
但要在 CHANGELOG 留一笔"接管了过期的锁"。

任何会碰这个文件的 AI agent，第一步必须是检查这行标记还在不在、是否已过期。
-->

# 现状速览

## 关键事实

```yaml
仓库地址: https://github.com/LeiD215/override-rules
上游地址: https://github.com/powerfullz/override-rules
最新已发布版本: v2.5.13（2026-07-27 发布；dist 分支对应的 convert.min.js）
main 分支最新提交: cd08192（fix(icons): 新增 Adobe/Autodesk 图标）
远端 tag:
  - src-v2.5.13（最新，HEAD）
  - src-v2.5.12
  - src-v2.5.11
  - src-v2.5.10 及更早
  - v2.5.13（dist 分支）
  - v2.5.12（dist 分支）
  - v2.5.11（dist 分支）
最终产出链接: https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js
dist 分支: https://github.com/LeiD215/override-rules/tree/dist
维护者: Hermes Agent（LeiD998），GitHub 账号 LeiD215
接手日期: 2026-07-21
记录体系: blackbox（2026-07-24 从 logbook 迁移）
```

## 项目状态

`已完成维护中`

## 已知盲点

| 内容 | 状态 |
|---|---|
| 上游跟踪版本：Fork 时的 main 分支（对应 upstream release v2.5.5，2026-06-30），之后未同步过上游更新 | 未解决（仍落后于 upstream） |
| 之前两次发版误判（"内容为空/只加一条数据不需要发布"，漏了 rule-provider 引用本身要靠发布才能编译进 convert.min.js）导致 v2.5.10 实际是补发布 | 已解决（v2.5.10 已补发布；规则改写进 SOP.md，要求"任何 main 改动 → 立刻打 tag release，不区分内容多少"） |
| 之前 release workflow 没集成 git-cliff，靠 awk 抽 CHANGELOG 第一个数字版本号标题，导致 fork 5 commit 漏显示、CHANGELOG 日期段被当作"未受管" | 已解决（v2.5.12 release.yaml "Generate Release Notes" step 改为 `npx git-cliff --tag src-$VERSION --no-exec > RELEASE_NOTES.md`） |
| Autodesk 服务图标缺失（convert.min.js ADOBE/AUTODESK icon URL 引用 Koolson/Qure IconSet/Color/Adobe.png 等，但这些文件在上游并不存在） | 已解决（v2.5.13 fork 自身 icons/Adobe.png + icons/Autodesk.png，引用改为 `@main/icons/...`） |
| scripts/build.mjs 在 prettier --check 下报警（4 行 const 写法不符合 prettier 行宽，被 prettier --write 改成单行 const） | 未解决（不影响功能；未提交过修改；决定先不动 — 若未来 prettier --write 自动改也没影响） |
| `_fork/CHANGELOG.md` 今天 5 commit + 3 release + 2 issue 修复 + 1 图标修复的私有记录全部脱记超过 3 小时 | 已解决（2026-07-27 12:55 UTC 用户追问后批量补记） |
| 接管过期软锁：之前 STATUS.md 的 "🔒 占用中" 标记从 09:23 UTC 起占着、TTL 30 分钟早过、打算做的"改 Apple/Microsoft 服务组默认走 DIRECT"实际早就完成并覆盖到 commit 1e0a376，但锁没有清（被 task 1 的 commit 隐式完成） | 已解决（已接管并刷新标记；新建 task 标记"补记"，已落盘所有脱记记录） |

## 当前阶段

bug 修复（低倍率节点残留引用 + Adobe/Autodesk 图标 404）、文档体系迁移（logbook → blackbox）、强制覆盖功能（MustDirect/MustProxy）、自定义代理策略（task 1-4 四服务组默认策略 + Adobe/Autodesk 强制代理 + x-override-rules 元信息）、CI 修复（release.yaml 集成 cliff）、均已落地并发布 v2.5.13。项目进入日常维护状态。

## 上次做了什么

（2026-07-27）一次性完成 4 个 task 实施 + 3 个已知 issue 修复：

- 10:55–11:35 UTC：5 个 commit 落地（task 1-4 全套 + 物理迁移记录）
  - commit 7e6898c（docs 物理迁移 + STATUS 占位）
  - commit 1e0a376（feat: 自定义 4 服务组默认策略，task 1）
  - commit e0b2de4（chore: 月度同步 Autodesk 清单 + 脚本，task 3 的清单部分）
  - commit 7874a53（feat: yaml 顶部 x-override-rules 元信息 + 3 层 version fallback，task 4）
  - commit 24281ad（docs: 4 个 task 的 fork 内部变更日志）
  - 注：Adobe 规则 provider（task 2）合并在 commit 1e0a376 里，没单独拆 commit（按"无文件重叠"原则只能拆 5 个）
- 11:35–11:40 UTC：发布 v2.5.11（patch bump），release run 30263792088 ~1 分钟 success
- 12:00–12:10 UTC：发布 v2.5.12 — 修复 issue 1（release notes 没显示 fork commits：release.yaml 集成 cliff）+ 修复 issue 2（CHANGELOG.md 遗留 [2026-07-27] 段：cliff 重生成清除），commit 3c98b70，release run 30264884084 ~30 秒 success
- 12:45–12:55 UTC：发布 v2.5.13 — 修复 issue 3（Adobe/Autodesk 服务图标 404：fork 自身 icons/ 目录新增两个 PNG，icon URL 改为 fork 自身引用），commit cd08192 + 2 个 binary，release run 30267173175 ~20 秒 success
- 12:55 UTC：用户追问记录脱节，一次性把今天所有未落盘的 blackbox 记录补齐（含本条 STATUS.md 自身刷新）

详见 _fork/CHANGELOG.md（最后 9 条记录按时间正序）。

## 下一步待办

- [x] 在 GitHub 上 Fork `powerfullz/override-rules`（`LeiD215/override-rules`）
- [x] 首次搭建全流程（Fork → clone → 套用改动 → 本地验证 → 提交推送 → 启用 Actions → 发布 `src-v2.5.6`）
- [x] 修复 MyDirectCDN provider 分支名 bug（`@master` → `@main`），发布 `src-v2.5.7`
- [x] cdnjs.cloudflare.com 直连规则测试，发布 `src-v2.5.8`
- [x] 执行纪律与安全红线落入 SOP
- [x] 修复"低倍率节点"分组移除后残留引用，发布 `v2.5.9`
- [x] 文档体系从 logbook 迁移到 blackbox
- [x] 新增 MustDirect/MustProxy 强制覆盖功能（含首发实际内容 llm-api.net，2026-07-25 补发布 v2.5.10 后真正生效）
- [x] 自定义 4 服务组默认策略 + Adobe/Autodesk 强制代理规则（task 1+2+3，发布 v2.5.11）
- [x] 输出 yaml 顶部 x-override-rules 元信息（task 4，发布 v2.5.11）
- [x] 修复 release notes 显示 fork commits + CHANGELOG 段遗留问题（issue 1+2，发布 v2.5.12）
- [x] 修复 Adobe/Autodesk 服务图标 404（issue 3，发布 v2.5.13）
- [x] 补齐今天所有未落盘的 blackbox 记录（2026-07-27 12:55 UTC，用户追问触发）
- [ ] 同步上游更新（当前落后于 upstream，Fork 时基于 v2.5.5）
- [ ] 后续按需继续往 MustDirect/MustProxy 补充域名/IP
- [ ] （可选）scripts/build.mjs prettier 报警 — 已接受为技术债，不主动修复

---

> 关键事实/项目状态/已知盲点表的任何变更，必须在 CHANGELOG 留一条对应记录。
> 叙事部分的措辞调整可以豁免。
>
> 如果时隔很久重新打开这个项目：
> 1. 先看这一节
> 2. 再看 CHANGELOG，按时间倒序过一遍
> 3. 有疑惑去 adr/ 找决策记录
> 4. 有 SOP.md 的话，动手前先读
