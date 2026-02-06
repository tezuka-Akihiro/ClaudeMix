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
migration_count=0
for migration_file in migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "   📄 Applying $(basename "$migration_file")..."
        wrangler d1 execute claudemix-dev --local --file="$migration_file"
        echo "   ✅ $(basename "$migration_file") applied"
        migration_count=$((migration_count + 1))
    fi
done

if [ $migration_count -eq 0 ]; then
    echo "⚠️  No migrations found"
else
    echo "✅ Applied $migration_count migration(s)"
fi

# Apply seed data for development
if [ -f "migrations/seed.sql" ]; then
    echo "🌱 Applying seed data..."
    wrangler d1 execute claudemix-dev --local --file="migrations/seed.sql"
    echo "✅ Seed data applied"
fi

echo "✅ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start dev server: npm run dev:wrangler"
echo "   2. Run E2E tests: npx playwright test tests/e2e/account"
