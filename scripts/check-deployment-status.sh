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

echo "✅ Node.js and npm are available"

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Current Version: $VERSION"

# Check if deployment history exists
if [ -f "deployment-history.json" ]; then
    echo "✅ Deployment history found"
    LAST_DEPLOYED=$(node -p "require('./deployment-history.json').lastDeployed || 'Never'")
    STATUS=$(node -p "require('./deployment-history.json').status")
    echo "🚀 Last Deployed: $LAST_DEPLOYED"
    echo "📊 Status: $STATUS"
else
    echo "⚠️  No deployment history found"
    echo "🚀 Last Deployed: Never"
    echo "📊 Status: never-deployed"
fi

# Check if build directory exists
if [ -d ".next" ]; then
    echo "✅ Build directory exists"
else
    echo "⚠️  No build directory found - run 'npm run build'"
fi

# Check key files exist
echo ""
echo "=== File Structure Check ==="
FILES=(
    "app/page.tsx"
    "components/permit-preview-dialog.tsx"
    "components/permitting-officer-applications-table.tsx"
    "lib/database.ts"
    "types/index.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "=== Deployment Readiness ==="
if [ "$STATUS" = "never-deployed" ]; then
    echo "🎯 READY FOR INITIAL DEPLOYMENT"
    echo "   This would be version $VERSION - first production release"
else
    echo "🔄 READY FOR UPDATE DEPLOYMENT"
    echo "   Current version: $VERSION"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Run 'npm run build' to create production build"
echo "2. Run 'npm run test' to verify all functionality"
echo "3. Deploy to production environment"
echo "4. Update deployment history"
