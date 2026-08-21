# ADR-0004：根 README.md 保持 upstream 原样不动

- **状态**：已采纳
- **日期**：2026-08-07

## 背景 Context

Fork 自 `powerfullz/override-rules` 的 `LeiD215/override-rules` 仓库，根目录 `README.md` **完全沿用 upstream 原文**——所有 `convert.min.js` URL、YAML 索引链接、jsDelivr badge、L3zc 镜像链接、博客引用（如 `blog.l3zc.com/2026/05/dns-leak-misunderstanding/`）都仍然指向 upstream powerfullz 或其作者控制的基础设施。

这造成一个表面上的矛盾：

- fork 已经有自己独立的 release（v2.5.x），有自己 fork-only 的规则（Adobe/Autodesk 强制代理、MustReject 强制阻断层、清华 TUNA/阿里云镜像直连等），有自己 fork 的 `icons/` 目录（Adobe.png、Autodesk.png）
- 但 fork 的根 README **没有**写「Fork 说明」「Fork 自己的 convert.min.js URL」「跟 upstream 的差异」等任何段落
- 下次接手 fork 的人（或 agent）打开根 README 会困惑：这是 fork 还是 upstream？应该用 upstream URL 还是 fork URL？

`_fork/USER_SUB_STORE_CONFIG.md`（2026-08-07 新建）已经显式提到「根 README L41/L83/L89 还在引用 upstream（fork 没有改这里，跟 SOP 红线"不动根 README"有关）」——但**这个 SOP 红线本身没有正式文档化**，只在 USER_SUB_STORE_CONFIG.md 旁注里口头提到一次。需要正式记录成 ADR。

## 考虑过的选项 Options Considered

### 选项 1：完全沿用 upstream README（**已选**）

- **优点**：
  - 零维护负担：upstream README 升级时 merge 永远无冲突（fork 只 cherry-pick 业务代码改动，不动 README）
  - 跟 upstream 保持单向同步：upstream 是真相之源，fork 是带定制的子集
  - 用户从 upstream 文档跳过来时认知一致
- **缺点**：
  - 首次接触 fork 的人会有"这是 fork 还是 upstream"的认知模糊期

### 选项 2：在根 README 顶部加 Fork 说明段

- **优点**：用户一目了然这是 fork
- **缺点**：
  - 每次 upstream 升级 README 时需要保留 fork 段、增加 merge 冲突点
  - fork 段会过时（一旦 fork 改动剧烈但 fork 段没及时更新，反而误导用户）
- **结论**：否决（**摩擦 > 收益**）

### 选项 3：完全重写根 README 改成 fork 版本

- **优点**：完全控制
- **缺点**：
  - 失去 upstream README 升级带来的好处（新参数说明、新平台兼容说明等都要手动同步）
  - 实质上等于"fork → 独立项目"，跟「fork with custom rules」的定位不符
- **结论**：否决（**违背 fork 定位**）

## 决定 Decision

**根 `README.md` 保持 upstream 原样不动**——以下三类改动**禁止**：

1. 修改任何 `cdn.jsdelivr.net/gh/powerfullz/override-rules/...` URL 改指向 fork
2. 在根 README 加任何「Fork 说明」「Fork 自己的 URL」段落
3. 删除 upstream 作者控制的链接（jsDelivr badge、L3zc 镜像、博客链接）

Fork-only 的信息全部记录到 `_fork/` 子目录下（CHANGELOG、STATUS、USER_SUB_STORE_CONFIG、SOP、adr/）。

未来如需给 fork 用户加一句话提示（"this is a fork"），**单独走新 ADR 评估**，不在本 ADR 范围。

## 理由 Rationale

- 选项 1 的三个优点（零维护 / 单向同步 / 认知一致）都是**结构性收益**，不依赖任何 fork 作者的纪律性
- 选项 2 的"摩擦"看起来小，但累积起来是真实的（每次 upstream 升级 README 时多一次合并判断、多一次漏改风险）
- 选项 3 等于自我放弃 fork 路径，回到独立项目——这跟当初 fork 的初衷（最小代价获得 powerfullz 的兼容性 + 自己的小定制）矛盾

## 影响 Consequences

### 好处

- upstream README 升级 → fork 零冲突同步
- fork 作者的精力集中在业务代码（src/）+ 数据（ruleset/）+ 文档（_fork/），不分心维护 README
- 任何"fork-only"信息都有唯一权威位置：`_fork/`，避免 README 出现"半 fork 半 upstream"的混乱状态

### 代价 / 后续需要注意的事

- **认知模糊期**：新接手 fork 的人需要被告知去看 `_fork/`，否则只看根 README 会以为是 upstream
  - 缓解：`_fork/STATUS.md`「关键事实」段已显式写「Sub-Store 真实配置: 见 _fork/USER_SUB_STORE_CONFIG.md」
- **commit 信息一致性**：以后任何"我想改根 README"的冲动必须先重读本 ADR
- **STATUS.md 盲点表里之前没提过这条**：本 ADR 落盘后需要把这条 ADR 编号加进 STATUS.md「下一步待办」完成项里（防止未来 agent 重复发现"为啥不动 README"）

## 变更记录 Change Log

- 2026-08-07：初版（已采纳），补齐此前一直口头存在但没文档化的「不动根 README」红线