#!/bin/bash

API_KEY="test_api_key_123"
BASE_URL="http://localhost:8000"

echo "Testing /convert endpoint..."
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_requirements.txt" \
  $BASE_URL/convert

echo -e "\n\nTesting /check-compatibility endpoint..."
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_requirements.txt" \
  $BASE_URL/check-compatibility

echo -e "\n\nTesting /check-vulnerabilities endpoint..."
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_requirements.txt" \
  $BASE_URL/check-vulnerabilities

echo -e "\n\nTesting /check-python-compatibility endpoint..."
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_requirements.txt" \
  "$BASE_URL/check-python-compatibility?python_version=3.8"

echo -e "\n\nTesting /generate-requirements endpoint..."
# First get the JSON from /convert
JSON_RESPONSE=$(curl -s -X POST \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_requirements.txt" \
  $BASE_URL/convert)

# Then use that JSON to generate requirements.txt
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_RESPONSE" \
  $BASE_URL/generate-requirements 