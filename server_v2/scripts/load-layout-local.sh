#!/usr/bin/env bash
# Load migration/data/layout-seed.json into local DynamoDB (same item as legacy layoutConfig.json).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TABLE_NAME="${DYNAMODB_TABLE_NAME:-math-history-ddb-local}"
ENDPOINT="${DYNAMODB_ENDPOINT:-http://127.0.0.1:8000}"
SEED_JSON="${ROOT}/migration/data/layout-seed.json"

export AWS_REGION="${AWS_REGION:-eu-north-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"

echo "Writing layout CONFIG/LAYOUT to table=$TABLE_NAME endpoint=$ENDPOINT"
node "$ROOT/scripts/load-layout-dynamodb.mjs" "$SEED_JSON" "$TABLE_NAME" "$ENDPOINT"
