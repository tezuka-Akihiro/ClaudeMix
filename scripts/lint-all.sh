#!/bin/bash

# Lint All - 全リントを実行するスクリプト
# Usage: bash scripts/_local/lint-all.sh

set -e

echo "🚀 Running all linters..."
echo ""

# 1. Markdown lint
echo "📝 [1/4] Markdown lint..."
npm run lint:md
echo "✅ Markdown lint passed"
echo ""

# 2. Blog metadata lint
echo "📊 [2/4] Blog metadata lint..."
npm run lint:blog-metadata
echo "✅ Blog metadata lint passed"
echo ""

# 3. CSS architecture lint
echo "🎨 [3/4] CSS architecture lint..."
node scripts/lint-css-arch/engine.js --service blog
node scripts/lint-css-arch/engine.js --service account
echo "✅ CSS architecture lint passed"
echo ""

# 4. Template lint
echo "📋 [4/4] Template lint..."
node scripts/lint-template/engine.js app/routes/blog._index.tsx
node scripts/lint-template/engine.js app/routes/blog.\$slug.tsx
node scripts/lint-template/engine.js app/components/blog
node scripts/lint-template/engine.js app/routes/account.tsx
node scripts/lint-template/engine.js app/routes/account._index.tsx
node scripts/lint-template/engine.js app/routes/account.settings.tsx
node scripts/lint-template/engine.js app/routes/account.subscription.tsx
node scripts/lint-template/engine.js app/components/account
echo "✅ Template lint passed"
echo ""

echo "🎉 All linters passed successfully!"
