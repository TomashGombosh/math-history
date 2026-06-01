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
exports.nextTeacherId = nextTeacherId;
exports.nextGraduateCohortId = nextGraduateCohortId;
const dynamo_keys_1 = require("../lib/dynamo-keys");
const dynamo_operations_1 = require("../lib/dynamo-operations");
function nextTeacherId() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield (0, dynamo_operations_1.updateItem)({
            Key: { pk: dynamo_keys_1.PK.META, sk: 'SEQ#TEACHER' },
            UpdateExpression: 'ADD #s :one',
            ExpressionAttributeNames: { '#s': 'seq' },
            ExpressionAttributeValues: { ':one': 1 },
            ReturnValues: 'UPDATED_NEW',
        });
        return Number((_b = (_a = res.Attributes) === null || _a === void 0 ? void 0 : _a.seq) !== null && _b !== void 0 ? _b : 0);
    });
}
function nextGraduateCohortId() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield (0, dynamo_operations_1.updateItem)({
            Key: { pk: dynamo_keys_1.PK.META, sk: 'SEQ#GRADUATE' },
            UpdateExpression: 'ADD #s :one',
            ExpressionAttributeNames: { '#s': 'seq' },
            ExpressionAttributeValues: { ':one': 1 },
            ReturnValues: 'UPDATED_NEW',
        });
        return Number((_b = (_a = res.Attributes) === null || _a === void 0 ? void 0 : _a.seq) !== null && _b !== void 0 ? _b : 0);
    });
}
