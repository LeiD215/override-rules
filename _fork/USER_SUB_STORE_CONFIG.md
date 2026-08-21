# 用户 Sub-Store 当前配置

> 本文件记录 fork 仓库当前使用的 Sub-Store 配置，避免下次询问时需要在多个 session / skill / CHANGELOG 里搜。
>
> **最后更新**：2026-08-07

---

## 脚本 URL

**最新版**（跟随 main 分支，推荐日常使用）：

```text
https://cdn.jsdelivr.net/gh/LeiD215/override-rules/convert.min.js#grouptype=0&fakeip=true&regex=true&threshold=1&ipv6=true
```

**锁定版**（更稳定，推荐生产环境）：

```text
https://cdn.jsdelivr.net/gh/LeiD215/override-rules@v2.5.14/convert.min.js#grouptype=0&fakeip=true&regex=true&threshold=1&ipv6=true
```

---

## URL 参数（5 个）

按字母升序排列：

| 参数 | 值 | 含义 |
|------|-----|------|
| `fakeip` | `true` | 启用 FakeIP（防 DNS 污染） |
| `grouptype` | `0` | 全量代理组（所有可能的国家分组都生成） |
| `ipv6` | `true` | 启用 IPv6 解析 |
| `regex` | `true` | 启用正则规则集 |
| `threshold` | `1` | IP 归属检测阈值降到 1 |

参数定义见 `src/args.ts`。

---

## 演变历史

| 时间 | 变量数 | URL | 来源 |
|------|--------|------|------|
| 2026-07-20 | 4 | `convert.min.js#grouptype=2&fakeip=true&regex=true&threshold=1` | `skills/productivity/proxy-subscription-management/references/multi-platform-caveats.md` L3260；session `20260720_055406_898085` 跑通后的记录 |
| 2026-08-07 | 5 | `convert.min.js#grouptype=0&fakeip=true&regex=true&threshold=1&ipv6=true` | 用户本人在本 session 中口头确认 |

**本次变更（2026-07-20 → 2026-08-07）**：
- `grouptype`: `2` → `0`（从"精简组"切到"全量组"）
- 新增 `ipv6=true`

---

## ⚠️ 数据真实性说明

**2026-08-07 的 5 个变量是用户口头确认的，未与 Sub-Store backend storage 二次比对**。

- 如果用户实际 Sub-Store UI 里配置不同，以 Sub-Store UI 显示为准；
- 如果未来要从权威来源核对，可以：
  1. SSH 到 Sub-Store backend 机器，`cat /www/wwwroot/sub-store/data/sub-store.json` 或 `docker exec sub-store cat /opt/app/data/sub-store.json`
  2. 浏览器打开 Sub-Store UI →「操作 → 脚本操作 → 展开参数」截图
  3. mihomo 客户端「覆写」面板截图（脚本跑过一次后生成的 yaml 里能看到生效参数）

---

## 相关文件

- 仓库主 README.md L2988：还在引用 upstream `powerfullz/override-rules/convert.min.js#grouptype=1`（**fork 没有改这里**，跟 SOP 红线"不动根 README"有关）
- `_fork/CHANGELOG.md` [Unreleased]：本条记录的源头
- `src/args.ts`：参数定义 + 默认值
- `skills/productivity/proxy-subscription-management/references/multi-platform-caveats.md` L3260：2026-07-20 旧版记录

---

**作者**：ai（Hermes Agent，2026-08-07）