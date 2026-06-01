#!/usr/bin/env node
/**
 * Loads migration/data/graduates-seed.json into DynamoDB (BatchWrite + META SEQ#GRADUATE).
 */
import { readFileSync } from "node:fs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const jsonPath = process.argv[2];
const tableName = process.argv[3];
const endpoint = process.argv[4];

if (!jsonPath || !tableName) {
  console.error("Usage: node load-graduates-dynamodb.mjs <graduates-seed.json> <tableName> [endpointUrl]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
const items = raw.items;
const graduateSeq = Number(raw.graduateSeq);
if (!Array.isArray(items) || !Number.isFinite(graduateSeq)) {
  console.error("Invalid seed file: expected { items, graduateSeq }");
  process.exit(1);
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-north-1",
  ...(endpoint ? { endpoint } : {}),
});

const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

async function batchWriteAll(rows) {
  const chunkSize = 25;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    let request = {
      RequestItems: {
        [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })),
      },
    };

    for (let attempt = 0; attempt < 12; attempt++) {
      const out = await doc.send(new BatchWriteCommand(request));
      const unprocessed = out.UnprocessedItems?.[tableName];
      if (!unprocessed?.length) break;
      if (attempt === 11) {
        throw new Error(`BatchWrite still has ${unprocessed.length} unprocessed items`);
      }
      request = { RequestItems: { [tableName]: unprocessed } };
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
}

async function putMetaSeq() {
  await doc.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: "META",
        sk: "SEQ#GRADUATE",
        seq: graduateSeq,
      },
    }),
  );
}

async function main() {
  console.error(`Loading ${items.length} items -> ${tableName}${endpoint ? ` @ ${endpoint}` : ""}`);
  await batchWriteAll(items);
  await putMetaSeq();
  console.error(`Done. META SEQ#GRADUATE seq=${graduateSeq}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
