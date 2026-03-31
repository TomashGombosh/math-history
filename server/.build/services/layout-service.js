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
exports.getLayoutConfig = getLayoutConfig;
exports.saveLayoutConfig = saveLayoutConfig;
const dynamo_keys_1 = require("../lib/dynamo-keys");
const dynamo_operations_1 = require("../lib/dynamo-operations");
const layout_1 = require("../models/layout");
const SK_LAYOUT = 'LAYOUT';
const DEFAULT_CONFIG = {
    headerFields: [
        { id: 'title', label: 'Title', visible: true, order: 1 },
        {
            id: 'academicDegree',
            label: 'Науковий ступінь',
            visible: true,
            order: 2,
        },
        { id: 'position', label: 'Посада', visible: true, order: 3 },
        { id: 'faculty', label: 'Факультет', visible: true, order: 4 },
    ],
    sections: [
        {
            id: 'shortInformation',
            title: 'Коротка інформація',
            visible: true,
            order: 1,
        },
        { id: 'bio', title: 'Біографія', visible: true, order: 2 },
        { id: 'publications', title: 'Публікації', visible: true, order: 3 },
    ],
};
function getLayoutConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield (0, dynamo_operations_1.getItem)({
            Key: { pk: dynamo_keys_1.PK.CONFIG, sk: SK_LAYOUT },
        });
        if (!row || !row.payload) {
            yield (0, dynamo_operations_1.putItem)({
                Item: {
                    pk: dynamo_keys_1.PK.CONFIG,
                    sk: SK_LAYOUT,
                    entityType: 'Layout',
                    payload: DEFAULT_CONFIG,
                },
            });
            return DEFAULT_CONFIG;
        }
        const parsed = layout_1.layoutConfigSchema.safeParse(row.payload);
        return parsed.success ? parsed.data : DEFAULT_CONFIG;
    });
}
function saveLayoutConfig(cfg) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = layout_1.layoutConfigSchema.parse(cfg);
        yield (0, dynamo_operations_1.putItem)({
            Item: {
                pk: dynamo_keys_1.PK.CONFIG,
                sk: SK_LAYOUT,
                entityType: 'Layout',
                payload: parsed,
            },
        });
    });
}
