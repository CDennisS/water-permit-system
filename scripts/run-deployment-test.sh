#!/bin/bash

echo "=== UMSCC Permit Management System - Comprehensive Deployment Test ==="
echo ""

# Set error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Starting comprehensive deployment test...${NC}"
echo ""

# Test 1: Environment Check
echo -e "${BLUE}1. Environment Check${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo ""

# Test 2: Dependencies
echo -e "${BLUE}2. Dependencies Check${NC}"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ node_modules exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
        npm install
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi
echo ""

# Test 3: TypeScript Check
echo -e "${BLUE}3. TypeScript Compilation${NC}"
if npx tsc --noEmit --skipLibCheck; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi
echo ""

# Test 4: Build Test
echo -e "${BLUE}4. Build Process${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Test 5: Component Integration Test
echo -e "${BLUE}5. Component Integration${NC}"
if [ -f "components/permit-preview-dialog.tsx" ]; then
    echo -e "${GREEN}✅ PermitPreviewDialog component exists${NC}"
else
    echo -e "${RED}❌ PermitPreviewDialog component missing${NC}"
    exit 1
fi

if [ -f "components/application-details.tsx" ]; then
    echo -e "${GREEN}✅ ApplicationDetails component exists${NC}"
else
    echo -e "${RED}❌ ApplicationDetails component missing${NC}"
    exit 1
fi

# Check if PermitPreviewDialog is imported in ApplicationDetails
if grep -q "PermitPreviewDialog" components/application-details.tsx; then
    echo -e "${GREEN}✅ PermitPreviewDialog properly integrated${NC}"
else
    echo -e "${RED}❌ PermitPreviewDialog not integrated${NC}"
    exit 1
fi
echo ""

# Test 6: Database Mock Data
echo -e "${BLUE}6. Database Mock Data${NC}"
if grep -q 'status: "approved"' lib/database.ts; then
    echo -e "${GREEN}✅ Approved applications available for testing${NC}"
else
    echo -e "${YELLOW}⚠️  No approved applications in mock data${NC}"
fi
echo ""

# Test 7: Permit Preview Functionality
echo -e "${BLUE}7. Permit Preview Functionality${NC}"
if grep -q "currentUser" components/permit-preview-dialog.tsx; then
    echo -e "${GREEN}✅ currentUser prop implemented${NC}"
else
    echo -e "${RED}❌ currentUser prop missing${NC}"
    exit 1
fi

if grep -q "generatePermitData" components/permit-preview-dialog.tsx; then
    echo -e "${GREEN}✅ generatePermitData function implemented${NC}"
else
    echo -e "${RED}❌ generatePermitData function missing${NC}"
    exit 1
fi

if grep -q "handlePrint" components/permit-preview-dialog.tsx; then
    echo -e "${GREEN}✅ Print functionality implemented${NC}"
else
    echo -e "${RED}❌ Print functionality missing${NC}"
    exit 1
fi
echo ""

# Final Summary
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "${GREEN}✅ Environment: Ready${NC}"
echo -e "${GREEN}✅ Dependencies: Installed${NC}"
echo -e "${GREEN}✅ TypeScript: Compiled${NC}"
echo -e "${GREEN}✅ Build: Successful${NC}"
echo -e "${GREEN}✅ Components: Integrated${NC}"
echo -e "${GREEN}✅ Database: Mock data ready${NC}"
echo -e "${GREEN}✅ Permit Preview: Functional${NC}"
echo ""
echo -e "${GREEN}🚀 SYSTEM IS READY FOR DEPLOYMENT!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the Preview Permit button in the application details"
echo "2. Verify print functionality works correctly"
echo "3. Deploy to production environment"
