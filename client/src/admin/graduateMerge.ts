/** Merge multiple graduate cohort rows for one year (server returns one item per cohort). */
export type GraduateCohortRow = {
  id: number;
  year: number;
  title?: string | null;
  students: unknown[];
  images: unknown[];
};

export function mergeCohortsForYear(rows: GraduateCohortRow[]): GraduateCohortRow | null {
  if (!rows.length) return null;
  const allImages: unknown[] = [];
  const allStudents: unknown[] = [];
  for (const r of rows) {
    if (Array.isArray(r.images)) allImages.push(...r.images);
    if (Array.isArray(r.students)) allStudents.push(...r.students);
  }
  const first = rows[0];
  return {
    ...first,
    title: first.title ?? null,
    students: allStudents,
    images: allImages,
  };
}
