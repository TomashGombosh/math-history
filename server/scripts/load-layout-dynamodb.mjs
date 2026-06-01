#!/usr/bin/env node
/**
 * Loads layout config (legacy layoutConfig.json shape) into DynamoDB as CONFIG / LAYOUT.
 * Matches server_v2/src/services/layout-service.ts item shape.
 *
 * Usage: node load-layout-dynamodb.mjs <layout-seed.json> <tableName> [endpointUrl?]
 */
import { readFileSync } from "node:fs";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const jsonPath = process.argv[2];
const tableName = process.argv[3];
const endpoint = process.argv[4];

if (!jsonPath || !tableName) {
  console.error("Usage: node load-layout-dynamodb.mjs <layout-seed.json> <tableName> [endpointUrl]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!raw || typeof raw !== "object" || !Array.isArray(raw.headerFields) || !Array.isArray(raw.sections)) {
  console.error("Invalid layout seed: expected { headerFields: [], sections: [] }");
  process.exit(1);
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-north-1",
  ...(endpoint ? { endpoint } : {}),
});

const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const Item = {
  pk: "CONFIG",
  sk: "LAYOUT",
  entityType: "Layout",
  payload: raw,
};

async function main() {
  console.error(`Put CONFIG/LAYOUT -> ${tableName}${endpoint ? ` @ ${endpoint}` : ""}`);
  await doc.send(
    new PutCommand({
      TableName: tableName,
      Item,
    }),
  );
  console.error("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
