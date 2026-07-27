<!--
🔒 占用中标记放在这里（写之前加、写完删）：
🔒 占用中 | 谁: xxx | 从: YYYY-MM-DD HH:MM 时区缩写 (UTC±N) | 打算做: 一句话 | 预计时长(TTL): 30分钟

超时（预计时长到了还没清除）视为失效，下一个人可以强制接管，
但要在 CHANGELOG 留一笔"接管了过期的锁"。

任何会碰这个文件的 AI agent，第一步必须是检查这行标记还在不在、是否已过期。
-->
🔒 占用中 | 谁: Hermes Agent (LeiD998) | 从: 2026-07-27 09:23 UTC (UTC+0) | 打算做: 改 Apple/Microsoft 服务组默认走 DIRECT（候选列表保留代理选项） | 预计时长(TTL): 30分钟

# 现状速览

## 关键事实

```yaml
仓库地址: https://github.com/LeiD215/override-rules
上游地址: https://github.com/powerfullz/override-rules
最新已发布版本: v2.5.10（dist 分支对应的 convert.min.js；2026-07-25 补一次发布，让之前合并进 main 的 MustDirect/MustProxy 功能真正生效）
main 分支最新提交: f799955（chore(release): 2.5.10）
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
| MustDirect/MustProxy 名单为空，骨架已就位但无实际内容 | 已解决（2026-07-24 已加 llm-api.net 一条；2026-07-25 补发布 v2.5.10 后规则真正生效） |

## 当前阶段

bug 修复（低倍率节点残留引用）、文档体系迁移（logbook → blackbox）、强制覆盖功能（MustDirect/MustProxy，含首发实际内容 llm-api.net）均已落地并发布 v2.5.10。项目进入日常维护状态。

## 上次做了什么

（2026-07-24 → 2026-07-25）完成强制直连/强制代理覆盖功能并真正发布：
- 2026-07-24：新增 MustDirect/MustProxy 两个空名单 provider（合并进 main），并写入第一条实际内容 llm-api.net
- 2026-07-25：补一次发布 v2.5.10（之前两次误判"内容为空/只加一条数据不需要发布"，漏了"rule-provider 引用本身要靠发布才能编译进 convert.min.js"），让功能真正生效
详见 CHANGELOG。

## 下一步待办

- [x] 在 GitHub 上 Fork `powerfullz/override-rules`（`LeiD215/override-rules`）
- [x] 首次搭建全流程（Fork → clone → 套用改动 → 本地验证 → 提交推送 → 启用 Actions → 发布 `src-v2.5.6`）
- [x] 修复 MyDirectCDN provider 分支名 bug（`@master` → `@main`），发布 `src-v2.5.7`
- [x] cdnjs.cloudflare.com 直连规则测试，发布 `src-v2.5.8`
- [x] 执行纪律与安全红线落入 SOP
- [x] 修复"低倍率节点"分组移除后残留引用，发布 `v2.5.9`
- [x] 文档体系从 logbook 迁移到 blackbox
- [x] 新增 MustDirect/MustProxy 强制覆盖功能（含首发内容 llm-api.net，2026-07-25 补发布 v2.5.10 后真正生效）
- [ ] 同步上游更新（当前落后于 upstream，Fork 时基于 v2.5.5）
- [ ] 后续按需继续往 MustDirect/MustProxy 补充域名/IP

---

> 关键事实/项目状态/已知盲点表的任何变更，必须在 CHANGELOG 留一条对应记录。
> 叙事部分的措辞调整可以豁免。
>
> 如果时隔很久重新打开这个项目：
> 1. 先看这一节
> 2. 再看 CHANGELOG，按时间倒序过一遍
> 3. 有疑惑去 adr/ 找决策记录
> 4. 有 SOP.md 的话，动手前先读
