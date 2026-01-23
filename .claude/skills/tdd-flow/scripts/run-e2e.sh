#!/bin/bash
# E2Eテスト実行スクリプト
# 使用例: ./scripts/run-e2e.sh [test_file_pattern]

set -e

PATTERN="${1:-}"

if [ -z "$PATTERN" ]; then
  echo "全E2Eテストを実行します..."
  npm run test:e2e
else
  echo "パターン '$PATTERN' のE2Eテストを実行します..."
  npm run test:e2e -- "$PATTERN"
fi

echo "✅ E2Eテスト完了"
