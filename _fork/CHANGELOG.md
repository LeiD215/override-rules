# Changelog（`_fork/` 记录区专用）

> 跟仓库根目录的 `CHANGELOG.md` 无关——那个是上游项目用 `cliff.toml` + 自己的
> 发布流程自动生成的版本历史，不是给我们手写用的，塞进去下次自动生成时会被
> 覆盖或冲突。这份是我们自己的，专门记录"针对这份 Fork 做了哪些自定义"。

## [Unreleased]

## [2026-07-27] 新增：生成 yaml 的版本元信息（x-override-rules namespace）
- 开始：2026-07-27 11:30 UTC (UTC+0)
- 结束：
- 类型：新增 / 行为
- 对象：
  - `scripts/build.mjs`：3 层 fallback 读版本号（env > package.json > "unknown"）+ esbuild `define` 注入占位符
  - `src/main.ts`：声明 `__OVERRIDE_RULES_VERSION__` / `__OVERRIDE_RULES_SCHEMA__` 常量（编译期替换）；`main()` return 第一个键加 `x-override-rules` metadata 块
  - `src/types.ts`：新增 `OverrideRulesMeta` 接口 + `ClashConfig["x-override-rules"]?: OverrideRulesMeta` 字段
  - `.github/workflows/release.yaml`：在 build step 加 `env: OVERRIDE_RULES_VERSION: ${{ env.VERSION }}`
- 原因：用户希望"GitHub push 完 tag，能让客户端 yaml 里看到版本号"——客户端用户拿到订阅时一眼能看出 yaml 是哪个版本生成的、对应 GitHub release 哪个 tag。
- 关键设计决策：
  - **不能用 yaml 顶部注释**——`main()` 返回结构化对象，最终 yaml 是 Sub-Store 端 yaml.dump 序列化的，注释会被丢掉
  - **不能用 `_meta`**——不是 Clash 规范官方字段，第三方 yaml 渲染器兼容性不可保证
  - **使用 `x-override-rules`**——vendor-extension 命名空间，仿 OpenAPI / Docker compose 的 `x-` 前缀约定
  - **第一个键返回**——`eemeli/yaml` 默认按对象键插入顺序，排在第一 = 在 yaml 输出顶部
- 版本号来源（3 层 fallback）：
  1. 环境变量 `OVERRIDE_RULES_VERSION`（GitHub Actions release.yaml 注入，从 git tag `src-vX.Y.Z` 切割为 `vX.Y.Z`）
  2. `package.json` 的 `version` 字段（本地 dev / 手动 build）
  3. 兜底 `"unknown"`（任何环节异常都不会编造假数字——符合"时间戳真实数据原则"）
- schema 版本号：当前 = `"1"`，写死常量；未来 override-rules 配置格式有 breaking change 时递增
- 输出形态（客户端 yaml 顶部）：
  ```yaml
  x-override-rules:
    version: v2.5.11
    schema: "1"
    generator: override-rules

  mixed-port: 7890
  ...
  ```
- 不影响：
  - Clash 配置解析（`x-override-rules` 不是 clash 标准字段，所有 yaml 渲染器都会忽略或原样保留）
  - 路由规则 / 代理组 / DNS / TUN（这些字段完全没动）
  - task 1 / task 2 / task 3 的功能（已在同一次 build 里验证：苹果 DIRECT、Adobe REJECT、Autodsek 都在）
- 验证：
  - 3 层 fallback 三种场景全部 OK（env / package.json / "unknown"）
  - `npx tsc --noEmit` exit 0
  - `npm run build` exit 0
  - mock 节点跑 `main()` + `yaml.stringify()`，顶部确实出现 `x-override-rules: { version: 2.5.10, schema: "1", generator: override-rules }`
  - 极端场景（Sub-Store 端 yaml 库排序）也不会丢失 metadata，只是落到 yaml 末尾
- 撤回：
  - 从 `src/main.ts` 删 `VERSION/SCHEMA` 常量声明 + return 里的 `x-override-rules` 块
  - 从 `src/types.ts` 删 `OverrideRulesMeta` 接口和 `ClashConfig["x-override-rules"]` 字段
  - 从 `scripts/build.mjs` 删版本读取逻辑和 `define` 注入
  - 从 `.github/workflows/release.yaml` 删 `env: OVERRIDE_RULES_VERSION: ...`
- 第二阶段（暂缓，留待需要时再补）：
  - `x-override-rules.commit`（短 SHA）
  - `x-override-rules.build`（ISO 8601 时间戳）
- verified_by:
- author: ai


