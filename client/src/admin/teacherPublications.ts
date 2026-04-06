export interface PublicationInput {
  year: string | number | "";
  text: string;
}

export interface PublicationPreview {
  index: number;
  year: number | null;
  text: string;
}

export function toPreviewPublications(rows: PublicationInput[]): PublicationPreview[] {
  return rows
    .filter((p) => p.text && String(p.text).trim())
    .map((p, idx) => ({
      index: idx + 1,
      year: p.year === "" || p.year === undefined ? null : Number(p.year),
      text: String(p.text).trim(),
    }));
}

export function validatePublicationsHaveYear(rows: PublicationInput[]): boolean {
  for (const p of rows) {
    if (p.text && String(p.text).trim() && (p.year === "" || p.year === undefined || Number.isNaN(Number(p.year)))) {
      return false;
    }
  }
  return true;
}
