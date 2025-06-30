#!/bin/bash

echo "🔍 UMSCC Permit Management System - Deployment Status Check"
echo "=========================================================="

# Run the deployment version checker
npx tsx scripts/check-deployment-version.ts

# Check if deployment is needed based on exit code
if [ $? -eq 1 ]; then
    echo ""
    echo "⚠️  DEPLOYMENT REQUIRED"
    echo "======================"
    echo "The system has changes that need to be deployed."
    echo ""
    echo "To deploy:"
    echo "1. Run: npm run validate:system"
    echo "2. Run: npm run build"
    echo "3. Run: npm run test:all"
    echo "4. Deploy to production"
    echo ""
else
    echo ""
    echo "✅ SYSTEM UP TO DATE"
    echo "==================="
    echo "No deployment required at this time."
    echo ""
fi
