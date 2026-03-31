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
exports.listGraduateRows = listGraduateRows;
exports.getGraduateYearDetail = getGraduateYearDetail;
exports.listGraduateYearsForSitemap = listGraduateYearsForSitemap;
exports.getYearsSummary = getYearsSummary;
exports.getSpecialties = getSpecialties;
exports.createGraduate = createGraduate;
exports.getCohortsForYear = getCohortsForYear;
exports.getCohortByYear = getCohortByYear;
exports.updateGraduateByYear = updateGraduateByYear;
exports.deleteGraduateByYear = deleteGraduateByYear;
exports.graduateToJson = graduateToJson;
const dynamo_keys_1 = require("../lib/dynamo-keys");
const lambda_log_1 = require("../lib/lambda-log");
const dynamo_operations_1 = require("../lib/dynamo-operations");
const counters_1 = require("./counters");
function queryAllGraduateItems(correlation) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const t0 = Date.now();
        const base = Object.assign(Object.assign({}, correlation), { service: 'math-history-server' });
        (0, lambda_log_1.logInfo)('graduate:queryAll:start', Object.assign(Object.assign({}, base), { dynamoTable: (_a = process.env.DYNAMODB_TABLE_NAME) !== null && _a !== void 0 ? _a : 'unset', durationMs: 0 }));
        const out = [];
        let exclusiveStartKey;
        let page = 0;
        do {
            const pageStart = Date.now();
            page += 1;
            const { items, lastEvaluatedKey } = yield (0, dynamo_operations_1.queryItems)({
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
                ExpressionAttributeValues: {
                    ':pk': dynamo_keys_1.PK.GRADUATE,
                    ':pfx': 'Y#',
                },
                ExclusiveStartKey: exclusiveStartKey,
            });
            (0, lambda_log_1.logInfo)('graduate:queryAll:page', Object.assign(Object.assign({}, base), { page, itemCount: items.length, hasMore: Boolean(lastEvaluatedKey), pageDurationMs: Date.now() - pageStart, durationMs: Date.now() - t0 }));
            out.push(...items);
            exclusiveStartKey = lastEvaluatedKey;
        } while (exclusiveStartKey);
        (0, lambda_log_1.logInfo)('graduate:queryAll:done', Object.assign(Object.assign({}, base), { totalItems: out.length, pages: page, durationMs: Date.now() - t0 }));
        return out;
    });
}
function listGraduateRows(yearFilter, correlation) {
    return __awaiter(this, void 0, void 0, function* () {
        const all = yield queryAllGraduateItems(correlation);
        let rows = all;
        if (yearFilter && !Number.isNaN(yearFilter)) {
            rows = all.filter((g) => g.year === yearFilter);
        }
        rows.sort((a, b) => {
            var _a, _b, _c, _d;
            if (a.year !== b.year)
                return a.year - b.year;
            if (((_a = a.number) !== null && _a !== void 0 ? _a : 0) !== ((_b = b.number) !== null && _b !== void 0 ? _b : 0))
                return ((_c = a.number) !== null && _c !== void 0 ? _c : 0) - ((_d = b.number) !== null && _d !== void 0 ? _d : 0);
            return a.id - b.id;
        });
        return rows;
    });
}
function getGraduateYearDetail(yearNum) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const cohorts = yield listGraduateRows(yearNum);
        if (!cohorts.length) {
            return {
                year: yearNum,
                title: `Випуск ${yearNum} року`,
                images: [],
                students: [],
            };
        }
        const mainTitle = cohorts[0].title || `Випуск ${yearNum} року`;
        const images = [];
        const allStudents = [];
        let nextGeneratedId = 1;
        for (const cohort of cohorts) {
            const c = cohort;
            if (Array.isArray(c.images)) {
                for (const img of c.images) {
                    images.push(img);
                }
            }
            if (Array.isArray(c.students)) {
                for (const st of c.students) {
                    let id = ((_a = st.id) !== null && _a !== void 0 ? _a : st.index2);
                    if (id == null) {
                        id = nextGeneratedId++;
                    }
                    const honors = st.honorsDegree === true || st.honorsDegree === 'true' || st.isBold === true || st.isBold === 'true';
                    allStudents.push({
                        id: Number(id),
                        index: Number((_c = (_b = st.index) !== null && _b !== void 0 ? _b : st.index1) !== null && _c !== void 0 ? _c : 0),
                        name: String((_e = (_d = st.name) !== null && _d !== void 0 ? _d : st.text) !== null && _e !== void 0 ? _e : ''),
                        specialty: String(st.specialty || ''),
                        section: String(st.section || ''),
                        honorsDegree: Boolean(honors),
                    });
                }
            }
        }
        return {
            year: yearNum,
            title: String(mainTitle),
            images,
            students: allStudents,
        };
    });
}
function listGraduateYearsForSitemap(correlation) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllGraduateItems(correlation);
        const maxUpdatedByYear = new Map();
        for (const g of rows) {
            const raw = g.updatedAt;
            if (typeof raw !== 'string' || !raw.trim())
                continue;
            const prev = maxUpdatedByYear.get(g.year);
            if (!prev || raw > prev) {
                maxUpdatedByYear.set(g.year, raw);
            }
        }
        const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
        return years.map((year) => {
            const iso = maxUpdatedByYear.get(year);
            return {
                year,
                lastmod: iso ? iso.split('T')[0] : undefined,
            };
        });
    });
}
function getYearsSummary(correlation) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const rows = yield queryAllGraduateItems(correlation);
        const byYear = new Map();
        for (const g of rows) {
            const cur = (_a = byYear.get(g.year)) !== null && _a !== void 0 ? _a : { totalStudents: 0, totalWithHonours: 0, cohortsCount: 0 };
            cur.totalStudents += g.totalStudents;
            cur.totalWithHonours += g.totalWithHonours;
            cur.cohortsCount += 1;
            byYear.set(g.year, cur);
        }
        return Array.from(byYear.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([year, v]) => ({
            year,
            totalStudents: v.totalStudents,
            totalWithHonours: v.totalWithHonours,
            cohortsCount: v.cohortsCount,
        }));
    });
}
function getSpecialties(correlation) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllGraduateItems(correlation);
        const set = new Set();
        for (const g of rows) {
            const list = Array.isArray(g.students) ? g.students : [];
            for (const st of list) {
                if (st && typeof st.specialty === 'string') {
                    const val = st.specialty.trim();
                    if (val)
                        set.add(val);
                }
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' }));
    });
}
function getMaxStudentId() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllGraduateItems();
        let maxId = 0;
        for (const g of rows) {
            const arr = Array.isArray(g.students) ? g.students : [];
            for (const st of arr) {
                const idNum = Number(st.id);
                if (!Number.isNaN(idNum) && idNum > maxId) {
                    maxId = idNum;
                }
            }
        }
        return maxId;
    });
}
function yearHasAnyCohort(yearNum) {
    return __awaiter(this, void 0, void 0, function* () {
        const { items } = yield (0, dynamo_operations_1.queryItems)({
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
            ExpressionAttributeValues: {
                ':pk': dynamo_keys_1.PK.GRADUATE,
                ':pfx': `Y#${yearNum}#`,
            },
            Limit: 1,
        });
        return items.length > 0;
    });
}
function createGraduate(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const yearNum = Number(body.year);
        if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            throw new Error('INVALID_YEAR');
        }
        const title = (body.title || '').toString().trim();
        const images = Array.isArray(body.images) ? body.images : [];
        const studentsRaw = Array.isArray(body.students) ? body.students : [];
        if (!studentsRaw.length) {
            throw new Error('STUDENTS_REQUIRED');
        }
        if (yield yearHasAnyCohort(yearNum)) {
            throw new Error('YEAR_EXISTS');
        }
        const maxExistingId = yield getMaxStudentId();
        let nextId = maxExistingId + 1;
        const students = [];
        for (const s of studentsRaw) {
            const name = (s.name || '').toString().trim();
            if (!name)
                continue;
            const specialty = (s.specialty || '').toString().trim();
            const section = (s.section || '').toString().trim();
            const honors = !!s.honorsDegree;
            const indexVal = Number(s.index);
            const index = !Number.isNaN(indexVal) && indexVal > 0 ? indexVal : students.length + 1;
            const incomingId = Number(s.id);
            const id = Number.isInteger(incomingId) && incomingId > maxExistingId ? incomingId : nextId++;
            students.push({
                id,
                index,
                name,
                specialty,
                section,
                year: yearNum,
                honorsDegree: honors,
            });
        }
        if (!students.length) {
            throw new Error('STUDENTS_EMPTY');
        }
        const totalStudents = students.length;
        const totalWithHonours = students.filter((s) => s.honorsDegree).length;
        const cohortId = yield (0, counters_1.nextGraduateCohortId)();
        const sk = (0, dynamo_keys_1.graduateSortKey)(yearNum, cohortId);
        const item = {
            pk: dynamo_keys_1.PK.GRADUATE,
            sk,
            entityType: 'Graduate',
            id: cohortId,
            year: yearNum,
            number: null,
            title,
            images,
            students,
            totalStudents,
            totalWithHonours,
        };
        yield (0, dynamo_operations_1.putItem)({ Item: item });
        return { ok: true, id: cohortId, year: yearNum };
    });
}
function getCohortsForYear(yearNum) {
    return __awaiter(this, void 0, void 0, function* () {
        const all = yield queryAllGraduateItems();
        return all.filter((g) => g.year === yearNum).sort((a, b) => a.id - b.id);
    });
}
function getCohortByYear(yearNum) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield getCohortsForYear(yearNum);
        const row = rows[0];
        return (row === null || row === void 0 ? void 0 : row.entityType) === 'Graduate' ? row : null;
    });
}
function updateGraduateByYear(currentYear, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const yearNum = Number(body.year);
        if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            throw new Error('INVALID_YEAR');
        }
        const title = (body.title || '').toString().trim();
        const images = Array.isArray(body.images) ? body.images : [];
        const studentsRaw = Array.isArray(body.students) ? body.students : [];
        if (!studentsRaw.length) {
            throw new Error('STUDENTS_REQUIRED');
        }
        const grad = yield getCohortByYear(currentYear);
        if (!grad) {
            throw new Error('NOT_FOUND');
        }
        const oldImages = Array.isArray(grad.images) ? grad.images : [];
        const oldUrls = new Set(oldImages.map((img) => img === null || img === void 0 ? void 0 : img.url).filter(Boolean));
        if (yearNum !== currentYear) {
            const exists = yield yearHasAnyCohort(yearNum);
            if (exists) {
                throw new Error('YEAR_EXISTS');
            }
        }
        const maxExistingId = yield getMaxStudentId();
        let nextId = maxExistingId + 1;
        const students = [];
        for (const s of studentsRaw) {
            const name = (s.name || '').toString().trim();
            if (!name)
                continue;
            const specialty = (s.specialty || '').toString().trim();
            const section = (s.section || '').toString().trim();
            const honors = !!s.honorsDegree;
            const indexVal = Number(s.index);
            const index = !Number.isNaN(indexVal) && indexVal > 0 ? indexVal : students.length + 1;
            const incomingId = Number(s.id);
            const id = Number.isInteger(incomingId) && incomingId > maxExistingId ? incomingId : nextId++;
            students.push({
                id,
                index,
                name,
                specialty,
                section,
                year: yearNum,
                honorsDegree: honors,
            });
        }
        if (!students.length) {
            throw new Error('STUDENTS_EMPTY');
        }
        const totalStudents = students.length;
        const totalWithHonours = students.filter((s) => s.honorsDegree).length;
        const newUrls = new Set(images.map((img) => img === null || img === void 0 ? void 0 : img.url).filter(Boolean));
        const removedUrls = [...oldUrls].filter((url) => !newUrls.has(url));
        const newSk = (0, dynamo_keys_1.graduateSortKey)(yearNum, grad.id);
        const updated = Object.assign(Object.assign({}, grad), { sk: newSk, year: yearNum, title,
            images,
            students,
            totalStudents,
            totalWithHonours });
        if (newSk !== grad.sk) {
            yield (0, dynamo_operations_1.deleteItem)({ Key: { pk: dynamo_keys_1.PK.GRADUATE, sk: grad.sk } });
        }
        yield (0, dynamo_operations_1.putItem)({ Item: updated });
        return { ok: true, year: yearNum, id: grad.id, removedUrls };
    });
}
function deleteGraduateByYear(yearNum) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield getCohortsForYear(yearNum);
        if (!rows.length) {
            return null;
        }
        const imageUrls = [];
        const ids = [];
        for (const grad of rows) {
            ids.push(grad.id);
            const images = Array.isArray(grad.images) ? grad.images : [];
            for (const img of images) {
                const url = img === null || img === void 0 ? void 0 : img.url;
                if (url)
                    imageUrls.push(url);
            }
            yield (0, dynamo_operations_1.deleteItem)({
                Key: { pk: dynamo_keys_1.PK.GRADUATE, sk: grad.sk },
            });
        }
        return { ok: true, year: yearNum, ids, imageUrls };
    });
}
function graduateToJson(g) {
    var _a, _b, _c, _d;
    return {
        id: g.id,
        year: g.year,
        number: (_a = g.number) !== null && _a !== void 0 ? _a : null,
        title: (_b = g.title) !== null && _b !== void 0 ? _b : null,
        students: g.students,
        images: g.images,
        totalStudents: g.totalStudents,
        totalWithHonours: g.totalWithHonours,
        createdAt: (_c = g.createdAt) !== null && _c !== void 0 ? _c : null,
        updatedAt: (_d = g.updatedAt) !== null && _d !== void 0 ? _d : null,
    };
}
