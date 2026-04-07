/** Shared with teacher admin preview and layout settings (matches legacy Vue). */
export const HEADER_FIELD_DEFS = [
  { id: "title", label: "Title" },
  { id: "academicDegree", label: "Науковий ступінь" },
  { id: "position", label: "Посада" },
  { id: "faculty", label: "Факультет" },
] as const;

export const SECTION_DEFS = [
  { id: "shortInformation", title: "Коротка інформація" },
  { id: "bio", title: "Біографія" },
  { id: "publications", title: "Публікації" },
] as const;

export type HeaderFieldId = (typeof HEADER_FIELD_DEFS)[number]["id"];
export type SectionId = (typeof SECTION_DEFS)[number]["id"];

export interface LayoutHeaderField {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface LayoutSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface LayoutConfig {
  headerFields: LayoutHeaderField[];
  sections: LayoutSection[];
}

export function normalizeLayout(raw: unknown): LayoutConfig {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  let headerFields: LayoutHeaderField[];
  if (Array.isArray(obj.headerFields)) {
    headerFields = obj.headerFields
      .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === "object"))
      .map((h, idx) => ({
        id: String(h.id ?? ""),
        label:
          String(h.label ?? "") ||
          HEADER_FIELD_DEFS.find((d) => d.id === h.id)?.label ||
          String(h.id ?? ""),
        visible: h.visible !== undefined ? Boolean(h.visible) : true,
        order:
          typeof h.order === "number" && !Number.isNaN(h.order) ? h.order : idx + 1,
      }))
      .filter((h) => h.id);
  } else if (obj.headerFields && typeof obj.headerFields === "object" && !Array.isArray(obj.headerFields)) {
    const map = obj.headerFields as Record<string, unknown>;
    headerFields = HEADER_FIELD_DEFS.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible: map[def.id] !== undefined ? Boolean(map[def.id]) : true,
      order: idx + 1,
    }));
  } else {
    headerFields = HEADER_FIELD_DEFS.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible: true,
      order: idx + 1,
    }));
  }

  let sections: LayoutSection[];
  if (Array.isArray(obj.sections)) {
    sections = obj.sections
      .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
      .map((s, idx) => ({
        id: String(s.id ?? ""),
        title:
          String(s.title ?? "") ||
          SECTION_DEFS.find((d) => d.id === s.id)?.title ||
          String(s.id ?? ""),
        visible: s.visible !== undefined ? Boolean(s.visible) : true,
        order:
          typeof s.order === "number" && !Number.isNaN(s.order) ? s.order : idx + 1,
      }))
      .filter((s) => s.id);
  } else {
    sections = SECTION_DEFS.map((def, idx) => ({
      id: def.id,
      title: def.title,
      visible: true,
      order: idx + 1,
    }));
  }

  headerFields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return { headerFields, sections };
}

export const DEFAULT_POSITIONS = [
  "Асистент",
  "Викладач",
  "Старший викладач",
  "Доцент кафедри",
  "Доцент",
  "Професор кафедри",
  "Професор",
] as const;

export const DEFAULT_DEGREE_OPTIONS = [
  "д. екон. н.",
  "д. техн. н.",
  "д. ф.-м. н.",
  "к. екон. н.",
  "к. пед. н.",
  "к. техн. н.",
  "к. ф.-м. н.",
] as const;

export function mergeUnique(base: readonly string[], extra: readonly string[] | undefined): string[] {
  const set = new Set(base);
  for (const v of extra ?? []) {
    const val = String(v ?? "").trim();
    if (val) set.add(val);
  }
  return Array.from(set);
}
