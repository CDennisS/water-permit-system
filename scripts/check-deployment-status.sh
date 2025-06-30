#!/bin/bash

echo "🔍 UMSCC Permit Management System - Deployment Status Check"
echo "============================================================"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current Version: $CURRENT_VERSION"

# Check if deployment history exists
if [ ! -f "deployment-history.json" ]; then
    echo "📋 Creating deployment history file..."
    cat > deployment-history.json << EOF
{
  "deployments": [],
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "notes": "No deployments recorded yet. This is the initial development version ready for first deployment."
}
EOF
fi

# Check deployment history
DEPLOYMENT_COUNT=$(node -p "require('./deployment-history.json').deployments.length")
echo "📊 Total Deployments: $DEPLOYMENT_COUNT"

if [ "$DEPLOYMENT_COUNT" -eq 0 ]; then
    echo "🚀 Last Deployed Version: NEVER DEPLOYED"
    echo "📅 Last Deployment Date: N/A"
    echo "❌ Status: NOT DEPLOYED"
    echo ""
    echo "⚠️  RECOMMENDATION: READY FOR INITIAL PRODUCTION DEPLOYMENT"
    echo "   This would be version $CURRENT_VERSION - the first production release"
else
    echo "🚀 Deployment history found with $DEPLOYMENT_COUNT deployments"
fi

# Check if build directory exists
if [ -d ".next" ]; then
    echo "✅ Build directory exists"
else
    echo "⚠️  Build directory not found - run 'npm run build' before deployment"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed - run 'npm install' first"
fi

echo ""
echo "🎯 Next Steps:"
echo "  1. Run 'npm install' to install dependencies"
echo "  2. Run 'npm run build' to create production build"
echo "  3. Run 'npm run test' to verify functionality"
echo "  4. Deploy to production environment"
echo "  5. Update deployment history"
