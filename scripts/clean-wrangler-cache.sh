#!/bin/bash
# Wranglerキャッシュのクリーンアップスクリプト
# Purpose: .wranglerフォルダとD1データベースをクリーンな状態にリセット
#
# 使用方法:
#   npm run clean:wrangler

set -e

echo "🧹 Wranglerキャッシュをクリーンアップ中..."

# Step 1: .wranglerフォルダの削除を試みる
if [ -d ".wrangler/state/v3" ]; then
  echo "📂 .wrangler/state/v3 を削除中..."
  rm -rf .wrangler/state/v3 2>/dev/null || {
    echo "⚠️  .wrangler削除に失敗。Node.jsプロセスを停止します..."

    # Windows環境の場合
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      powershell -Command "Stop-Process -Name node -Force" 2>/dev/null || true
      sleep 2
      rm -rf .wrangler/state/v3
    else
      # Unix系の場合
      pkill -9 node 2>/dev/null || true
      sleep 2
      rm -rf .wrangler/state/v3
    fi
  }
  echo "✅ キャッシュ削除完了"
else
  echo "✅ キャッシュフォルダが存在しません（クリーン状態）"
fi

# Step 2: D1マイグレーションの適用
echo "🗄️  D1マイグレーションを適用中..."
npx wrangler d1 migrations apply claudemix-dev --local

echo "🎉 クリーンアップ完了！"
echo ""
echo "次のコマンドで開発サーバーを起動できます:"
echo "  npm run dev:wrangler"
