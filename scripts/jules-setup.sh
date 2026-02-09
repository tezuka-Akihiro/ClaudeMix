#!/bin/bash
set -e

# ClaudeMix Setup Script for Jules
# Minimal and robust environment initialization

echo "📦 Installing dependencies..."
npm install

if [ ! -f .dev.vars ]; then
    echo "📄 Creating .dev.vars from example..."
    cp .dev.vars.example .dev.vars
fi

echo "🗄️ Setting up local database..."
npm run setup:db

echo "🔨 Generating artifacts..."
npm run prebuild

echo "🔍 Verifying environment consistency..."
# Note: This starts a development server (long-running process).
npm run dev:wrangler
