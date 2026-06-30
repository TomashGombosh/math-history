import {
	extractFromChunkText,
	extractWithBedrock,
	isBulkBedrockEnabled,
	normalizeName,
	parseChunkText,
} from '@services/bulk-extract-service';

describe('bulk-extract-service', () => {
	describe('normalizeName', () => {
		it('trims and collapses whitespace', () => {
			expect(normalizeName('  Іванов   Іван  ')).toBe('Іванов Іван');
		});
	});

	describe('parseChunkText', () => {
		it('extracts teachers from a teacher section', () => {
			const text = `
Викладачі
Іванов Іван
Петренко Марія Олександрівна
Smith John
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: ['Іванов Іван', 'Петренко Марія Олександрівна', 'Smith John'],
				graduates: [],
				years: [],
			});
		});

		it('extracts graduates and years from «випуск YYYY» headers and short names', () => {
			const text = `
1–ий випуск (1955р.) студентів математичного відділення фізико-математичного факультету УжДУ
Броді С.М.
Шулла І.Й.
Ходос Д.С.
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: [],
				graduates: [
					{ name: 'Броді С.М.', year: 1955 },
					{ name: 'Шулла І.Й.', year: 1955 },
					{ name: 'Ходос Д.С.', year: 1955 },
				],
				years: [1955],
			});
		});

		it('parses graduate lines with explicit year', () => {
			const text = `
Коваленко О.П. — 2005
Smith J.A., 1998
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: [],
				graduates: [
					{ name: 'Коваленко О.П.', year: 2005 },
					{ name: 'Smith J.A.', year: 1998 },
				],
				years: [1998, 2005],
			});
		});

		it('handles maiden name in parentheses', () => {
			const text = `
13-ий випуск (1967р.) студентів математичного факультету УжДУ.
Повхан (Карольї) М.Ф.
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: [],
				graduates: [{ name: 'Повхан (Карольї) М.Ф.', year: 1967 }],
				years: [1967],
			});
		});

		it('deduplicates teachers, graduates, and years within a chunk', () => {
			const text = `
Викладачі
Іванов Іван
іванов іван

2-ий випуск (1956р.) студентів факультету
Крицький О.О.
Крицький О.О.

Крицький О.О. — 1956
			`.trim();

			const result = parseChunkText(text);
			expect(result.teachers).toEqual(['Іванов Іван']);
			expect(result.graduates).toEqual([{ name: 'Крицький О.О.', year: 1956 }]);
			expect(result.years).toEqual([1956]);
		});

		it('ignores noise and invalid years', () => {
			const text = `
Це просто текст без сутностей.
Рік заснування: 1899
Page 42
1234567890
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: [],
				graduates: [],
				years: [],
			});
		});

		it('tracks year context across multiple graduate sections', () => {
			const text = `
3-ий випуск (1957р.) студентів математичного відділення
Кевер К.Л.

4-ий випуск (1958р.) студентів математичного відділення
Антосяк М.М.
			`.trim();

			expect(parseChunkText(text)).toEqual({
				teachers: [],
				graduates: [
					{ name: 'Кевер К.Л.', year: 1957 },
					{ name: 'Антосяк М.М.', year: 1958 },
				],
				years: [1957, 1958],
			});
		});

		it('returns empty result for blank input', () => {
			expect(parseChunkText('   \n\n  ')).toEqual({
				teachers: [],
				graduates: [],
				years: [],
			});
		});
	});

	describe('Bedrock routing', () => {
		const prev = process.env.BULK_BEDROCK_ENABLED;

		afterEach(() => {
			if (prev === undefined) {
				delete process.env.BULK_BEDROCK_ENABLED;
			} else {
				process.env.BULK_BEDROCK_ENABLED = prev;
			}
		});

		it('isBulkBedrockEnabled is false by default', () => {
			delete process.env.BULK_BEDROCK_ENABLED;
			expect(isBulkBedrockEnabled()).toBe(false);
		});

		it('extractWithBedrock throws BEDROCK_NOT_IMPLEMENTED', () => {
			expect(() => extractWithBedrock('text')).toThrow('BEDROCK_NOT_IMPLEMENTED');
		});

		it('extractFromChunkText uses deterministic parser when Bedrock is off', () => {
			delete process.env.BULK_BEDROCK_ENABLED;
			expect(extractFromChunkText('Викладачі\nІванов Іван')).toEqual({
				teachers: ['Іванов Іван'],
				graduates: [],
				years: [],
			});
		});

		it('extractFromChunkText throws when Bedrock is enabled', () => {
			process.env.BULK_BEDROCK_ENABLED = 'true';
			expect(() => extractFromChunkText('text')).toThrow('BEDROCK_NOT_IMPLEMENTED');
		});
	});
});
