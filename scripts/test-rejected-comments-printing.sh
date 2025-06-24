#!/bin/bash

echo "📝 Running Rejected Comments Printing Tests..."
echo "============================================="

# Set test environment
export NODE_ENV=test
export VITEST_ENVIRONMENT=jsdom

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Test Suite: Rejected Comments Printing${NC}"
echo ""

# Run rejected comments printing tests
echo -e "${YELLOW}Running rejected comments printing tests...${NC}"
npm test -- tests/rejected-comments-printing.test.ts --reporter=verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Rejected comments printing tests passed${NC}"
else
    echo -e "${RED}❌ Rejected comments printing tests failed${NC}"
    exit 1
fi

echo ""

# Run end-to-end rejected comments tests
echo -e "${YELLOW}Running end-to-end rejected comments tests...${NC}"
npm test -- tests/rejected-comments-e2e.test.ts --reporter=verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ End-to-end rejected comments tests passed${NC}"
else
    echo -e "${RED}❌ End-to-end rejected comments tests failed${NC}"
    exit 1
fi

echo ""

# Run performance tests for large comment sets
echo -e "${YELLOW}Running performance tests for rejected comments...${NC}"
npm test -- tests/rejected-comments-performance.test.ts --reporter=verbose --testNamePattern="Performance"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Performance tests passed${NC}"
else
    echo -e "${RED}❌ Performance tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All rejected comments printing tests completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "✅ Applicant details display at top"
echo "✅ Rejection status prominently shown"
echo "✅ Comments properly labeled with user types"
echo "✅ Rejection reasons highlighted"
echo "✅ Print functionality works correctly"
echo "✅ Download generates comprehensive reports"
echo "✅ Authorization controls enforced"
echo "✅ Error handling for edge cases"
echo "✅ Performance with large comment sets"
echo "✅ End-to-end workflow integration"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "- Run full system integration tests"
echo "- Test mobile responsiveness"
echo "- Deploy to staging environment"
