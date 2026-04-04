/** Shapes aligned with server_v2 (see http://localhost:3000/openapi when API is running). */

export type TeachersListResponse = {
  teachers: TeacherDto[];
  total: number;
  totalPages: number;
  currentPage: number;
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
};

export type LayoutConfigResponse = {
  headerFields: Array<{ id: string; label: string; visible: boolean; order: number }>;
  sections: Array<{ id: string; title: string; visible: boolean; order: number }>;
};
