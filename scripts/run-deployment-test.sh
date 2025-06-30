#!/bin/bash

echo "🚀 UMSCC Permit Management System - Comprehensive Deployment Test"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the comprehensive deployment test
echo "🔍 Running comprehensive deployment test..."
npx tsx scripts/test-deployment-comprehensive.ts

echo ""
echo "🏁 Deployment test completed!"
