#!/bin/bash

echo "🚀 UMSCC Permit Management System - Comprehensive Deployment Test"
echo "================================================================"
echo ""

# Set error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Check prerequisites
print_status "INFO" "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_status "ERROR" "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_status "ERROR" "npm is not installed"
    exit 1
fi

print_status "SUCCESS" "Prerequisites check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "INFO" "Installing dependencies..."
    npm install
    print_status "SUCCESS" "Dependencies installed"
fi

# Run TypeScript compilation check
print_status "INFO" "Checking TypeScript compilation..."
if npx tsc --noEmit; then
    print_status "SUCCESS" "TypeScript compilation passed"
else
    print_status "ERROR" "TypeScript compilation failed"
    exit 1
fi

# Check critical files exist
print_status "INFO" "Checking critical files..."
CRITICAL_FILES=(
    "components/permit-preview-dialog.tsx"
    "components/permit-print-workflow.tsx"
    "components/permitting-officer-applications-table.tsx"
    "app/page.tsx"
    "lib/database.ts"
    "types/index.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "SUCCESS" "$file exists"
    else
        print_status "ERROR" "$file is missing"
        exit 1
    fi
done

# Run the comprehensive test
print_status "INFO" "Running comprehensive deployment tests..."
if node -r ts-node/register scripts/test-deployment-comprehensive.ts; then
    print_status "SUCCESS" "Comprehensive tests passed"
else
    print_status "ERROR" "Comprehensive tests failed"
    exit 1
fi

# Test build process
print_status "INFO" "Testing build process..."
if npm run build; then
    print_status "SUCCESS" "Build process completed successfully"
else
    print_status "ERROR" "Build process failed"
    exit 1
fi

# Final status
echo ""
echo "================================================================"
print_status "SUCCESS" "ALL DEPLOYMENT TESTS PASSED!"
echo ""
print_status "INFO" "Key fixes implemented:"
echo "   • Fixed Preview Permit button responsiveness"
echo "   • Proper integration in permit workflow"
echo "   • Complete error handling and logging"
echo "   • Full TypeScript type safety"
echo "   • Working print and download functionality"
echo ""
print_status "INFO" "System is ready for deployment!"
echo "================================================================"
