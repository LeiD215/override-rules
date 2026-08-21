#!/usr/bin/env bash
#
# push 脚本：把 main 分支的 commit push 到 GitHub。
# 凭据来自 $HOME/.git-credentials（当前 /opt/data/home/.git-credentials，你已手动填入 token），此脚本可复用。
#
# 用法:
#   bash push.sh            # push main
#   bash push.sh <branch>   # push 指定分支
#
# 说明:
#   - 不删除凭据文件，凭据长期保存，后续每次 push 都自动用
#   - push 输出里会打码 token（不显示你的凭据），保证安全
#   - 若 push 失败（token 错/权限不足/远端变化），会有明确提示

set -euo pipefail

CRED_FILE="$HOME/.git-credentials"
BRANCH="${1:-main}"
REPO_URL="https://github.com/LeiD215/override-rules.git"

if [ ! -f "$CRED_FILE" ]; then
  echo "❌ 找不到凭据文件 $CRED_FILE"
  echo "   请先打开它，把 PASTE_YOUR_GITHUB_TOKEN_HERE 替换成你的 GitHub Fine-grained PAT，保存后重跑。"
  exit 1
fi

# 给 git 配 store helper（默认读 $HOME/.git-credentials）
HELPER="store"
if [ "$(git config --global --get credential.helper 2>/dev/null)" != "$HELPER" ]; then
  git config --global credential.helper "$HELPER"
  echo "✓ 已配置 git credential.helper = $HELPER"
fi

echo "→ 正在 push 分支 '$BRANCH' 到 $REPO_URL ..."
# 用 git push 本身(走 credential helper 读 $HOME/.git-credentials)
# 打码 token 防止它在错误信息里回显
set +e
git push "$REPO_URL" "$BRANCH" 2>&1 | sed -E 's#(https://[^:/]+:)[^@]+@#\1***@#g'
EXIT=$?
set -e

if [ $EXIT -eq 0 ]; then
  echo "✅ push 成功，分支 '$BRANCH' 已同步到远程。"
else
  echo "⚠️ push 失败(退出码 $EXIT)。"
  echo "   常见原因：token 无效 / token 缺少该仓库(Contents: write)权限 / 权限位不足"
  echo "   请检查 $CRED_FILE 里的 token 是否正确，修正后重跑 bash push.sh"
fi
exit $EXIT