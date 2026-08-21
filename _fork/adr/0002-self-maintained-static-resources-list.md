# ADR-0002: 用自维护小名单替代上游的静态资源/CDN 规则集

- **状态**: accepted
- **日期**: 2026-07-21
- **决策者**: Hermes Agent

## 背景 Context

上游 `powerfullz/override-rules` 项目提供了多个静态资源/CDN 规则集（`StaticResources`、`CDNResources`、`AdditionalCDNResources`），这些规则集指向第三方维护的大型域名列表（如 skk.moe、jsdelivr 等）。

问题：
1. 这些第三方列表每天更新，不受我们控制
2. 排查"静态资源抢跑"问题时发现，这些列表里混入了大量本应属于具体服务（AI/Netflix/TikTok 等）的域名
3. 虽然做了一次"提前顺序"的补丁修复，但列表本身仍在变化，未来任何时候新增域名都可能重新引入同样的问题
4. 原始动机（省流量）对使用自建 VPS 的场景不成立（不按流量计费）

## 考虑过的选项 Options Considered

### 选项 1: 维持现状，继续用上游大列表
- **优点**: 改动最小
- **缺点**: 问题根源没解决，列表每天更新，坑是第三方持续在挖，需要长期盯着

### 选项 2: 直接删除这三个规则集
- **优点**: 彻底消除风险，配置最简单
- **缺点**: 失去"部分明确想直连的 CDN 域名"这个能力，这些域名会退化到 GEOIP,cn / GFWList / MATCH,Final 的兜底逻辑里

### 选项 3: 自维护小名单（选定）
- **优点**: 
  - 兼顾"部分场景确实想直连"的价值
  - 把维护成本和风险都降到可控范围（不受第三方每天更新影响，出问题也只可能是自己加错，排查范围小）
- **缺点**: 需要自己维护这份清单，覆盖面不如上游大列表广

## 决定 Decision

选择**选项 3**：自维护小名单。

移除对 `StaticResources`/`CDNResources`/`AdditionalCDNResources` 三个 rule-provider 及其对应规则的引用，改为维护一份自己的直连域名清单，插入到原来"静态资源"规则所在的位置之后（具体位置见 ADR-0003 里的补充：挪到了所有专属服务规则之后，进一步降低撞车风险）。

## 理由 Rationale

1. 省流量这个原始动机不成立，没必要为了一个用不上的能力承担持续性风险
2. "有些域名我确实清楚、想直连"是真实需求，不该因选项 2（直接删除）而牺牲掉
3. 几十条自维护清单 vs 几千条第三方每天更新的清单，前者的可控性和可维护性都明显更好，出问题时排查范围也小得多

## 不确定性 Uncertainties

（迁移时补充，非原决定撰写时内容）
- 自维护清单的覆盖面是否足够（目前只有 5 个国内 CDN 镜像域名）
- 是否需要定期从上游列表同步新域名

## 撤销/回退方案 Rollback Plan

（迁移时补充，非原决定撰写时内容）
- 恢复上游三个规则集（StaticResources/CDNResources/AdditionalCDNResources）
- 或者改用"直接删除"方案（不维护任何静态资源规则）

## 接受的风险/未处理的问题 Accepted Risks

（迁移时补充，非原决定撰写时内容）
- 自维护清单覆盖面比上游列表窄
- 需要人工维护这份清单

## 影响 Consequences

- **好处**: 彻底消除了"静态资源抢跑其他服务"这类问题以后重复出现的可能性；配置更简单，不再依赖三个远程规则集的更新
- **代价**: 需要自己整理这份直连域名清单，覆盖面比上游列表窄——但这本来就是权衡后主动接受的取舍，不是遗漏

## 实现位置（随 ADR-0003 更新）

- Rule Provider 定义: `src/rule_providers.ts` 里的 `MyDirectCDN`
- 清单内容: `ruleset/MyDirectCDN.list`（classical 文本格式，一行一条 `DOMAIN-SUFFIX,域名`，支持 `#` 注释）
- 规则归属: `src/rules.ts` 里的 `RULE-SET,MyDirectCDN,DIRECT`，位置在所有专属服务规则之后
- 起点内容: 5 个国内 CDN 镜像域名（staticfile.org / staticfile.net / bootcdn.net / bootcss.com / baomitu.com）

## 相关决策

- **ADR-0001**: 后处理脚本方案（已被 ADR-0003 取代）
- **ADR-0003**: Fork 上游仓库方案（当前采用）