## [2026-07-27] 新增：Autodsek 服务 proxy-group + rule-provider + 月度同步脚本
- 开始：2026-07-27 10:35 UTC (UTC+0)
- 结束：
- 类型：新增 / 行为
- 对象：
  - `src/constants.ts`：新增 `AUTODESK: "Autodsek服务"`
  - `src/proxy_groups.ts`：新增 `PROXY_GROUPS.AUTODESK` group（select 类型）
  - `src/rule_providers.ts`：新增 `Autodesk` rule-provider
  - `src/rules.ts`：新增引用 `RULE-SET,Autodesk,Autodsek服务`
  - `scripts/sync-autodesk-list.sh`：新增（chmod +x，3 种用法）
  - `ruleset/Autodesk.list`：新增（558 条裸域名，sed 已去 `+.` 前缀）
  - cronjob `sync-override-rules-autodesk`：月度定时（每月 1 日 06:00 UTC），调脚本自动 commit ruleset/Autodesk.list
- 原因：用户希望将 Autodesk 工具域名默认阻断，可选切代理/直连。结构与 Adobe 服务组完全对称。
- 与 Adobe 服务组的区别（也是选 🅑 而非 🅓 的原因）：
  - `autodesk.list` 上游格式是 `+.domain.com`（**domain-suffix 简写**），而 `adobe-activation.list` 是裸域名
  - mihomo rule-provider `behavior: "domain"` 不能去 `+.` 前缀，必须**预处理**
  - 预处理用本地脚本（`scripts/sync-autodesk-list.sh`）做，sed `s/^[[:space:]]*\.//` + sort -u + 拼头注释
  - 因此选 plan B：本地副本 + 月度同步
- 数据流：
```
MetaCubeX/meta-rules-dat@meta/geo/geosite/autodesk.list (官方源，557 行 +.domain)
        │
        │ scripts/sync-autodesk-list.sh （去 +. 前缀 + sort -u）
        ▼
ruleset/Autodesk.list （本地副本，558 条裸域名，月度 cron 自动更新）
        │
        │ 客户端 interval: 2592000 (=30天) 自动拉
        ▼
rule-provider: Autodesk （mihomo 缓存到 ./ruleset/Autodesk.list）
        │
        ▼
RULE-SET,Autodesk,Autodsek服务  (rules.ts)
        │
        ▼
proxy-group "Autodsek服务"   (proxies: ["REJECT", "选择代理", "DIRECT"])
        │
        ▼
[ 高亮 REJECT = 阻断 ] [ 选择代理 ] [ DIRECT ]
```
- 关键决策：
  - 远拉 vs 本地副本：**远拉不行**，只能本地副本（详因见上）
  - cron 频率：月度（满足"定制任务"的要求）
  - provider `interval: 2592000` (=30天)：与 cron 频率同步，避免被客户端拉取时再用旧内容刷新（潜在冲突）
- 影响：
  - 新增 UI 图标入口 "Autodsek服务"，默认高亮 REJECT（阻断）
  - Autodesk 激活域名（123dapp.com / vredprofessional.com / xn--74q434dwff.net 等 558 条）走 REJECT
  - 用户可在 "Autodsek服务" group 切到 "选择代理" / "DIRECT"
- 不影响：现有任何 group / provider / 规则
- 撤回：
  - 从 `src/constants.ts` 删 `AUTODESK`、`src/proxy_groups.ts` 删 AUTODESK 块、`src/rule_providers.ts` 删 Autodesk provider、`src/rules.ts` 删引用
  - 删 `scripts/sync-autodesk-list.sh` 和 `ruleset/Autodesk.list`
  - cronjob action=remove job_id="9f433ab6d118"
- verified_by:
- author: ai


## [2026-07-27] 新增：Adobe 服务 proxy-group + rule-provider（默认 REJECT，可选代理/直连）
- 开始：2026-07-27 10:15 UTC (UTC+0)
- 结束：
- 类型：新增 / 行为
- 对象：
  - `src/constants.ts`：新增 `ADOBE: "Adobe服务"`
  - `src/proxy_groups.ts`：新增 `PROXY_GROUPS.ADOBE` group（select 类型）
  - `src/rule_providers.ts`：新增 `Adobe` rule-provider
  - `src/rules.ts`：新增引用 `RULE-SET,Adobe,Adobe服务`
- 原因：用户希望在客户端看到 "Adobe服务" 分组，默认阻断所有 Adobe 激活相关流量，仍允许用户在客户端手动切到代理/直连出口。源数据用上游 MetaCubeX/meta-rules-dat 官方维护的 `adobe-activation` geosite。
- 数据源：https://github.com/MetaCubeX/meta-rules-dat/blob/meta/geo/geosite/adobe-activation.list
  - 源格式：纯文本，每行一条裸域名（无 `DOMAIN-SUFFIX,` 前缀），共 133 行
  - **远程直拉**（🅓 方案），不复制到本仓库；上游一改客户端 `interval: 86400` 自动跟
