"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PK = void 0;
exports.teacherSortKey = teacherSortKey;
exports.parseTeacherIdFromSk = parseTeacherIdFromSk;
exports.graduateSortKey = graduateSortKey;
exports.parseGraduateYearCohort = parseGraduateYearCohort;
exports.gsi1SlugKeys = gsi1SlugKeys;
exports.PK = {
    TEACHER: 'TEACHER',
    GRADUATE: 'GRADUATE',
    CONFIG: 'CONFIG',
    META: 'META',
};
function teacherSortKey(id) {
    return `T#${String(id).padStart(9, '0')}`;
}
function parseTeacherIdFromSk(sk) {
    const m = /^T#(\d+)$/.exec(sk);
    if (!m)
        return null;
    return Number(m[1]);
}
function graduateSortKey(year, cohortId) {
    return `Y#${year}#${String(cohortId).padStart(9, '0')}`;
}
function parseGraduateYearCohort(sk) {
    const m = /^Y#(\d+)#(\d+)$/.exec(sk);
    if (!m)
        return null;
    return { year: Number(m[1]), cohortId: Number(m[2]) };
}
function gsi1SlugKeys(slug, teacherSk) {
    return { gsi1pk: `SLUG#${slug}`, gsi1sk: teacherSk };
}
