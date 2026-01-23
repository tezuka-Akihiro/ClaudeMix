#!/bin/bash
# CSS規律検証スクリプト
# 使用例: ./scripts/run-css-lint.sh

set -e

echo "CSS規律検証を実行します..."
npm run lint:css-arch

echo "✅ CSS規律検証完了"
echo "📋 レポート: tests/lint/css-arch-layer-report.md"
