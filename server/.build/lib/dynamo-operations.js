"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItem = getItem;
exports.putItem = putItem;
exports.deleteItem = deleteItem;
exports.updateItem = updateItem;
exports.queryItems = queryItems;
exports.scanItems = scanItems;
exports.transactWrite = transactWrite;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("./dynamo-client");
function tableName() {
    const name = process.env.DYNAMODB_TABLE_NAME;
    if (!name) {
        throw new Error('DYNAMODB_TABLE_NAME is not set');
    }
    return name;
}
function getItem(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(Object.assign({ TableName: tableName() }, input)));
        return res.Item;
    });
}
function putItem(input) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dynamo_client_1.docClient.send(new lib_dynamodb_1.PutCommand(Object.assign({ TableName: tableName() }, input)));
    });
}
function deleteItem(input) {
    return __awaiter(this, void 0, void 0, function* () {
        yield dynamo_client_1.docClient.send(new lib_dynamodb_1.DeleteCommand(Object.assign({ TableName: tableName() }, input)));
    });
}
function updateItem(input) {
    return __awaiter(this, void 0, void 0, function* () {
        return dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(Object.assign({ TableName: tableName() }, input)));
    });
}
function queryItems(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(Object.assign({ TableName: tableName() }, input)));
        return {
            items: ((_a = res.Items) !== null && _a !== void 0 ? _a : []),
            lastEvaluatedKey: res.LastEvaluatedKey,
        };
    });
}
function scanItems(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield dynamo_client_1.docClient.send(new lib_dynamodb_1.ScanCommand(Object.assign({ TableName: tableName() }, input)));
        return {
            items: ((_a = res.Items) !== null && _a !== void 0 ? _a : []),
            lastEvaluatedKey: res.LastEvaluatedKey,
        };
    });
}
function transactWrite(input) {
    return __awaiter(this, void 0, void 0, function* () {
        return dynamo_client_1.docClient.send(new lib_dynamodb_1.TransactWriteCommand(input));
    });
}
