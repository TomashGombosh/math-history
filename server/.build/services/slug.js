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
exports.slugify = slugify;
exports.createUniqueSlug = createUniqueSlug;
const teacher_slug_1 = require("./teacher-slug");
const map = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'h',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ye',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'yi',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ю: 'yu',
    я: 'ya',
    ъ: '',
    ь: '',
    ё: 'yo',
    э: 'e',
    ы: 'y',
};
function slugify(str) {
    if (!str)
        return '';
    const out = String(str)
        .toLowerCase()
        .split('')
        .map((ch) => {
        if (map[ch])
            return map[ch];
        if (/[a-z0-9]/.test(ch))
            return ch;
        return '-';
    })
        .join('')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return out;
}
function createUniqueSlug(name) {
    return __awaiter(this, void 0, void 0, function* () {
        let base = slugify(name);
        if (!base)
            base = 'teacher';
        let slug = base;
        let counter = 1;
        while (true) {
            const exists = yield (0, teacher_slug_1.teacherSlugExists)(slug);
            if (!exists)
                break;
            counter += 1;
            slug = `${base}-${counter}`;
        }
        return slug;
    });
}
