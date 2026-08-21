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
最新已发布版本: v2.5.16（2026-08-13 发布；dist 分支对应的 convert.min.js）
main 分支最新提交: 18848ec（dist HEAD = v2.5.16 tag，src HEAD = 4faa790「fix(proxy-groups): AI服务 / AI故障转移 跨 fork 用户通用化」+ 18848ec「docs(_fork): CHANGELOG 补 wd(wdr) 验证记录 + release 后续验证状态」）
远端 tag:
  - src-v2.5.16（最新 src tag，指向 4faa790）
  - src-v2.5.15
  - src-v2.5.14
  - src-v2.5.13
  - src-v2.5.12
  - src-v2.5.11
  - src-v2.5.10 及更早
  - v2.5.16（dist 分支，最新发布；指向 4042fbc）
  - v2.5.15（dist 分支）
  - v2.5.14（dist 分支）
  - v2.5.13（dist 分支）
  - v2.5.12（dist 分支）
  - v2.5.11（dist 分支）
最终产出链接: https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js
dist 分支: https://github.com/LeiD215/override-rules/tree/dist
GitHub Release: https://github.com/LeiD215/override-rules/releases/tag/v2.5.16
维护者: Hermes Agent（LeiD998），GitHub 账号 LeiD215
接手日期: 2026-07-21
记录体系: blackbox（2026-07-24 从 logbook 迁移）
Sub-Store 真实配置: 见 _fork/USER_SUB_STORE_CONFIG.md（5 变量:grouptype=0&fakeip=true&regex=true&threshold=1&ipv6=true）
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
| `ruleset/MustReject.list` 改名后未感知：ruleset/ 目录不在 src/ 或 icons/ 下，但 v2.5.14 加新 rule-provider（MustReject）时，CI 端 `release.yaml` 的 `Validate source` step 只跑 typecheck+format+lint，没验证 `src/rule_providers.ts` 里的新 provider key 跟 `ruleset/*.list` 文件名一致；未来如果重命名 `.list` 但忘了同步 `src/rule_providers.ts` 会沉默上线 | 未解决 |
| pre-commit hook 覆盖范围不全，漏检 ruleset/ 目录：当前 `.husky/pre-commit` 只对 `src/` 和 `icons/` 改动强制伴生 `_fork/CHANGELOG.md`；`ruleset/*.list` 改动（例 v2.5.14 的 6 条 MaaS/DeepSeek/MiniMax + 2 条 tuna/aliyun）完全无强制记录机制，只能靠 lint-staged prettier 自动跑（前提是文件能被 prettier 解析——`.list` 当前不在 prettier config 里所以也跑不到），存在"改了 ruleset 又忘记写 CHANGELOG"的静默路径 | 未补 |
| 缺一个架构 ADR 说明 pre-commit hook 为什么只覆盖 src/ + icons/，以及 ruleset/ 是否也需要纳入：决定本身有"业务规则源码 vs 数据清单"的二分考量（src/ 是代码，ruleset/ 是数据），但 fork 没有正式记录这个判断，未来维护者（人或 agent）接手时容易重复踩坑 | 未补 |
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

（2026-08-13）AI 服务组跨 fork 用户通用化修复 + v2.5.16 release：

- 08:25–08:30 UTC：诊断 wmr / wd 订阅生成的 yaml 解析失败原因 — `AI_PREFERRED_NODES` 硬编码 5 个 dllxr1r 专属节点名（`US-LAX-Bwh1-VLRV-dllxr1` 等），wmr/wd 订阅里这 5 个节点名都不存在 → mihomo 报 `proxy group[5]: AI故障转移: use or proxies missing`
- 08:30–08:50 UTC：用户决定修复方案 — AI_SERVICE / AI_FALLBACK 改成引用 fork 自动生成的国家分组（"美国节点" / "日本节点" / "香港节点"），不再硬编码具体节点名。香港节点保留在 AI_SERVICE 列表底部兜底（不进 AI_FALLBACK）
- 08:50–08:53 UTC：3 处 src 改动（删 `AI_PREFERRED_NODES` / `AI_HK_FALLBACK_NODES` 常量 + 改 AI_SERVICE.proxies + 改 AI_FALLBACK.proxies）
- 08:53 UTC：本地 build 成功（typecheck + esbuild，convert.min.js 21220 → 21129 字节，−91 字节因删常量数组）
- 08:53–08:55 UTC：用 dllxr1r（14 节点）+ wmr（12 节点）双订阅实际跑 convert.min.js 验证 — AI_SERVICE/AI_FALLBACK 都正确引用国家分组，"美国节点"/"日本节点"/"香港节点" 组都正确生成（dllxr1r 各 4/6/4，wmr 各 4/4/4）
- 08:55 UTC：commit 4faa790（src 改动）+ push origin main
- 08:55–08:56 UTC：打 tag `src-v2.5.16` + push，CI release workflow 跑完 success（run 31684254317，32s），dist 分支 HEAD = `4042fbc`，GitHub Release v2.5.16 创建（3 个 asset）
- 08:56–08:58 UTC：用户提供 wd 订阅 URL（share/file/wdr，3A3tpYM2h0WhfrMtVemSc），实际跑验证 — 12 节点命名格式与 wmr 完全一致（`XX-XXX-wd-*`），AI_SERVICE/AI_FALLBACK proxies 与 dllxr1r/wmr 相同
- 08:58 UTC：commit 18848ec（CHANGELOG 补 wd 验证记录）+ push origin main

详见 _fork/CHANGELOG.md（最后 10 条记录按时间正序）。

（2026-08-21）新增 volces.com 强制直连规则：

- 在 `ruleset/MustDirect.list` 末尾追加 `DOMAIN,ark.cn-beijing.volces.com`（火山引擎方舟大模型服务）
- 该 provider 已由 `src/rule_providers.ts` 的 `MustDirect` 引用（`@main/ruleset/MustDirect.list`），key 与文件名一致，无需改源码
- 本次只改 `.list` + CHANGELOG/STATUS 记录，未改任何 `src/*.ts` 源码，故无产物生成

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
- [x] 修复 AI服务 / AI故障转移 跨 fork 用户通用化（fork 服务 3 个独立 Sub-Store 用户 dllxr1r/wmr/wd，wmr/wd 之前因 dllxr1r 专属节点硬编码导致 yaml 解析失败），发布 v2.5.16（2026-08-13）
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