- 修改：
  - `PROXY_GROUPS.ADOBE`（proxy_groups.ts 新增，位置在 MICROSOFT 后、XBOX 前）：
    - `type: "select"`
    - `proxies: ["REJECT", "选择代理", "DIRECT"]` — 第 1 位是 REJECT = 默认阻断
    - icon：`Koolson/Qure/IconSet/Color/Adobe.png`
  - `rule-providers.Adobe`：
    - `type: "http"` / `behavior: "domain"` / `format: "text"` / `interval: 86400`
    - `url: ${CDN_URL}/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/adobe-activation.list`
    - `path: ./ruleset/Adobe.list`（本地缓存路径，运行时 mihomo 写用，不入库）
  - 引用：`RULE-SET,Adobe,Adobe服务`（rules.ts line 44，介于 `RULE-SET,GFWList` 与 `GEOIP,cn,DIRECT` 之间）
- 关键决策（过程纠正记录）：
  - 初版尝试：从 `sing/geo/geosite/adobe-activation.json`（sing-box 格式）抓数据自转 classical text — ❌ 重复造轮子
  - 经查 MetaCubeX 官方在 `meta` 分支（mihomo）提供同源 `.list` / `.yaml` / `.mrs`，README 示例就是该分支；**直接远拉，是项目惯例的最优解**
- 影响：
  - 新增 UI 图标入口 "Adobe服务"，默认高亮 REJECT（阻断）
  - Adobe 激活域名（3dns-*.adobe.com / activate*.adobe.com / lmlicenses-wip*.adobe.com 等）按客户端默认配置走 REJECT（直接拒绝连接，不重置不复用）
  - 用户可在 "Adobe服务" 这个 group 里切到 "选择代理" / "DIRECT"，决定例外放行
- 不影响：任何现有 group / provider / 规则
- 撤回：删 `src/constants.ts` 那行 `ADOBE`、`src/proxy_groups.ts` 的 ADOBE 块、`src/rule_providers.ts` 的 Adobe provider、`src/rules.ts` 的引用即可
- verified_by:
- author: ai


## [2026-07-27] 修改：苹果服务 / 微软服务 proxy-group 默认走 DIRECT，保留候选代理
- 开始：2026-07-27 09:23 UTC (UTC+0)
- 结束：
- 类型：修改 / 行为
- 对象：`src/proxy_groups.ts` 第 152、164 行（`PROXY_GROUPS.APPLE` 和 `PROXY_GROUPS.MICROSOFT` 两个 proxy-group 的 `proxies` 数组）
- 原因：用户希望 apple/microsoft GEOSITE 域名默认走直连，但保留 UI 上手动切代理的能力。
- 修改：
  - `PROXY_GROUPS.APPLE`（line 152）：`proxies: defaultProxies` → `proxies: defaultProxiesDirect`
  - `PROXY_GROUPS.MICROSOFT`（line 164）：`proxies: defaultProxies` → `proxies: defaultProxiesDirect`
- 影响：
  - 这两个组的 `proxies` 数组第一位由"选择代理"（指向 AUTO 自动选最低延迟节点）改成 `"DIRECT"`，所以 mihomo 客户端启动时默认高亮第一项 = DIRECT，即开箱直连
  - 候选列表里仍包含 `<各国节点分组>`、`选择代理`、`手动选择`、`落地节点`（如有链式代理）等代理出口选项，用户在客户端可手动切回代理
  - `GEOSITE,google-play@cn,DIRECT` 和 `GEOSITE,microsoft@cn,DIRECT` 这两条原本就写死的直连规则不受影响
  - `PROXY_GROUPS.GOOGLE`（line 158）维持 `defaultProxies` 不动
- 不影响：`src/rules.ts`（规则本身）、`src/selectors.ts`（候选列表构造逻辑）、`src/main.ts`、`package.json`、`AGENTS.md`
- 撤回：把这两行改回 `proxies: defaultProxies` 即可
- author: ai
- verified_by:

## [2026-07-25] 修复：补一次发布 v2.5.10，让 MustDirect/MustProxy 真正生效

