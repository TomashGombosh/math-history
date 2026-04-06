/** Single source of truth for app paths (use with `<Link>`, `navigate`, `pathname` checks). */
export const ROUTES = {
  home: "/",
  teachers: "/teachers",
  graduates: "/graduates",
  teacherSlug: (slug: string) => `/teacher/${encodeURIComponent(slug)}`,
  graduatesYear: (year: string | number) => `/graduates/${encodeURIComponent(String(year))}`,
  login: "/login",
  admin: "/admin",
  adminTeachers: "/admin/teachers",
  adminTeachersCreate: "/admin/teachers/create",
  adminTeachersLayout: "/admin/teachers/layout",
  adminTeacherEdit: (id: string | number) =>
    `/admin/teachers/${encodeURIComponent(String(id))}/edit`,
  adminGraduates: "/admin/graduates",
  adminGraduatesCreate: "/admin/graduates/create",
  adminGraduateYearEdit: (year: string | number) =>
    `/admin/graduates/${encodeURIComponent(String(year))}/edit`,
} as const;

/** Parametrized segments for `RouteObject` (relative to layout parent). */
export const ROUTE_PATTERNS = {
  teacherDetail: "teacher/:slug",
  graduatesYear: "graduates/:year",
  adminTeacherEdit: "teachers/:id/edit",
  adminGraduateYearEdit: "graduates/:year/edit",
} as const;

/** React Router nested `path` under `/` (no leading slash). */
export function rrPath(absolute: string): string {
  return absolute.startsWith("/") ? absolute.slice(1) : absolute;
}

/** Child path under `/admin` (no `admin/` prefix). */
export function rrAdminChild(fullPath: string): string {
  const prefix = `${ROUTES.admin}/`;
  if (!fullPath.startsWith(prefix)) {
    throw new Error(`Expected path under ${ROUTES.admin}: ${fullPath}`);
  }
  return fullPath.slice(prefix.length);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === ROUTES.admin || pathname.startsWith(`${ROUTES.admin}/`);
}
