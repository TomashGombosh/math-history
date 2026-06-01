#!/usr/bin/env node
/**
 * Walks `src/modules`, compares each folder to `test.ts` files and the default `TESTS` list in `src/tests/app.ts`,
 * writes `test/test-tree.yml`. Run from repo root: `node server_v2/scripts/generate-test-tree.cjs` or `cd server_v2 && node scripts/generate-test-tree.cjs`.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const modulesDir = path.join(root, 'src', 'modules');
const appPath = path.join(root, 'src', 'tests', 'app.ts');

function extractDefaultTestsFromAppTs() {
	const data = fs.readFileSync(appPath, 'utf8');
	const block =
		data.match(/\|\|\s*\(\[([\s\S]*?)\]\s*as\s+const\)/)?.[1] ?? data.match(/\|\|\s*\[([\s\S]*?)\]\s*;/)?.[1];
	if (!block) return [];
	return block
		.split('\n')
		.map((l) => l.trim().replace(/,$/, ''))
		.filter((l) => l && !l.startsWith('//'))
		.map((l) => l.replace(/^['"]|['"]$/g, ''))
		.filter(Boolean);
}

let existingTests = extractDefaultTestsFromAppTs();
let tests = {};

function walk(dir) {
	const key = path.relative(modulesDir, dir).split(path.sep).join('/') || '.';

	tests[key] = {
		is_readme: false,
		is_files: false,
		is_test: false,
		is_covered: false,
	};

	fs.readdirSync(dir).forEach((file) => {
		const filePath = path.join(dir, file);

		if (fs.statSync(filePath).isFile()) {
			tests[key].is_files = true;

			if (file === 'README.md') {
				tests[key].is_readme = true;
			}

			if (file === 'test.js' || file === 'test.ts') {
				tests[key].is_test = true;
			}

			if (existingTests.some((test) => key.includes(test) || test.includes(key))) {
				tests[key].is_covered = true;
			}
		} else if (fs.statSync(filePath).isDirectory()) {
			walk(filePath);
		}
	});
}

function restructureHelper(obj, parts, val) {
	if (!obj[parts[0]]) obj[parts[0]] = {};
	if (parts.length === 1) {
		obj[parts[0]] = { ...obj[parts[0]], ...val };
	} else {
		obj[parts[0]] = restructureHelper(obj[parts[0]] || {}, parts.slice(1), val);
	}
	return obj;
}

function restructure(obj) {
	const next = { ...obj };
	for (const key of Object.keys(next)) {
		const v = next[key];
		if (!v.is_files || (v.is_readme && v.is_files && v.is_test && v.is_covered)) {
			delete v.is_readme;
			delete v.is_files;
			delete v.is_test;
			delete v.is_covered;
		}

		if (key.includes('/')) {
			const parts = key.split('/');
			restructureHelper(next, parts, v);
			delete next[key];
		}
	}
	return next;
}

walk(modulesDir);
const result = yaml.dump(restructure(tests));
const outDir = path.join(root, 'test');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'test-tree.yml');
fs.writeFileSync(outFile, result);
console.log(result);
console.error('Wrote', outFile);
