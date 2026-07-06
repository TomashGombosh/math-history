import zlib from 'node:zlib';
import { Readable } from 'node:stream';
import { buffer as streamToBuffer } from 'node:stream/consumers';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@lib/s3-client';

/**
 * Memory-bounded .docx text extraction.
 *
 * A .docx is a ZIP whose size is usually dominated by embedded media
 * (`word/media/*`). The text we need lives only in `word/document.xml`.
 * Instead of loading the whole archive into the heap (mammoth + jszip), we
 * read just the ZIP central directory and inflate the single `document.xml`
 * entry. Backed by S3 range requests, only that entry's bytes ever leave S3,
 * so peak heap and bandwidth are proportional to the text, not the file size.
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const ZIP64_SENTINEL = 0xffffffff;
const DOCUMENT_XML_ENTRY = 'word/document.xml';

/** Random-access byte source over a ZIP archive. */
export interface ByteSource {
	size(): Promise<number>;
	read(start: number, length: number): Promise<Buffer>;
}

interface CentralDirectoryEntry {
	method: number;
	compressedSize: number;
	localHeaderOffset: number;
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
	if (!body) return Buffer.alloc(0);
	const anyBody = body as { transformToByteArray?: () => Promise<Uint8Array> };
	if (typeof anyBody.transformToByteArray === 'function') {
		return Buffer.from(await anyBody.transformToByteArray());
	}
	if (body instanceof Readable) {
		return streamToBuffer(body);
	}
	return Buffer.alloc(0);
}

/** ByteSource over an in-memory buffer (tests / local). */
export class BufferByteSource implements ByteSource {
	constructor(private readonly buf: Buffer) {}

	async size(): Promise<number> {
		return this.buf.length;
	}

	async read(start: number, length: number): Promise<Buffer> {
		return this.buf.subarray(start, start + length);
	}
}

/** ByteSource backed by S3 range requests — only requested bytes are fetched. */
export class S3ByteSource implements ByteSource {
	constructor(
		private readonly bucket: string,
		private readonly key: string,
	) {}

	async size(): Promise<number> {
		const out = await getS3Client().send(
			new HeadObjectCommand({ Bucket: this.bucket, Key: this.key }),
		);
		return out.ContentLength ?? 0;
	}

	async read(start: number, length: number): Promise<Buffer> {
		if (length <= 0) return Buffer.alloc(0);
		const end = start + length - 1;
		const out = await getS3Client().send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: this.key,
				Range: `bytes=${start}-${end}`,
			}),
		);
		return bodyToBuffer(out.Body);
	}
}

async function locateCentralDirectory(source: ByteSource): Promise<{ offset: number; size: number }> {
	const total = await source.size();
	if (total < 22) {
		throw new Error('INVALID_DOCX_TOO_SMALL');
	}
	// EOCD is at the end: 22 fixed bytes + up to 65535 bytes of comment.
	const tailLength = Math.min(total, 22 + 0xffff);
	const tail = await source.read(total - tailLength, tailLength);

	for (let i = tail.length - 22; i >= 0; i -= 1) {
		if (tail.readUInt32LE(i) !== EOCD_SIGNATURE) continue;
		const size = tail.readUInt32LE(i + 12);
		const offset = tail.readUInt32LE(i + 16);
		if (size === ZIP64_SENTINEL || offset === ZIP64_SENTINEL) {
			throw new Error('ZIP64_UNSUPPORTED');
		}
		return { offset, size };
	}
	throw new Error('EOCD_NOT_FOUND');
}

function findEntry(centralDir: Buffer, name: string): CentralDirectoryEntry | null {
	let p = 0;
	while (p + 46 <= centralDir.length) {
		if (centralDir.readUInt32LE(p) !== CENTRAL_DIR_SIGNATURE) break;
		const method = centralDir.readUInt16LE(p + 10);
		const compressedSize = centralDir.readUInt32LE(p + 20);
		const nameLength = centralDir.readUInt16LE(p + 28);
		const extraLength = centralDir.readUInt16LE(p + 30);
		const commentLength = centralDir.readUInt16LE(p + 32);
		const localHeaderOffset = centralDir.readUInt32LE(p + 42);
		const entryName = centralDir.toString('utf8', p + 46, p + 46 + nameLength);
		if (entryName === name) {
			if (compressedSize === ZIP64_SENTINEL || localHeaderOffset === ZIP64_SENTINEL) {
				throw new Error('ZIP64_UNSUPPORTED');
			}
			return { method, compressedSize, localHeaderOffset };
		}
		p += 46 + nameLength + extraLength + commentLength;
	}
	return null;
}

