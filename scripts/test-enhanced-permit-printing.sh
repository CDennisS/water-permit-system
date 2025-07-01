#!/bin/bash

# Enhanced Permit Printing Test Script
# Tests all aspects of the improved permit printing functionality

echo "🧪 Running Enhanced Permit Printing Tests..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Running: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# 1. Core Functionality Tests
echo -e "${YELLOW}📋 Testing Core Functionality...${NC}"
run_test "Enhanced Permit Printing Tests" "npm test tests/enhanced-permit-printing.test.ts"
run_test "Performance Optimization Tests" "npm test tests/permit-printing-performance.test.ts"
run_test "Integration Tests" "npm test tests/permit-printing-integration.test.ts"

# 2. Permission and Security Tests
echo -e "${YELLOW}🔒 Testing Permissions and Security...${NC}"
run_test "Permission Checks" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'Permission Checks'"
run_test "User Authentication" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'unauthenticated users'"

# 3. Error Handling Tests
echo -e "${YELLOW}⚠️ Testing Error Handling...${NC}"
run_test "Print Error Handling" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'Error Handling'"
run_test "Download Error Handling" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'download errors'"
run_test "Integration Error Recovery" "npm test tests/permit-printing-integration.test.ts -- --grep 'Error Recovery'"

# 4. Performance Tests
echo -e "${YELLOW}⚡ Testing Performance Optimizations...${NC}"
run_test "Memoization Tests" "npm test tests/permit-printing-performance.test.ts -- --grep 'Memoization'"
run_test "Render Performance" "npm test tests/permit-printing-performance.test.ts -- --grep 'Render Performance'"
run_test "Memory Management" "npm test tests/permit-printing-performance.test.ts -- --grep 'Memory Management'"

# 5. Accessibility Tests
echo -e "${YELLOW}♿ Testing Accessibility...${NC}"
run_test "ARIA Labels" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'ARIA labels'"
run_test "Dialog Accessibility" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'dialog accessibility'"
run_test "Disabled State" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'disabled state'"

# 6. Print Functionality Tests
echo -e "${YELLOW}🖨️ Testing Print Functionality...${NC}"
run_test "Print with Preview" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'print from preview'"
run_test "Direct Print" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'direct print without preview'"
run_test "Print Window Handling" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'print window blocked'"

# 7. Download Functionality Tests
echo -e "${YELLOW}💾 Testing Download Functionality...${NC}"
run_test "Permit Download" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'permit download'"
run_test "Download Content Validation" "npm test tests/permit-printing-integration.test.ts -- --grep 'Print Content Validation'"

# 8. State Management Tests
echo -e "${YELLOW}🔄 Testing State Management...${NC}"
run_test "Loading States" "npm test tests/permit-printing-integration.test.ts -- --grep 'loading states'"
run_test "Preview Dialog State" "npm test tests/permit-printing-integration.test.ts -- --grep 'preview dialog state'"

# 9. Component Integration Tests
echo -e "${YELLOW}🔗 Testing Component Integration...${NC}"
run_test "PermitTemplate Integration" "npm test tests/permit-printing-integration.test.ts -- --grep 'PermitTemplate component'"
run_test "Props Passing" "npm test tests/permit-printing-integration.test.ts -- --grep 'correct props'"

# 10. Development vs Production Tests
echo -e "${YELLOW}🏗️ Testing Environment Handling...${NC}"
run_test "Development Logging" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'development mode'"
run_test "Production Mode" "npm test tests/enhanced-permit-printing.test.ts -- --grep 'production mode'"

# Summary
echo "=============================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=============================================="
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Enhanced permit printing is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
