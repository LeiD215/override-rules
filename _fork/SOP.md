# 给 hermes 的操作规范（`_fork/` 记录区专用）

这是一个 Fork 项目（`powerfullz/override-rules` 的个人定制版），不是从零建的
空仓库。以下规则专门针对"Fork 场景"，跟通用 logbook 规则配合使用。

## 🚫 红线：这几个文件/操作绝对不能碰

1. **不要修改仓库根目录的 `README.md` / `CHANGELOG.md`**——那是上游项目自己在
   维护的文件，`CHANGELOG.md` 还是自动生成的（`cliff.toml` + 发布流程）。我们
   自己的记录一律写在 `_fork/` 目录下面
2. **不要直接编辑 `convert.js` / `convert.min.js` / `yamls/` 目录**——这些是
   构建产物，主分支已经取消 Git 跟踪，编辑了也没用，下次构建会被覆盖。一切
   修改必须在 `src/*.ts` 源码里做
3. **绝对不能在上游原仓库（`powerfullz/override-rules`）执行发布流程**（`npm
   version patch/minor/major`）——这是 `AGENTS.md` 里项目作者写的安全声明，
   只有代表作者 `powerfullz` 本人的 Agent 才能碰。**在自己 Fork 出来的仓库里
   执行是完全没问题的**，两者不要搞混——判断依据很简单：检查当前仓库的
   `origin` remote 指向的是不是自己的 Fork，不是 upstream 原仓库

## 执行纪律与安全红线

1. 接到多步骤的仓库或运维任务时，必须严格按照用户给定的顺序执行；每完成一步
   就报告该步结果，不得连续完成多步后再一次性汇报。
2. 任何代码或文档改动都必须先提交到本地分支；只有经过用户验收并明确确认后，
   才能 push 到远端。
3. 凭据（token、密码等）绝不在对话中复述，也不直接通过对话接收；一律使用
   `<token>` 这类占位符表示，真实值不得出现在对话内容中。
4. GitHub 授权优先使用限定到目标仓库的 Fine-grained Personal Access Token，
   遵守最小权限原则；凭据必须在本地 Docker 容器终端中输入，不得让输入内容
   暴露在对话记录中。
5. 每次 push 后必须实际验证：远端分支状态、对应 tag、GitHub Actions 是否正常
   触发并完成、构建产物是否成功生成，以及最终规则内容是否符合预期。不能仅凭
   “push 成功”就认定任务完成。

## 日常执行规则（基于 logbook 通用规则，针对 Fork 场景调整）

### 开工时
1. 读 `_fork/STATUS.md`，了解当前进度；发现内容和实际不符就顺手核正
2. 读 `_fork/CHANGELOG.md` 最近几条，了解最近改了什么
3. 在 `_fork/CHANGELOG.md` 的 `[Unreleased]` 下新建条目，记开始时间戳

### 执行中
- 改 `src/*.ts` 源码，不改产物文件
- 日常小改（加一条规则/调一个策略组）：直接改，CHANGELOG 自动写，事后一句话
  告诉用户改了什么
- 涉及架构级选择（比如要不要换一种同步上游的方式）：先停下来问用户"这个要不要
  写成 ADR"，得到确认后才写，且必须在决定成立的当下写，不能事后补

### 改完必须验证（不能跳过）
```bash
npx tsc --noEmit          # 类型检查
npm run build              # 实际构建，确认没有编译错误
```
建议再跑一次功能验证（用真实或模拟的节点数据调用产物，检查关键分组/规则是否
符合预期）——具体做法参考 `_fork/CHANGELOG.md` 里 2026-07-21 那条"验证"部分
记录的方法。

### 收工时
1. 补上 CHANGELOG 条目的结束时间戳和内容
2. 更新 `_fork/STATUS.md`
3. 一句话告诉用户改了哪些文件

## 同步上游更新

1. 确认已经配置了 `upstream` remote：
   ```bash
   git remote add upstream https://github.com/powerfullz/override-rules.git
   # 如果已经加过，这一步会报错，忽略即可
   ```
2. 拉取并合并：
   ```bash
   git fetch upstream
   git merge upstream/main
   ```
3. 如果有冲突：冲突大概率出现在我们改过的那几个文件（`rule_providers.ts`/
   `rules.ts`/`proxy_groups.ts`/`constants.ts`），逐个手动解决，解决完重新走
   一遍"改完必须验证"的步骤
4. 在 `_fork/CHANGELOG.md` 新增一条"上游同步"记录（写清楚同步到了上游哪个
   commit/tag、有没有冲突、怎么解决的）
5. 确认没问题后发布新版本（见下面"发布"）

## 发布（在自己的 Fork 里执行，不是 upstream）

```bash
npm version patch   # 或 minor / major，视改动性质而定
```
这条命令会自动跑测试、更新版本号、生成 upstream 风格的 CHANGELOG（这个是
上游工具生成的那份，不是我们的 `_fork/CHANGELOG.md`）、推送带 tag 的提交，
触发 GitHub Actions 自动构建并推到 `dist` 分支。

发布后确认 Actions 页面的 "Release Artifacts" 工作流跑完，然后确认最终链接
可以正常访问：
```
https://cdn.jsdelivr.net/gh/<你的用户名>/override-rules/convert.min.js
```
（不带 `@` 版本号，jsDelivr 会自动取最新发布——发布脚本每次会把不带 `src-`
前缀的纯版本号 tag 如 `v2.5.6` 指向最新产物。想锁定某个具体版本，用
`@v2.5.6` 这种格式，注意不是 `@src-v2.5.6`。）

## 首次搭建检查清单（还没做完的话，按这个顺序）

- [ ] 在 GitHub 上 Fork `powerfullz/override-rules` 到自己账号
- [ ] 把本地这份改动 push 到 Fork 仓库
- [ ] 把 `src/rule_providers.ts` 里 `MyDirectCDN` provider 的
      `YOUR_GITHUB_USERNAME` 占位符换成实际用户名（不换的话这个 provider
      指向一个不存在的地址，构建出来的配置里这条规则会拉取失败）
- [ ] Fork 仓库的 Actions 标签页里手动启用一次工作流
- [ ] 按上面"发布"步骤跑一次 `npm version patch`
- [ ] 确认 `dist` 分支产出正常，拿到最终链接
- [ ] 在 Sub-Store 里把订阅指向的脚本链接换成这个新链接，实测生成的配置
- [ ] 全部跑通后，更新 `_fork/STATUS.md`，把这几项待办勾掉
