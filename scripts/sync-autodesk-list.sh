#!/usr/bin/env bash
# sync-autodesk-list.sh
#
# 同步 MetaCubeX/meta-rules-dat@meta/geo/geosite/autodesk.list 到本仓库
# ruleset/Autodesk.list，预处理掉行首 "+. " 前缀（上游用 `+.domain` 表示 domain-suffix），
# 让 mihomo behavior: "domain" 能直接吃裸域名。
#
# 数据源：https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/autodesk.list
#
# 设计原则：
#   - 脚本是"幂等"的，重复跑结果一致
#   - 写入前打印"原文件行数 vs 新文件行数"，便于肉眼比对
#   - 失败 exit 1，以便 cron 早报
#   - git diff 留给 commit 阶段手动触发
#
# 用法：
#   ./scripts/sync-autodesk-list.sh                    # 拉 + 处理 + 写
#   ./scripts/sync-autodesk-list.sh --diff             # 只 diff，不写（dry-run）
#   ./scripts/sync-autodesk-list.sh --check           # 拉 + 处理，跟现文件 diff，有差异 exit 1
#
# Cron 调度：由 Hermes Agent 任务 `sync-override-rules-autodesk` 每月执行一次
#（参见 _fork/CHANGELOG.md 与 cronjob 配置）。

set -euo pipefail

SRC="https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/autodesk.list"
DST="/opt/data/program/override-rules/ruleset/Autodesk.list"

MODE="write"
for arg in "$@"; do
    case "$arg" in
        --diff)        MODE="diff" ;;
        --check)       MODE="check" ;;
        -h|--help)
            sed -n '2,30p' "$0"
            exit 0
            ;;
        *)
            echo "unknown flag: $arg" >&2
            exit 2
            ;;
    esac
done

# 1. 拉源到临时文件
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
HTTP_CODE=$(curl -sSL -o "$TMP" -w '%{http_code}' "$SRC")
if [[ "$HTTP_CODE" != "200" ]]; then
    echo "ERROR: $SRC → HTTP $HTTP_CODE" >&2
    exit 1
fi

RAW_LINES=$(wc -l < "$TMP")
echo "源文件：$SRC ($RAW_LINES 行 / $(wc -c < "$TMP") 字节)"

# 2. 处理：去掉 "+. " 前缀得到裸 domain；丢弃空行 / 注释行
PROCESSED="$(mktemp)"
trap 'rm -f "$TMP" "$PROCESSED"' EXIT
# -E: extended regex
#   去掉行首 "+. " （meta-rules-dat 的 domain-suffix 简写）
#   去掉空行
#   去掉 "#" 开头的注释行
#   顺便去掉首尾空白
sed -E '
    s/^[[:space:]]*\+\.[[:space:]]*//
    /^[[:space:]]*$/d
    /^[[:space:]]*#/d
    s/^[[:space:]]+//
    s/[[:space:]]+$//
' "$TMP" > "$PROCESSED"

PROC_LINES=$(wc -l < "$PROCESSED")
echo "处理后：$PROC_LINES 行裸域名（丢掉 $(($RAW_LINES - $PROC_LINES)) 行注释/空行）"

# 2b. 校验：处理后不能再含 +. 前缀
REMAINING_PLUS=$(grep -c '^[[:space:]]*+\.' "$PROCESSED" || true)
if [[ "$REMAINING_PLUS" -gt 0 ]]; then
    echo "ERROR: +. 前缀 sed 没去干净（剩余 $REMAINING_PLUS 行），脚本逻辑有 bug" >&2
    exit 1
fi

# 3. 去重 + 排序 + 拼头注释
OUT="$(mktemp)"
trap 'rm -f "$TMP" "$PROCESSED" "$OUT"' EXIT
sort -u "$PROCESSED" > "$OUT"
SORTED_LINES=$(wc -l < "$OUT")
echo "去重后：$SORTED_LINES 行（被去重 $((PROC_LINES - SORTED_LINES)) 行）"

{
    echo "# Autodesk 服务域名清单 ($SORTED_LINES 条)"
    echo "#"
    echo "# 数据源：$SRC"
    echo "# （MetaCubeX/meta-rules-dat 跟随 v2fly/domain-list-community 同步）"
    echo "#"
    echo "# 本文件格式：每行一条裸域名；mihomo classical rule-provider"
    echo "# (behavior=classical, format=text) 下需包一层 DOMAIN-SUFFIX,xxx，"
    echo "# behavior=domain 下直接吃裸域名。"
    echo "#"
    echo "# 维护约定："
    echo "#   1. 由 scripts/sync-autodesk-list.sh 月度同步源到本文件"
    echo "#   2. 手动修改需在 _fork/CHANGELOG.md 留一笔"
    echo "#"
    cat "$OUT"
} > "$OUT.2"
mv "$OUT.2" "$OUT"

# 4. 模式分支
case "$MODE" in
    diff)
        if [[ -f "$DST" ]]; then
            if diff -u "$DST" "$OUT" > /tmp/autodesk-sync.diff 2>&1; then
                echo "✅ diff 干净（本地已是最新）"
                exit 0
            else
                echo "⚠️ 有差异："
                cat /tmp/autodesk-sync.diff
                exit 0
            fi
        else
            echo "⚠️ 本地不存在 $DST，会首次生成"
            exit 0
        fi
        ;;
    check)
        if [[ -f "$DST" ]] && diff -q "$DST" "$OUT" > /dev/null 2>&1; then
            echo "✅ 本地与源一致，无需同步"
            exit 0
        else
            echo "⚠️ 本地与源不同步，建议跑 sync 后 commit"
            exit 1
        fi
        ;;
    write)
        if [[ -f "$DST" ]] && diff -q "$DST" "$OUT" > /dev/null 2>&1; then
            echo "✅ 本地已是最新，无需更新 ($DST)"
            exit 0
        fi
        mv "$OUT" "$DST"
        echo "✅ 已写入 $DST"
        echo ""
        echo "==> 下一步："
        echo "    cd $DST"
        echo "    git diff --stat ruleset/Autodesk.list        # 看行数变化"
        echo "    git add ruleset/Autodesk.list"
        echo "    git commit -m 'chore(ruleset): 月度同步 Autodesk 域名清单'"
        echo ""
        exit 0
        ;;
esac
