"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const app = __importStar(require("../index.js"));
const cron = __importStar(require("../cron/index.js"));
const queues = __importStar(require("../queues/index.js"));
const env_js_1 = require("../config/env.js");
const cache_js_1 = require("../lib/cache.js");
const consts_js_1 = require("./consts.js");
const { lambdaWrapper } = require('serverless-jest-plugin');
const wrapped = lambdaWrapper.wrap(app, { handler: 'handler' });
const wrappedCron = lambdaWrapper.wrap(cron, { handler: 'handler' });
const wrappedQueues = lambdaWrapper.wrap(queues, { handler: 'consumer' });
let cache;
const moduleFolderPath = path_1.default.join(__dirname, '..', 'modules');
const requestContext = {
    http: {
        sourceIp: consts_js_1.TEST_IP,
    },
};
process.env.LANG = 'en';
describe('api', () => {
    var _a;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield (0, env_js_1.getConfig)();
        cache = (0, cache_js_1.getCache)(config);
    }));
    const tests = ((_a = process.env.TESTS) === null || _a === void 0 ? void 0 : _a.split(',').map((v) => v.trim())) ||
        [
            'sitemap.xml/get',
            'api/layout/get',
            'api/layout/put',
            'api/teachers/filters/get',
            'api/teachers/get',
            'api/teachers/meta/get',
            'api/teachers/post',
            'api/teachers/by-slug/_slug/get',
            'api/teachers/_id/get',
            'api/teachers/_id/put',
            'api/teachers/_id/delete',
            'api/graduates/get',
            'api/graduates/years/get',
            'api/graduates/specialties/get',
            'api/graduates/_year/get',
            'api/graduates/post',
            'api/graduates/_year/put',
            'api/graduates/_year/delete',
            'api/upload/presign/post',
        ];
    for (const module of tests) {
        require(`${moduleFolderPath}/${module}/test.js`)(module.includes('/cron/') ? wrappedCron : module.includes('/queues/') ? wrappedQueues : wrapped, expect, requestContext);
    }
    afterAll((done) => {
        cache.disconnect();
        const ret = Number(done()) || 0;
        setTimeout(() => process.exit(ret), 1000);
    });
});
