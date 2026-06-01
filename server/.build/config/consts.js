"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONT = exports.DEFAULT_REGION = exports.isTest = exports.isLambda = exports.isLocal = exports.isStage = exports.isProduction = void 0;
exports.isProduction = process.env.NODE_ENV === 'production';
exports.isStage = process.env.NODE_ENV === 'stage';
exports.isLocal = process.env.NODE_ENV === 'local';
exports.isLambda = exports.isProduction || exports.isStage;
exports.isTest = process.env.NODE_ENV === 'test';
exports.DEFAULT_REGION = 'eu-north-1';
exports.FRONT = exports.isLocal
    ? ((_a = process.env.CORS_ORIGIN) === null || _a === void 0 ? void 0 : _a.trim()) || 'http://localhost:5173'
    : `https://math-history${exports.isProduction ? '' : '-stage'}.afj-solution.com`;
