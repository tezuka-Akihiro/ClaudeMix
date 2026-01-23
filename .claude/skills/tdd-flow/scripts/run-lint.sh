#!/bin/bash
# テンプレートリント実行スクリプト
# 使用例: ./scripts/run-lint.sh [file_path]

set -e

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "全ファイルに対してテンプレートリントを実行します..."
  node scripts/lint-template/engine.js
else
  echo "ファイル '$TARGET' に対してテンプレートリントを実行します..."
  node scripts/lint-template/engine.js "$TARGET"
fi

echo "✅ テンプレートリント完了"
