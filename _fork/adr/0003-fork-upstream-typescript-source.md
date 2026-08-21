# ADR-0003: 改用 Fork 上游仓库方案，放弃后处理脚本

- **状态**: accepted
- **日期**: 2026-07-21
- **决策者**: Hermes Agent

## 背景 Context

ADR-0001 选择了"后处理脚本"方案：不 Fork 上游仓库，而是写一个独立的脚本（`scripts/custom-override.js`）在上游生成的配置基础上做二次加工。

问题：
1. 后处理脚本需要解析上游生成的完整配置，然后在内存中修改，最后输出。这个过程容易出错，且难以调试
2. 上游配置格式变化时，后处理脚本需要适配，维护成本高
3. 无法利用上游的构建流程和类型检查
4. 用户希望直接修改源码，而不是在配置层面做文章

## 考虑过的选项 Options Considered

### 选项 1: 继续用后处理脚本
- **优点**: 不需要维护 fork
- **缺点**: 
  - 维护成本高，需要适配上游配置格式变化
  - 难以调试，配置层面的修改不够直观
  - 无法利用上游的构建流程

### 选项 2: Fork 上游仓库，直接改源码（选定）
- **优点**: 
  - 直接修改源码，改动直观，易于调试
  - 可以利用上游的构建流程（`npm run build`）和类型检查
  - 上游更新时只需要 merge，冲突概率低（因为我们改的地方都是用户可定制的部分）
- **缺点**: 
  - 需要维护一个 fork
  - 上游更新时需要手动 merge

## 决定 Decision

选择**选项 2**：Fork 上游仓库，直接改源码。

具体实现：
- Fork `powerfullz/override-rules` 到 `LeiD215/override-rules`
- 在 `src/` 目录下直接修改源码（`proxy_groups.ts`、`rules.ts`、`rule_providers.ts` 等）
- 使用上游的构建流程（`npm run build`）生成最终配置
- 通过 GitHub Actions 自动构建并发布到 `dist` 分支

## 理由 Rationale

1. **降低维护成本**: 直接改源码比后处理脚本更直观，调试更容易
2. **利用上游能力**: 可以使用上游的构建流程、类型检查、CI/CD
3. **冲突可控**: 我们改的地方（`proxy_groups.ts`、`rules.ts`、`rule_providers.ts`）都是用户可定制的部分，上游更新时冲突概率低
4. **可追溯性**: 所有改动都在 git 历史里，便于审查

## 不确定性 Uncertainties

（迁移时补充，非原决定撰写时内容）
- 上游更新频率和冲突概率
- 是否需要定期同步上游的安全修复

## 撤销/回退方案 Rollback Plan

（迁移时补充，非原决定撰写时内容）
- 如果 fork 维护成本过高，可以回到后处理脚本方案（ADR-0001）
- 但考虑到 ADR-0001 已经被证明有问题，这个回退方案不太现实

## 接受的风险/未处理的问题 Accepted Risks

（迁移时补充，非原决定撰写时内容）
- 需要定期 merge 上游更新
- 如果上游大幅重构，可能需要较多工作量来适配

## 影响 Consequences

- **好处**: 
  - 直接改源码，改动直观，易于调试
  - 可以利用上游的构建流程和类型检查
  - 维护成本降低
- **代价**: 
  - 需要维护一个 fork
  - 上游更新时需要手动 merge

## 实现细节

1. **Fork 仓库**: `https://github.com/LeiD215/override-rules`
2. **修改的文件**:
   - `src/proxy_groups.ts`: 添加自定义代理组（AI 服务、AI 故障转移等）
   - `src/rules.ts`: 添加自定义规则（MyDirectCDN 等）
   - `src/rule_providers.ts`: 添加自定义规则提供者（MyDirectCDN）
   - `src/constants.ts`: 添加自定义常量（LOW_COST_NODE_MATCHER 等）
   - `src/types.ts`: 添加自定义类型定义
3. **构建流程**: `npm run build` 生成 `convert.min.js`
4. **发布流程**: GitHub Actions 自动构建并发布到 `dist` 分支
5. **订阅链接**: `https://cdn.jsdelivr.net/gh/LeiD215/override-rules@dist/convert.min.js`

## 相关决策

- **取代 ADR-0001**: 放弃后处理脚本方案
- **ADR-0002 仍然有效**: 自维护静态资源小名单的决策不受影响，只是实现位置从后处理脚本移到了上游源码
