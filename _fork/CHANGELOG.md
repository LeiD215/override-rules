# Changelog（`_fork/` 记录区专用）

> 跟仓库根目录的 `CHANGELOG.md` 无关——那个是上游项目用 `cliff.toml` + 自己的
> 发布流程自动生成的版本历史，不是给我们手写用的，塞进去下次自动生成时会被
> 覆盖或冲突。这份是我们自己的，专门记录"针对这份 Fork 做了哪些自定义"。

## [Unreleased]

## [2026-07-21] 端到端验证通过 + 修正最终链接格式

- 开始：2026-07-21
- 结束：2026-07-21

### 验证 Verified
- 在 Windows 11 上完整走了一遍首次搭建流程：Fork → clone → 套用改动 →
  替换占位符 → 本地 `tsc`/`build` 验证 → 提交推送 → 启用 Actions →
  `npm version patch` 发布 `src-v2.5.6` → Release Artifacts 工作流跑通
- 最终链接 `https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js`
  实测可正常访问

### 修改 Changed
- 更正 `_fork/STATUS.md`/`_fork/SOP.md` 里此前写错的最终链接格式：不需要
  `@dist` 后缀。查看真实的 `.github/workflows/release.yaml` 后确认：发布
  脚本会把一个不带 `src-` 前缀的纯版本号 tag（如 `v2.5.6`）强制指向最新产物，
  jsDelivr 不带 `@` 版本号时默认取最新 tag，所以裸链接会自动跟着每次发布更新

关联: 无（文档纠错 + 例行验证记录，不是新的架构决定）

---

## [2026-07-21] Fork 架构定型 + 完成首版自定义

- 开始：2026-07-21
- 结束：2026-07-21

### 新增 Added
- `_fork/adr/0003-fork-upstream-typescript-source.md`：推翻 ADR-0001 独立后处理
  项目的方向，改用官方推荐的 Fork + `src/*.ts` 源码定制方案
- `src/rule_providers.ts`：新增 `MyDirectCDN` provider，移除
  `StaticResources`/`CDNResources`/`AdditionalCDNResources` 三个上游远程大列表
- `ruleset/MyDirectCDN.list`：自维护直连域名清单，起点 5 个国内 CDN 镜像
  （staticfile.org/staticfile.net/bootcdn.net/bootcss.com/baomitu.com）
- `src/proxy_groups.ts`：新增 `AI故障转移` fallback 分组（探测 chatgpt.com，
  interval 300 秒，候选为美/日 5 个 Reality 节点）
- `_fork/` 整个记录区（STATUS.md / CHANGELOG.md / adr/ / SOP.md）

### 修改 Changed
- `src/rules.ts`：把 `RULE-SET,MyDirectCDN,DIRECT` 放在所有专属服务规则之后
  （不是像上游原来那样放最前面），从源头避免"抢跑"问题，不需要运行时补丁
- `src/proxy_groups.ts` 的 `AI服务` 分组：改为手动选择为主，US-LAX-Bwh1 排最前，
  美/日节点在前、香港节点垫底保留

### 移除 Removed
- `src/proxy_groups.ts`：移除"静态资源"策略组本身（已经没有规则会命中它）
- `src/proxy_groups.ts`：移除"低倍率节点"分组及相关的 `lowCostNodes`/
  `LOW_COST_NODE_MATCHER` 未使用引用

### 验证 Verified
- `npx tsc --noEmit`：无类型错误
- `npm run build`：构建成功，产出 `convert.js`/`convert.min.js`
- 用真实的 14 个节点数据（用户实际的 7 台自建 VPS，Reality+XHTTP 两种协议
  变体）调用产物的 `main(config)` 函数，核对结果：
  - `AI服务`/`AI故障转移` 分组内容和顺序符合预期
  - `静态资源`/`低倍率节点` 分组已不存在
  - `rule-providers` 列表正确（少了 3 个，多了 `MyDirectCDN`）
  - `RULE-SET,MyDirectCDN,DIRECT` 排在所有专属服务规则之后

关联: ADR-0001（已废弃）, ADR-0002（更新实现位置）, ADR-0003
