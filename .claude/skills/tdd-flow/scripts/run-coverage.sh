#!/bin/bash
# カバレッジ取得スクリプト
# 使用例: ./scripts/run-coverage.sh [test_file_pattern]

set -e

PATTERN="${1:-}"

if [ -z "$PATTERN" ]; then
  echo "全テストのカバレッジを取得します..."
  npm test -- --coverage
else
  echo "パターン '$PATTERN' のカバレッジを取得します..."
  npm test "$PATTERN" -- --coverage
fi

echo "✅ カバレッジ取得完了"
