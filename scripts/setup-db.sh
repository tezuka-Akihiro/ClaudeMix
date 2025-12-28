#!/bin/bash
# Database Setup Script for Local Development
# Creates and initializes the local D1 database

set -e

echo "🗄️  Setting up local D1 database..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "   Install with: npm install -g wrangler"
    exit 1
fi

# Create local D1 database (if it doesn't exist)
echo "📦 Creating local D1 database..."
wrangler d1 create claudemix-dev || echo "Database already exists (ok)"

# Apply migrations
echo "🔄 Applying database migrations..."
if [ -f "migrations/0001_initial_schema.sql" ]; then
    wrangler d1 execute claudemix-dev --local --file=migrations/0001_initial_schema.sql
    echo "✅ Migration 0001_initial_schema.sql applied"
else
    echo "⚠️  No migrations found"
fi

echo "✅ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start dev server: npm run dev:wrangler"
echo "   2. Run E2E tests: npx playwright test tests/e2e/account"
