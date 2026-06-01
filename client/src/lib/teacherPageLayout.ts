import type { LayoutConfigResponse } from "./apiTypes";

const SECTION_DEFS: Array<{ id: string; title: string }> = [
  { id: "shortInformation", title: "Коротка інформація" },
  { id: "bio", title: "Біографія" },
  { id: "publications", title: "Публікації" },
];

export function normalizeTeacherPageLayout(raw: unknown): LayoutConfigResponse {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  let sections: LayoutConfigResponse["sections"];

  if (Array.isArray(r.sections)) {
    sections = r.sections
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object" && typeof (s as { id?: unknown }).id === "string")
      .map((s, idx) => {
        const id = String(s.id);
        const def = SECTION_DEFS.find((d) => d.id === id);
        return {
          id,
          title: typeof s.title === "string" && s.title ? s.title : def?.title ?? id,
          visible: s.visible !== undefined ? Boolean(s.visible) : true,
          order: typeof s.order === "number" && !Number.isNaN(s.order) ? s.order : idx + 1,
        };
      });
  } else {
    sections = SECTION_DEFS.map((def, idx) => ({
      id: def.id,
      title: def.title,
      visible: true,
      order: idx + 1,
    }));
  }

  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return { headerFields: [], sections };
}

export type TeacherPageState = {
  name: string;
  imageUrl?: string | null;
  title?: string | null;
  academicDegree?: string | null;
  position?: string | null;
  faculty?: string | null;
  shortInformation?: string | null;
  bio?: string | null;
  publications: unknown[];
};

export function teacherHasSectionContent(teacher: TeacherPageState, id: string): boolean {
  if (id === "shortInformation") return Boolean(teacher.shortInformation?.trim());
  if (id === "bio") return Boolean(teacher.bio?.trim());
  if (id === "publications") return Array.isArray(teacher.publications) && teacher.publications.length > 0;
  return false;
}

export type ParsedPublication = { key: string | number; year?: string | number; text: string };

export function parsePublicationEntry(raw: unknown, idx: number): ParsedPublication | null {
  if (typeof raw === "string" && raw.trim()) {
    return { key: idx, text: raw.trim() };
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === "string" ? o.text.trim() : "";
  if (!text) return null;
  const year = o.year;
  const key = typeof o.index === "number" ? o.index : idx;
  return {
    key,
    text,
    ...(year !== undefined && year !== null && year !== ""
      ? { year: year as string | number }
      : {}),
  };
}
