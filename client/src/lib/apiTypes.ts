/** Shapes aligned with server (see http://localhost:3000/openapi when API is running). */

export type TeachersListResponse = {
  teachers: TeacherDto[];
  total: number;
  totalPages: number;
  currentPage: number;
};

/** Dynamo cursor mode (`cursor=1` on GET /api/teachers). */
export type TeachersCursorResponse = {
  teachers: TeacherDto[];
  lastEvaluatedKey?: string | null;
};

export type GraduateCohortRow = {
  id: number;
  year: number;
  number?: number | null;
  title?: string | null;
  students: unknown[];
  images: unknown[];
  totalStudents: number;
  totalWithHonours: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** Cursor mode for GET /api/graduates. */
export type GraduatesCursorResponse = {
  graduates: GraduateCohortRow[];
  lastEvaluatedKey?: string | null;
};

export type TeacherDto = {
  id: number;
  name: string;
  title?: string | null;
  academicDegree?: string | null;
  position?: string | null;
  faculty?: string | null;
  shortInformation?: string | null;
  bio?: string | null;
  publications: unknown[];
  imageUrl?: string | null;
  slug: string;
};

export type TeacherFiltersResponse = {
  positions: string[];
  degrees: string[];
};

export type GraduateYearSummary = {
  year: number;
  totalStudents: number;
  totalWithHonours: number;
  cohortsCount: number;
};

export type GraduateCohortImage = {
  id?: number;
  url?: string;
  caption?: string | null;
  specialty?: string | null;
};

export type GraduateYearDetail = {
  year: number;
  title: string;
  images: GraduateCohortImage[];
  students: Array<{
    id: number;
    index: number;
    name: string;
    specialty?: string;
    section?: string;
    honorsDegree?: boolean;
  }>;
  /** Present when using `cursor=1` on GET /api/graduates/:year */
  studentTotal?: number;
  studentLastEvaluatedKey?: string | null;
};

export type LayoutConfigResponse = {
  headerFields: Array<{ id: string; label: string; visible: boolean; order: number }>;
  sections: Array<{ id: string; title: string; visible: boolean; order: number }>;
};

/** Staged entity kind in a bulk `.docx` import job. */
export type BulkImportEntity = "teacher" | "graduate" | "year";

/** One candidate row returned when a bulk import job reaches `success`. */
export type BulkImportItem = {
  id: string;
  entity: BulkImportEntity;
  name?: string;
  year?: number;
};

/** Aggregate counts for staged candidates (also shown while `in_progress`). */
export type BulkImportCounts = {
  teachers: number;
  graduates: number;
  years: number;
};

/** External lifecycle status for GET /api/admin/bulk-imports/{id}. */
export type BulkImportStatus = "in_progress" | "success" | "failed" | "cancelled";

/** POST /api/admin/bulk-imports — job id + presigned upload for the source `.docx`. */
export type BulkImportCreateResponse = {
  jobId: string;
  uploadUrl: string;
  headers: Record<string, string>;
};

/** GET /api/admin/bulk-imports/{id} — poll until terminal status. */
export type BulkImportStatusResponse = {
  status: BulkImportStatus;
  counts: BulkImportCounts;
  candidates: BulkImportItem[];
  /** Optional pagination cursor if API supports it later */
  lastEvaluatedKey?: string | null;
  error?: string;
};