async function inflateEntry(source: ByteSource, entry: CentralDirectoryEntry): Promise<Buffer> {
	const header = await source.read(entry.localHeaderOffset, 30);
	if (header.readUInt32LE(0) !== LOCAL_HEADER_SIGNATURE) {
		throw new Error('BAD_LOCAL_HEADER');
	}
	// Local extra field length can differ from the central directory's.
	const localNameLength = header.readUInt16LE(26);
	const localExtraLength = header.readUInt16LE(28);
	const dataStart = entry.localHeaderOffset + 30 + localNameLength + localExtraLength;
	const compressed = await source.read(dataStart, entry.compressedSize);

	if (entry.method === 0) return compressed;
	if (entry.method === 8) return zlib.inflateRawSync(compressed);
	throw new Error(`UNSUPPORTED_COMPRESSION_${entry.method}`);
}

async function readDocumentXml(source: ByteSource): Promise<string> {
	const cd = await locateCentralDirectory(source);
	const centralDir = await source.read(cd.offset, cd.size);
	const entry = findEntry(centralDir, DOCUMENT_XML_ENTRY);
	if (!entry) {
		throw new Error('DOCUMENT_XML_NOT_FOUND');
	}
	const xml = await inflateEntry(source, entry);
	return xml.toString('utf8');
}

function unescapeXml(value: string): string {
	if (value.indexOf('&') === -1) return value;
	return value
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
		.replace(/&amp;/g, '&');
}

function tagName(tag: string): string {
	let end = 0;
	while (end < tag.length) {
		const ch = tag[end];
		if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '/' || ch === '>') break;
		end += 1;
	}
	return tag.slice(0, end);
}

/**
 * Convert WordprocessingML `document.xml` to plain text:
 * text inside `<w:t>` runs, paragraph (`<w:p>`) breaks as blank lines,
 * `<w:tab>`/`<w:br>`/`<w:cr>` as separators. No DOM is built.
 */
export function documentXmlToText(xml: string): string {
	const out: string[] = [];
	let capture = false;
	let i = 0;
	const n = xml.length;

	while (i < n) {
		const lt = xml.indexOf('<', i);
		if (lt === -1) break;
		if (capture && lt > i) {
			out.push(unescapeXml(xml.slice(i, lt)));
		}
		const gt = xml.indexOf('>', lt + 1);
		if (gt === -1) break;
		const tag = xml.slice(lt + 1, gt);
		i = gt + 1;

		if (tag[0] === '/') {
			const name = tagName(tag.slice(1));
			if (name === 'w:t') capture = false;
			else if (name === 'w:p') out.push('\n\n');
			continue;
		}
		if (tag[0] === '?' || tag[0] === '!') continue;

		const name = tagName(tag);
		const selfClosing = tag[tag.length - 1] === '/';
		if (name === 'w:t') {
			if (!selfClosing) capture = true;
		} else if (name === 'w:tab') {
			out.push('\t');
		} else if (name === 'w:br' || name === 'w:cr') {
			out.push('\n');
		} else if (name === 'w:p' && selfClosing) {
			out.push('\n\n');
		}
	}

	return out.join('').trim();
}

/** Extract plain text from a docx held entirely in a buffer. */
export async function extractDocxText(buffer: Buffer): Promise<string> {
	const xml = await readDocumentXml(new BufferByteSource(buffer));
	return documentXmlToText(xml);
}

/** Extract plain text from a docx in S3 using range requests (bounded heap). */
export async function extractDocxTextFromS3(bucket: string, key: string): Promise<string> {
	const xml = await readDocumentXml(new S3ByteSource(bucket, key));
	return documentXmlToText(xml);
}
