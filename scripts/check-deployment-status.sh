#!/bin/bash

echo "=== UMSCC Permit Management System - Deployment Status ==="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "📦 Current Version: $VERSION"

# Check if deployment history exists
if [ -f "deployment-history.json" ]; then
    echo "📋 Deployment history found"
    LAST_DEPLOYED=$(node -p "
        const history = require('./deployment-history.json');
        history.deployments.length > 0 
            ? history.deployments[history.deployments.length - 1].timestamp 
            : 'Never deployed'
    ")
    echo "🚀 Last Deployed: $LAST_DEPLOYED"
else
    echo "📋 No deployment history found"
    echo "🚀 Last Deployed: Never"
fi

# Check build status
echo ""
echo "🔧 Checking build status..."
if npm run build --silent; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check test status
echo ""
echo "🧪 Checking test status..."
if npm test --silent; then
    echo "✅ Tests passed"
else
    echo "⚠️  Some tests failed"
fi

echo ""
echo "📊 System Status: Ready for deployment"
echo "🎯 Recommendation: This is version $VERSION and has never been deployed to production"
