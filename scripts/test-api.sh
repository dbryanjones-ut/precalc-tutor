#!/bin/bash

# API Test Script
# Tests all API endpoints to verify functionality
# Usage: ./scripts/test-api.sh [base-url]

set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "🚀 Testing API at $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    echo -n "Testing: $description... "

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (expected $expected_status, got $status_code)"
        echo "   Response: $body"
        FAIL=$((FAIL + 1))
    fi
}

echo "📚 Testing AI Tutor API"
echo "-----------------------------------"

if [ -n "$ANTHROPIC_API_KEY" ]; then
    test_endpoint "POST" "/api/ai/tutor" \
        '{"message":"What is 2 + 2?","mode":"socratic"}' \
        200 \
        "AI Tutor - Valid request"

    test_endpoint "POST" "/api/ai/tutor" \
        '{"message":"","mode":"socratic"}' \
        400 \
        "AI Tutor - Empty message validation"

    test_endpoint "POST" "/api/ai/tutor" \
        '{"message":"Test","mode":"invalid"}' \
        400 \
        "AI Tutor - Invalid mode validation"
else
    echo -e "${YELLOW}⏭️  Skipping (ANTHROPIC_API_KEY not set)${NC}"
fi

echo ""
echo "🖼️  Testing OCR API"
echo "-----------------------------------"

test_endpoint "POST" "/api/ocr" \
    '{"image":""}' \
    400 \
    "OCR - Empty image validation"

test_endpoint "POST" "/api/ocr" \
    '{"image":"not-valid-base64"}' \
    400 \
    "OCR - Invalid base64 validation"

echo ""
echo "📊 Testing Sessions API"
echo "-----------------------------------"

test_endpoint "GET" "/api/sessions" \
    "" \
    200 \
    "Sessions - GET all sessions"

test_endpoint "GET" "/api/sessions?page=1&limit=10" \
    "" \
    200 \
    "Sessions - GET with pagination"

test_endpoint "GET" "/api/sessions?mode=socratic&completed=true" \
    "" \
    200 \
    "Sessions - GET with filters"

test_endpoint "POST" "/api/sessions" \
    '{
        "extractedProblem":"x^2 + 5x + 6 = 0",
        "mode":"socratic",
        "messages":[],
        "duration":120,
        "questionsAsked":3,
        "hintsGiven":1,
        "completed":true
    }' \
    201 \
    "Sessions - POST create session"

test_endpoint "POST" "/api/sessions" \
    '{
        "extractedProblem":"",
        "mode":"socratic",
        "messages":[],
        "duration":0,
        "questionsAsked":0,
        "hintsGiven":0,
        "completed":false
    }' \
    400 \
    "Sessions - POST invalid data"

test_endpoint "DELETE" "/api/sessions?id=invalid-id" \
    "" \
    400 \
    "Sessions - DELETE invalid ID"

test_endpoint "DELETE" "/api/sessions?id=session-99999999" \
    "" \
    404 \
    "Sessions - DELETE non-existent session"

echo ""
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
TOTAL=$((PASS + FAIL))
echo "Total Tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS/$TOTAL)*100}")
    echo "Success Rate: $SUCCESS_RATE%"
fi

echo "=========================================="

# Exit with error if any tests failed
if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
