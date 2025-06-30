#!/bin/bash

echo "🚀 UMSCC Permit Management System - Executing All Tests"
echo "======================================================="

# Make sure we have the necessary directories
mkdir -p test-reports test-results logs

# Execute the comprehensive test runner
echo "📋 Running comprehensive test execution..."
npx tsx scripts/run-tests-now.ts

echo ""
echo "✅ Test execution completed!"
echo "📁 Check test-reports/ and test-results/ directories for detailed results"