- 开始：2026-07-25 00:27 UTC (UTC+0)
- 结束：2026-07-25 00:31 UTC (UTC+0)
- 类型：修复
- 对象：整个发布流程（`package.json`、`scripts/changelog.mjs` 自动产物、GitHub Actions Release Artifacts 工作流、`dist` 分支上的 `convert.min.js`）
- 原因：之前两次误判"内容为空/只加一条数据，不需要发布"，漏了"rule-provider 引用本身要靠发布才能编译进 `convert.min.js`"——结果是 MustDirect/MustProxy 功能虽然合并进 main，却从未在已发布的产物中实际生效；客户端即使配置使用这个 Fork 也看不到强制覆盖能力
- 关联：
  - "新增：强制直连/强制代理覆盖名单"（2026-07-24，骨架合并进 main）
  - "新增：llm-api.net 强制直连规则"（2026-07-24，第一次实际填充 MustDirect.list 内容）
- 修改：
  - `package.json`：`2.5.9` → `2.5.10`（由 `npm version patch` 自动改）
  - `CHANGELOG.md`（根目录，上游自动生成的版本历史）：由 `scripts/changelog.mjs` 自动加一条 v2.5.10
  - 新增本地 tag `src-v2.5.10` 并推送
- 验证：通过
  - 三方对齐：本地 HEAD = 远端 main = `f79995544070f0203810c92247a1582b0556a9db`；tag `src-v2.5.10` 远端存在（`git ls-remote` + `gh api` 双源核对）
  - GitHub Actions Release Artifacts：run `30136346322`，`completed / success`，开始 `00:28:08Z`、结束 `00:28:46Z`（约 38 秒）
  - 构建产物功能验证（用真实节点数据跑 `main(config)`）：
    - rule-providers 包含 `MustDirect` 和 `MustProxy`（13 个 provider 都在）
    - rules 数组里有 `RULE-SET,MustDirect,DIRECT` 和 `RULE-SET,MustProxy,选择代理`，位置序列：GEOIP,private → MustDirect → MustProxy → ADBlock → AdditionalFilter
    - 低倍率节点分组依然不存在，所有分组的 proxies 候选列表里都没有引用它（无回归）
  - 最终链接：`https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js`，HTTP 200，20208 字节；`grep` 出 `MustDirect` × 4、`MustProxy` × 4、`低倍率节点` × 0
- 影响：客户端从下次 Sub-Store/客户端刷新起，将看到 MustDirect/MustProxy rule-provider 被引用，强制覆盖能力真正生效
- 撤回：否
- author: ai
- verified_by:

## [2026-07-24] 新增：llm-api.net 强制直连规则

- 开始：2026-07-24 11:04 UTC (UTC+0)
- 结束：2026-07-24 12:56 UTC (UTC+0)
- 类型：新增
- 对象：`ruleset/MustDirect.list`
- 原因：`llm-api.net` 未被 geosite 数据库收录，手动加入确保强制直连
- 关联：`"新增：强制直连/强制代理覆盖名单"`那条记录（这是它的第一次实际填充内容）
- 修改：在格式说明注释之后新增 `DOMAIN-SUFFIX,llm-api.net`
- 验证：通过
  - 格式验证脚本：通过；文件共 9 行，规则内容共 1 条，目标规则位于末行且仅出现一次，规则类型和逗号格式符合说明注释
  - 直连访问：`curl --noproxy '*'` 请求 `https://llm-api.net/` 返回 HTTP 200；解析并直连到 `15.204.105.133`，总耗时约 1.07 秒
  - `git diff --check`：通过
  - `src/` 改动检查：无改动，因此按任务要求不运行 tsc/build
- 影响：仅增加一条 rule-provider 数据源规则；不涉及 `src/` 目录代码改动，不需要运行 tsc/build
- 撤回：否
- author: ai
- verified_by:

## [2026-07-24] 文档：收尾更新 STATUS.md（关键事实/盲点表/当前阶段/上次做了什么/下一步待办）

- 开始：2026-07-24 08:43 UTC (UTC+0)
- 结束：2026-07-24 08:44 UTC (UTC+0)
- 类型：修改 / 文档
- 对象：`_fork/STATUS.md`
- 原因：低倍率节点 bug 修复 + blackbox 迁移 + 强制直连/代理功能这一整条工作线都已落地 main，需要同步更新 STATUS.md 的状态描述
- 关联：紧随 2026-07-24"新增：强制直连/强制代理覆盖名单"那条记录
- 修改：
  - 关键事实区：拆分为"最新已发布版本"（v2.5.9）和"main 分支最新提交"（4c10aeb）两条，明确 main 已超前于已发布版本
  - 已知盲点表：把"上游跟踪版本"那条从"已补"改回"未解决"（迁移时误标），新增 MustDirect/MustProxy 名单为空这一条
  - 当前阶段：更新为反映三条工作线都已完成
  - 上次做了什么：更新为强制直连/代理功能骨架已落地的描述
  - 下一步待办：标记新增功能骨架为已完成；新增一条 MustDirect/MustProxy 待补充名单的待办
