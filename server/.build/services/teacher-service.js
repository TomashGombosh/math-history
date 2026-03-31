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
exports.findTeacherBySlug = findTeacherBySlug;
exports.getTeacherById = getTeacherById;
exports.createTeacher = createTeacher;
exports.updateTeacher = updateTeacher;
exports.deleteTeacher = deleteTeacher;
exports.listTeachers = listTeachers;
exports.getTeacherFilters = getTeacherFilters;
exports.listTeacherSlugsForSitemap = listTeacherSlugsForSitemap;
exports.getTeacherMetaAdmin = getTeacherMetaAdmin;
const dynamo_keys_1 = require("../lib/dynamo-keys");
const dynamo_operations_1 = require("../lib/dynamo-operations");
const counters_1 = require("./counters");
const slug_1 = require("./slug");
const DEFAULT_TEACHER_IMAGE_URL = '/profile-icon.webp';
function toPublic(t) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        id: t.id,
        name: t.name,
        title: (_a = t.title) !== null && _a !== void 0 ? _a : null,
        academicDegree: (_b = t.academicDegree) !== null && _b !== void 0 ? _b : null,
        position: (_c = t.position) !== null && _c !== void 0 ? _c : null,
        faculty: (_d = t.faculty) !== null && _d !== void 0 ? _d : null,
        shortInformation: (_e = t.shortInformation) !== null && _e !== void 0 ? _e : null,
        bio: (_f = t.bio) !== null && _f !== void 0 ? _f : null,
        publications: Array.isArray(t.publications) ? t.publications : [],
        imageUrl: (_g = t.imageUrl) !== null && _g !== void 0 ? _g : null,
        slug: t.slug,
    };
}
function queryAllTeacherItems() {
    return __awaiter(this, void 0, void 0, function* () {
        const out = [];
        let exclusiveStartKey;
        do {
            const { items, lastEvaluatedKey } = yield (0, dynamo_operations_1.queryItems)({
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
                ExpressionAttributeValues: {
                    ':pk': dynamo_keys_1.PK.TEACHER,
                    ':pfx': 'T#',
                },
                ExclusiveStartKey: exclusiveStartKey,
            });
            out.push(...items);
            exclusiveStartKey = lastEvaluatedKey;
        } while (exclusiveStartKey);
        return out;
    });
}
function findTeacherBySlug(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        const { items } = yield (0, dynamo_operations_1.queryItems)({
            IndexName: 'GSI1',
            KeyConditionExpression: 'gsi1pk = :p',
            ExpressionAttributeValues: {
                ':p': `SLUG#${slug}`,
            },
            Limit: 1,
        });
        const row = items[0];
        return row ? toPublic(row) : null;
    });
}
function getTeacherById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield (0, dynamo_operations_1.getItem)({
            Key: { pk: dynamo_keys_1.PK.TEACHER, sk: (0, dynamo_keys_1.teacherSortKey)(id) },
        });
        return (row === null || row === void 0 ? void 0 : row.entityType) === 'Teacher' ? toPublic(row) : null;
    });
}
function normalizeImageUrl(val) {
    if (val == null)
        return DEFAULT_TEACHER_IMAGE_URL;
    if (typeof val !== 'string')
        return DEFAULT_TEACHER_IMAGE_URL;
    const trimmed = val.trim();
    return trimmed ? trimmed : DEFAULT_TEACHER_IMAGE_URL;
}
function createTeacher(body) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const trimmedName = body.name.trim();
        if (!trimmedName) {
            throw new Error('NAME_REQUIRED');
        }
        let slug = yield (0, slug_1.createUniqueSlug)(trimmedName);
        if (!slug)
            slug = `teacher-${Date.now()}`;
        const id = yield (0, counters_1.nextTeacherId)();
        const sk = (0, dynamo_keys_1.teacherSortKey)(id);
        const gsi = (0, dynamo_keys_1.gsi1SlugKeys)(slug, sk);
        const publications = Array.isArray(body.publications) ? body.publications : [];
        const item = {
            pk: dynamo_keys_1.PK.TEACHER,
            sk,
            entityType: 'Teacher',
            id,
            name: trimmedName,
            slug,
            faculty: (_a = body.faculty) !== null && _a !== void 0 ? _a : '',
            position: (_b = body.position) !== null && _b !== void 0 ? _b : '',
            title: (_c = body.title) !== null && _c !== void 0 ? _c : '',
            academicDegree: (_d = body.academicDegree) !== null && _d !== void 0 ? _d : '',
            shortInformation: (_e = body.shortInformation) !== null && _e !== void 0 ? _e : '',
            bio: (_f = body.bio) !== null && _f !== void 0 ? _f : '',
            publications,
            imageUrl: normalizeImageUrl(body.imageUrl),
            gsi1pk: gsi.gsi1pk,
            gsi1sk: gsi.gsi1sk,
        };
        try {
            yield (0, dynamo_operations_1.putItem)({
                Item: item,
                ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
            });
        }
        catch (e) {
            const name = e && typeof e === 'object' && 'name' in e ? String(e.name) : '';
            if (name === 'ConditionalCheckFailedException') {
                throw new Error('SLUG_CONFLICT');
            }
            throw e;
        }
        return toPublic(item);
    });
}
function updateTeacher(id, body) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const existing = yield (0, dynamo_operations_1.getItem)({
            Key: { pk: dynamo_keys_1.PK.TEACHER, sk: (0, dynamo_keys_1.teacherSortKey)(id) },
        });
        if (!existing || existing.entityType !== 'Teacher') {
            throw new Error('NOT_FOUND');
        }
        const oldImageUrl = existing.imageUrl || null;
        let slug = existing.slug;
        if (body.name && body.name !== existing.name) {
            slug = yield (0, slug_1.createUniqueSlug)(body.name);
        }
        const sk = (0, dynamo_keys_1.teacherSortKey)(id);
        const gsi = (0, dynamo_keys_1.gsi1SlugKeys)(slug, sk);
        const merged = Object.assign(Object.assign({}, existing), { name: (_a = body.name) !== null && _a !== void 0 ? _a : existing.name, faculty: (_b = body.faculty) !== null && _b !== void 0 ? _b : existing.faculty, position: (_c = body.position) !== null && _c !== void 0 ? _c : existing.position, title: (_d = body.title) !== null && _d !== void 0 ? _d : existing.title, academicDegree: (_e = body.academicDegree) !== null && _e !== void 0 ? _e : existing.academicDegree, shortInformation: (_f = body.shortInformation) !== null && _f !== void 0 ? _f : existing.shortInformation, bio: (_g = body.bio) !== null && _g !== void 0 ? _g : existing.bio, publications: Array.isArray(body.publications) ? body.publications : existing.publications, imageUrl: body.imageUrl !== undefined ? normalizeImageUrl(body.imageUrl) : existing.imageUrl, slug, gsi1pk: gsi.gsi1pk, gsi1sk: gsi.gsi1sk });
        yield (0, dynamo_operations_1.putItem)({ Item: merged });
        return { teacher: toPublic(merged), oldImageUrl };
    });
}
function deleteTeacher(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield (0, dynamo_operations_1.getItem)({
            Key: { pk: dynamo_keys_1.PK.TEACHER, sk: (0, dynamo_keys_1.teacherSortKey)(id) },
        });
        if (!existing || existing.entityType !== 'Teacher') {
            return null;
        }
        const pub = toPublic(existing);
        yield (0, dynamo_operations_1.deleteItem)({
            Key: { pk: dynamo_keys_1.PK.TEACHER, sk: (0, dynamo_keys_1.teacherSortKey)(id) },
        });
        return pub;
    });
}
function listTeachers(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { page, limit, search, sortBy, sortDir, positions, degrees } = params;
        let rows = yield queryAllTeacherItems();
        let list = rows.map(toPublic);
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter((t) => t.name.toLowerCase().includes(q));
        }
        if (positions.length) {
            list = list.filter((t) => t.position && positions.includes(String(t.position)));
        }
        if (degrees.length) {
            list = list.filter((t) => t.academicDegree && degrees.includes(String(t.academicDegree)));
        }
        const direction = sortDir.toUpperCase() === 'DESC' ? -1 : 1;
        const byId = (a, b) => a.id - b.id;
        if (sortBy === 'position') {
            list.sort((a, b) => {
                var _a, _b;
                const cmp = direction * String((_a = a.position) !== null && _a !== void 0 ? _a : '').localeCompare(String((_b = b.position) !== null && _b !== void 0 ? _b : ''), 'uk');
                return cmp !== 0 ? cmp : byId(a, b);
            });
        }
        else if (sortBy === 'degree') {
            list.sort((a, b) => {
                var _a, _b;
                const cmp = direction * String((_a = a.academicDegree) !== null && _a !== void 0 ? _a : '').localeCompare(String((_b = b.academicDegree) !== null && _b !== void 0 ? _b : ''), 'uk');
                return cmp !== 0 ? cmp : byId(a, b);
            });
        }
        else if (sortBy === 'name') {
            list.sort((a, b) => {
                const cmp = direction * a.name.localeCompare(b.name, 'uk');
                return cmp !== 0 ? cmp : byId(a, b);
            });
        }
        else {
            list.sort(byId);
        }
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const offset = (page - 1) * limit;
        const teachers = list.slice(offset, offset + limit);
        return { teachers, total, totalPages, currentPage: page };
    });
}
function getTeacherFilters() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllTeacherItems();
        const posSet = new Set();
        const degSet = new Set();
        for (const t of rows) {
            if (t.position)
                posSet.add(String(t.position));
            if (t.academicDegree)
                degSet.add(String(t.academicDegree));
        }
        return {
            positions: Array.from(posSet).sort((a, b) => a.localeCompare(b, 'uk')),
            degrees: Array.from(degSet).sort((a, b) => a.localeCompare(b, 'uk')),
        };
    });
}
function listTeacherSlugsForSitemap() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllTeacherItems();
        return rows
            .filter((t) => t.slug && String(t.slug).trim())
            .map((t) => ({ slug: String(t.slug).trim() }));
    });
}
function getTeacherMetaAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield queryAllTeacherItems();
        const positionsSet = new Set();
        const degreesSet = new Set();
        for (const t of rows) {
            if (t.position) {
                const pos = String(t.position).trim();
                if (pos)
                    positionsSet.add(pos);
            }
            const rawDeg = (t.academicDegree || '').toString();
            if (!rawDeg)
                continue;
            rawDeg
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((deg) => degreesSet.add(deg));
        }
        const positions = Array.from(positionsSet).sort((a, b) => a.localeCompare(b, 'uk-UA'));
        const degrees = Array.from(degreesSet).sort((a, b) => a.localeCompare(b, 'uk-UA'));
        return { positions, degrees };
    });
}
