#!/usr/bin/env bash
# Load migration/data/graduates-seed.json into local DynamoDB.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TABLE_NAME="${DYNAMODB_TABLE_NAME:-math-history-ddb-local}"
ENDPOINT="${DYNAMODB_ENDPOINT:-http://127.0.0.1:8000}"
SEED_JSON="${ROOT}/migration/data/graduates-seed.json"
REGEN="${REGEN_SEED:-0}"

if [[ ! -f "$SEED_JSON" || "$REGEN" == "1" ]]; then
  echo "Generating graduates-seed.json from graduates.xml..."
  node "$ROOT/scripts/generate-graduates-seed.mjs"
fi

export AWS_REGION="${AWS_REGION:-eu-north-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"

echo "Writing to table=$TABLE_NAME endpoint=$ENDPOINT"
node "$ROOT/scripts/load-graduates-dynamodb.mjs" "$SEED_JSON" "$TABLE_NAME" "$ENDPOINT"