- 验证：不适用（纯文档更新）
- 影响：无
- 撤回：否
- author: ai
- verified_by:

## [Unreleased]

## [2026-07-24] 新增：强制直连/强制代理覆盖名单

- 开始：约 2026-07-24 14:30 左右 CST (UTC+8)
- 结束：约 2026-07-24 14:35 左右 CST (UTC+8)
- 类型：新增
- 对象：`src/rule_providers.ts`, `src/rules.ts`, `ruleset/MustDirect.list`, `ruleset/MustProxy.list`
- 原因：需要一组不受其他规则影响的强制覆盖名单，优先级高于广告拦截、GFWList、所有服务专属分组等一切业务规则，但低于私有内网直连（保留内网安全兜底）
- 关联：无
- 修改：
  - `src/rule_providers.ts`：新增 MustDirect 和 MustProxy 两个 rule-provider 定义
  - `src/rules.ts`：在 baseRules 数组中，GEOIP,private 之后、ADBlock 之前插入两条规则
  - `ruleset/MustDirect.list`：新建空名单，包含格式说明注释
  - `ruleset/MustProxy.list`：新建空名单，包含格式说明注释
- 验证：通过
  - `npx tsc --noEmit`：无类型错误
  - `npm run build`：构建成功
  - 功能验证：用真实节点数据调用 main(config)，确认 rules 数组中 MustDirect/MustProxy 位置正确（private 之后、ADBlock 之前），rule-providers 中包含这两个新 provider
- 影响：未触碰根目录 README.md / CHANGELOG.md、_fork/STATUS.md、ADR 目录、构建产物 convert.js / convert.min.js / yamls/
- 撤回：否
- author: ai
- verified_by:

## [Unreleased]

### 修复：彻底清理"低倍率节点"分组移除后残留的死代码链

- 开始：2026-07-22 11:10 UTC (UTC+0)
- 结束：2026-07-22 11:18 UTC (UTC+0)
- 类型：修复
- 对象：`src/constants.ts`, `src/node_parser.ts`, `src/main.ts`, `src/types.ts`, `src/selectors.ts`
- 关联：紧随 2026-07-22 的"修复：selectors.ts 仍引用已删除的低倍率节点分组"那次修复——selectors.ts 那一刀只堵住了一个出口，`lowCostNodes` / `LOW_COST_NODE_MATCHER` / `LOW_COST` 在五个文件里形成的是一条完整的死代码链，不一次性清掉，下次同步上游或改代码时很容易再撞到第二个、第三个坑
- 原因：iOS 客户端（Clash Mi）启动报 `proxy group[6]: 选择代理: '低倍率节点' not found`；阶段 1 只删了 selectors.ts 第 23 行的判断和三处 `lowCost && PROXY_GROUPS.LOW_COST` 调用，但常量定义、解析函数、类型声明、调用方传参都没动；本次按用户确认的方案做全量清理
- 修改：
  - `src/constants.ts`：删除 `LOW_COST_NODE_MATCHER` 常量定义、`PROXY_GROUPS` 对象里的 `LOW_COST: "低倍率节点",` 行、顶部 `createCaseInsensitiveNodeMatcher` 的导入（保留 `utils.ts` 里 helper 函数本身的定义，未来可能还要用）
  - `src/node_parser.ts`：删除 `parseLowCost` 函数及其 JSDoc 注释；`LOW_COST_NODE_MATCHER` 改为只导入 `countriesMeta`
  - `src/main.ts`：从 `./node_parser` 的导入里删掉 `parseLowCost`；删除 `const lowCostNodes = parseLowCost(...)`；`buildBaseLists({...})` / `buildProxyGroups({...})` 两个对象字面量里各删掉 `lowCostNodes,` 这一行
  - `src/types.ts`：`BuildBaseListsInput` 和 `BuildProxyGroupsInput` 两个接口里各删掉 `lowCostNodes: ProxyNode[];` 这一行
  - `src/selectors.ts`：删除 JSDoc 里的 `@param input.lowCostNodes - 低价节点名称列表` 这一行（selectors.ts 代码本身已在阶段 1 修复中清掉，本条只补这一行注释的清理）
- 验证：通过
  - `npx tsc --noEmit`：无类型错误
  - `npm run build`：构建成功，产物包含 `convert.js` / `convert.min.js`
  - `npm run lint`：通过
  - 功能验证：14 个真实节点数据调用 `main(config)`，`proxy-groups=34`、"低倍率节点"分组不存在、所有候选列表无残留引用、AI 服务 9 个 / AI 故障转移 5 个候选完整保留、选择代理/自动选择/故障转移三个基础分组候选列表正确
  - 全文搜索确认：`src/` 下已无 `lowCost` / `LowCost` / `LOW_COST` / `parseLowCost` 任何残留
