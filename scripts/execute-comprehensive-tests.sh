#!/bin/bash

# UMSCC Permit Management System - Execute All Tests
# ==================================================

set -e

echo "🚀 UMSCC Comprehensive Test Execution"
echo "====================================="
echo "Starting comprehensive test suite execution..."
echo ""

# Make scripts executable
chmod +x scripts/run-all-tests.sh
chmod +x scripts/test-permit-preview-real-data.sh

# Create necessary directories
mkdir -p test-reports
mkdir -p test-results

echo "📋 Phase 1: System Readiness Validation"
echo "======================================="
npx tsx scripts/validate-system-readiness.ts

echo ""
echo "📋 Phase 2: Comprehensive Test Execution"
echo "========================================"
npx tsx scripts/execute-all-tests.ts

echo ""
echo "📋 Phase 3: Shell Script Test Runner"
echo "===================================="
bash scripts/run-all-tests.sh

echo ""
echo "📋 Phase 4: Permit Preview Real Data Tests"
echo "=========================================="
bash scripts/test-permit-preview-real-data.sh

echo ""
echo "🎉 ALL TEST PHASES COMPLETED!"
echo "============================="
echo ""
echo "📊 Test Results Summary:"
echo "  • System Readiness: Validated"
echo "  • Comprehensive Tests: Executed"
echo "  • Shell Script Tests: Completed"
echo "  • Real Data Tests: Validated"
echo ""
echo "📁 Reports generated in:"
echo "  • test-reports/ directory"
echo "  • test-results/ directory"
echo ""
echo "✅ UMSCC Permit Management System is PRODUCTION READY!"
