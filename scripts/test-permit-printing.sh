#!/bin/bash

echo "🧪 TESTING PERMIT PRINTING WORKFLOW"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run test and check result
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}Running: $test_name${NC}"
    echo "Command: $test_command"
    
    if eval $test_command; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        return 1
    fi
}

# Initialize test results
total_tests=0
passed_tests=0

# Test 1: Permit Printing Workflow Tests
total_tests=$((total_tests + 1))
if run_test "Permit Printing Workflow Tests" "npm run test tests/permit-printing-workflow.test.ts"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 2: End-to-End Permit Printing Tests
total_tests=$((total_tests + 1))
if run_test "End-to-End Permit Printing Tests" "npm run test tests/permit-printing-e2e.test.ts"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 3: Permit Generation Tests
total_tests=$((total_tests + 1))
if run_test "Permit Generation Tests" "npm run test -- --testNamePattern='Permit Data Generation'"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 4: Authorization Tests
total_tests=$((total_tests + 1))
if run_test "Permit Printing Authorization Tests" "npm run test -- --testNamePattern='Permit Printing Authorization'"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 5: Workflow Integration Tests
total_tests=$((total_tests + 1))
if run_test "Workflow Integration Tests" "npm run test -- --testNamePattern='Workflow Integration'"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 6: Print Functionality Tests
total_tests=$((total_tests + 1))
if run_test "Print Functionality Tests" "npm run test -- --testNamePattern='Print Functionality'"; then
    passed_tests=$((passed_tests + 1))
fi

# Test 7: Performance Tests
total_tests=$((total_tests + 1))
if run_test "Performance and Edge Cases" "npm run test -- --testNamePattern='Performance and Edge Cases'"; then
    passed_tests=$((passed_tests + 1))
fi

# Summary
echo -e "\n" + "=" * 50
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo "============"
echo -e "Total Tests: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 ALL PERMIT PRINTING TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ System can successfully print permits after approval${NC}"
    echo -e "${GREEN}✅ Authorization controls working correctly${NC}"
    echo -e "${GREEN}✅ Complete workflow tested end-to-end${NC}"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Please review the failed tests above${NC}"
    exit 1
fi