- 状态：本地分支 `fix/remove-lowcost-dead-refs`，阶段 1（`8d28272`）+ 阶段 2（`70d6d71`）两次本地提交都在该分支上，待用户验收后一次性 push
- 影响：未触碰根目录 `README.md` / `CHANGELOG.md`、`_fork/STATUS.md`、ADR 目录、构建产物 `convert.js` / `convert.min.js` / `yamls/`
- 撤回：否
- author: ai
- verified_by:

### 修复：src/selectors.ts 仍引用已删除的"低倍率节点"分组（本次修复的第一刀，仅 selectors.ts）

- 开始：2026-07-22 11:05 UTC (UTC+0)
- 结束：2026-07-22 11:07 UTC (UTC+0)
- 类型：修复
- 对象：`src/selectors.ts`
- 关联：2026-07-21"移除低倍率节点分组"那条记录的遗漏修复；本次只堵住了 selectors.ts 一个出口，紧随的"全量清理"条目会把整条死代码链一次性清掉
- 原因：iOS 客户端（Clash Mi）启动报 `proxy group[6]: 选择代理: '低倍率节点' not found`；2026-07-21 移除"低倍率节点"分组时只改了 `src/proxy_groups.ts`，漏改了 `src/selectors.ts`：因为订阅使用正则过滤模式（`regexFilter=true`），`const lowCost = lowCostNodes.length > 0 || regexFilter;` 恒为 true，导致"选择代理/自动选择/故障转移"三个基础分组候选列表继续引用一个不存在的分组
- 修改（按用户给定的方案执行）：
  1. `src/selectors.ts` 的 `buildBaseLists` 函数参数解构中删除 `lowCostNodes`
  2. 删除 `const lowCost = lowCostNodes.length > 0 || regexFilter;` 这一行
  3. `defaultSelector` / `defaultProxies` / `defaultProxiesDirect` 三个 `buildList(...)` 调用里各自删除 `lowCost && PROXY_GROUPS.LOW_COST,` 这一行参数
- 验证：通过
  - `npx tsc --noEmit`：通过
  - `npm run build`：构建成功
  - 功能验证：用真实节点数据调用构建产物，核对"低倍率节点"分组不存在、所有分组候选列表无残留引用
- 状态：作为独立提交已完成本地验证和构建验证；遗留的 `lowCostNodes` / `LOW_COST_NODE_MATCHER` / `LOW_COST` 死引用由紧随的全量清理条目处理
- 影响：未触碰根目录 `README.md` / `CHANGELOG.md`、`_fork/STATUS.md`、ADR 目录、构建产物、`src/constants.ts` / `src/node_parser.ts` / `src/main.ts` / `src/types.ts`（这些文件的死引用由紧随的全量清理条目单独处理）
- 撤回：否
- author: ai
- verified_by:

### 新增/文档：执行纪律与安全红线正式落入项目 SOP

- 开始：2026-07-22 10:55 UTC (UTC+0)
- 结束：2026-07-22 10:56 UTC (UTC+0)
- 类型：新增 / 文档
- 对象：`_fork/SOP.md`
- 原因：把原本只存在于 Hermes memory 里的操作要求正式落到项目文档里，让仓库自身可以独立说明这些规矩
- 修改：在"🚫 红线"之后新增"执行纪律与安全红线"，覆盖多步骤任务逐步执行与汇报、本地提交经确认后再 push、凭据不得进入对话、仓库限定 Fine-grained Personal Access Token，以及 push 后必须完成远端分支/tag/Actions/构建产物/最终规则内容验证
- 验证：不适用
- 状态：文档已修改，等待本地提交和用户验收；按新规暂不 push
- 撤回：否
- author: ai
- verified_by:

### 项目接手记录：Hermes / LeiD998 开始负责 Fork 日常维护

- 开始：2026-07-21 13:33 UTC (UTC+0)
- 结束：2026-07-21 13:33 UTC (UTC+0)
- 类型：决策
- 对象：`_fork/` 整个记录区
- 原因：正式接手 `LeiD215/override-rules` 项目的日常维护
- 修改：接手者 Hermes Agent（LeiD998），接手范围包括后续规则清单、`src/*.ts` 定制、上游同步、本地验证、版本发布和 GitHub Actions 产物核验
- 验证：不适用
- 状态：已完成首次小型规则变更测试并完成端到端发布验证，后续可直接按本记录区继续维护
- 撤回：否
- author: ai
- verified_by:

