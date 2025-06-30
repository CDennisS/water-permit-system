#!/bin/bash

echo "🚀 Executing UMSCC Permit Management System Tests"
echo "================================================="

# Make all scripts executable
chmod +x scripts/*.sh
chmod +x scripts/execute-comprehensive-tests.sh

# Execute the comprehensive test suite
bash scripts/execute-comprehensive-tests.sh

echo ""
echo "🎯 Test execution completed!"
echo "Check the test-reports/ directory for detailed results."