### 测试任务：加入 cdnjs.cloudflare.com 直连规则

- 开始：2026-07-21 13:39 UTC (UTC+0)
- 结束：2026-07-21 13:47 UTC (UTC+0)
- 类型：新增 / 修复
- 对象：`ruleset/MyDirectCDN.list`, `src-v2.5.8`
- 原因：验证 hermes 是否按 `_fork/SOP.md` 执行一个小型规则变更、类型检查、构建和 Fork 发布流程
- 修改：在 `ruleset/MyDirectCDN.list` 加入 `cdnjs.cloudflare.com`，并记录 2026-07-21 HTTP HEAD 返回 200
- 验证：通过
  - 类型检查：`npx tsc --noEmit` 成功
  - 构建：`npm run build` 成功；`npm run artifacts` 成功，生成 192 个 YAML 文件
  - 功能验证：模拟 3 个节点调用 `convert.js` 的 `main(config)` 成功；`MyDirectCDN` provider、规则 URL 和 `RULE-SET,MyDirectCDN,DIRECT` 均正确
- 状态：本地验证完成；发布推送受当前环境缺少 GitHub 凭据阻塞
- 影响：发布准备：`npm version patch` 已通过 lint/typecheck，生成本地提交 `d9d098e` 和 tag `src-v2.5.8`；发布阻塞：`postversion` 的 `git push --follow-tags` 因无 HTTPS/SSH GitHub 凭据失败；远端 `main` 仍未包含本次改动，远端 `src-v2.5.8` 也尚未存在；未触碰根目录 `README.md`、`_fork/STATUS.md`、所有 ADR、构建产物未被手工编辑
- 撤回：否
- author: ai
- verified_by:

## [2026-07-21] 修复：MyDirectCDN provider 分支名写错（master → main）

- 开始：2026-07-21 12:36 UTC (UTC+0)
- 结束：2026-07-21 12:36 UTC (UTC+0)
- 类型：修复
- 对象：`src/rule_providers.ts`, `src-v2.5.7`
- 原因：Sub-Store 生成的配置里 `MyDirectCDN` rule-provider 一直存在，但客户端规则提供者面板显示不出内容 / 拉取的还是旧版本。排查发现两层问题：1. `src/rule_providers.ts` 里 `MyDirectCDN` 的 URL 写的是 `@master` 分支，但实际查证上游仓库真实分支只有 `dist`/`main`/`preview`，根本没有 `master`——这是抄了 TikTok/EHentai 等原有条目的写法但没核实分支名是否正确导致的失误；2. 改完重新发布（`src-v2.5.7`）之后，Sub-Store 那边缓存了旧版本脚本内容，没有自动感知更新，需要手动在 Sub-Store 后台刷新脚本条目才拉到新版本
- 修改：`src/rule_providers.ts`：`MyDirectCDN` 的 URL 从 `@master` 改成 `@main`；发布新版本 `src-v2.5.7` 使修改生效
- 验证：通过
  - Sub-Store 手动刷新脚本条目后，重新生成订阅，`MyDirectCDN` provider 的 `url` 字段确认变成了 `@main`
  - 客户端"规则提供者"面板确认能看到 `MyDirectCDN`，显示 5 条规则（对应 `ruleset/MyDirectCDN.list` 里的 5 个域名），端到端验证通过
- 影响：经验教训：抄现有代码的写法时，不能默认"能用"就是"对的"，尤其涉及外部 URL/分支名这种容易长期不出问题、直到真正被拉取才暴露的地方，应该主动核实；Sub-Store/客户端存在脚本内容缓存，改完上游脚本后如果订阅端没反应，先怀疑缓存没刷新，而不是急着怀疑代码逻辑本身
- 撤回：否
- author: ai
- verified_by:

## [2026-07-21] 端到端验证通过 + 修正最终链接格式

- 开始：2026-07-21 12:24 UTC (UTC+0)
- 结束：2026-07-21 12:24 UTC (UTC+0)
- 类型：修复 / 文档
- 对象：`_fork/STATUS.md`, `_fork/SOP.md`
- 原因：在 Windows 11 上完整走了一遍首次搭建流程：Fork → clone → 套用改动 → 替换占位符 → 本地 `tsc`/`build` 验证 → 提交推送 → 启用 Actions → `npm version patch` 发布 `src-v2.5.6` → Release Artifacts 工作流跑通；最终链接 `https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js` 实测可正常访问
- 修改：更正 `_fork/STATUS.md`/`_fork/SOP.md` 里此前写错的最终链接格式：不需要 `@dist` 后缀。查看真实的 `.github/workflows/release.yaml` 后确认：发布脚本会把一个不带 `src-` 前缀的纯版本号 tag（如 `v2.5.6`）强制指向最新产物，jsDelivr 不带 `@` 版本号时默认取最新 tag，所以裸链接会自动跟着每次发布更新
- 验证：通过
- 影响：无
- 撤回：否
- author: ai
- verified_by:

## [2026-07-21] Fork 架构定型 + 完成首版自定义

- 开始：2026-07-21 12:15 UTC (UTC+0)
- 结束：2026-07-21 12:15 UTC (UTC+0)
- 类型：新增 / 修改 / 移除 / 决策
- 对象：`_fork/adr/0003-fork-upstream-typescript-source.md`, `src/rule_providers.ts`, `ruleset/MyDirectCDN.list`, `src/proxy_groups.ts`, `src/rules.ts`, `_fork/` 整个记录区
- 原因：推翻 ADR-0001 独立后处理项目的方向，改用官方推荐的 Fork + `src/*.ts` 源码定制方案
- 修改：
  - 新增：`_fork/adr/0003-fork-upstream-typescript-source.md`（推翻 ADR-0001）
  - 新增：`src/rule_providers.ts` 新增 `MyDirectCDN` provider，移除 `StaticResources`/`CDNResources`/`AdditionalCDNResources` 三个上游远程大列表
  - 新增：`ruleset/MyDirectCDN.list` 自维护直连域名清单，起点 5 个国内 CDN 镜像（staticfile.org/staticfile.net/bootcdn.net/bootcss.com/baomitu.com）
  - 新增：`src/proxy_groups.ts` 新增 `AI故障转移` fallback 分组（探测 chatgpt.com，interval 300 秒，候选为美/日 5 个 Reality 节点）
  - 新增：`_fork/` 整个记录区（STATUS.md / CHANGELOG.md / adr/ / SOP.md）
  - 修改：`src/rules.ts` 把 `RULE-SET,MyDirectCDN,DIRECT` 放在所有专属服务规则之后（不是像上游原来那样放最前面），从源头避免"抢跑"问题，不需要运行时补丁
  - 修改：`src/proxy_groups.ts` 的 `AI服务` 分组改为手动选择为主，US-LAX-Bwh1 排最前，美/日节点在前、香港节点垫底保留
  - 移除：`src/proxy_groups.ts` 移除"静态资源"策略组本身（已经没有规则会命中它）
  - 移除：`src/proxy_groups.ts` 移除"低倍率节点"分组及相关的 `lowCostNodes`/`LOW_COST_NODE_MATCHER` 未使用引用
- 验证：通过
  - `npx tsc --noEmit`：无类型错误
  - `npm run build`：构建成功，产出 `convert.js`/`convert.min.js`
  - 用真实的 14 个节点数据（用户实际的 7 台自建 VPS，Reality+XHTTP 两种协议变体）调用产物的 `main(config)` 函数，核对结果：`AI服务`/`AI故障转移` 分组内容和顺序符合预期；`静态资源`/`低倍率节点` 分组已不存在；`rule-providers` 列表正确（少了 3 个，多了 `MyDirectCDN`）；`RULE-SET,MyDirectCDN,DIRECT` 排在所有专属服务规则之后
- 影响：关联 ADR-0001（已废弃）, ADR-0002（更新实现位置）, ADR-0003
- 撤回：否
- author: ai
- verified_by:

## [2026-07-24] 文档迁移：从 logbook 风格迁移到 blackbox 格式

- 开始：约 2026-07-24 14:30 左右 (UTC+8)
- 结束：约 2026-07-24 14:30 左右 (UTC+8)
- 类型：修改 / 文档
- 对象：`_fork/STATUS.md`, `_fork/CHANGELOG.md`, `_fork/SOP.md`, `_fork/adr/*.md`, `_fork/adr/README.md`, `_fork/故障案例库.md`
- 原因：用户要求将项目的记录方式从 logbook 风格迁移到 blackbox 格式，统一项目记录的触发规则和字段规范
- 修改：
  - STATUS.md：改成 blackbox 格式（关键事实区/项目状态枚举/已知盲点表/软锁标记）
  - CHANGELOG.md：改成 blackbox 格式（字段调整、时间戳格式统一）
  - SOP.md：日常执行规则改成引用 blackbox 通用规则
  - ADR-0001/0002/0003：状态字段改英文枚举 + 三个必选字段
  - 新建 adr/README.md（决策索引表）
  - 新建 故障案例库.md（2 个案例）
- 验证：不适用
- 影响：无
- 撤回：否
- author: ai
- verified_by:
