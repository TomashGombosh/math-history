/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AppLayout } from "../shared/AppLayout";
import { RequireAdmin } from "../state/RequireAdmin";
import { ROUTE_PATTERNS, ROUTES, rrAdminChild, rrPath } from "./paths";

const HomePage = lazy(() => import("../views/HomePage"));
const TeachersPage = lazy(() => import("../views/TeachersPage"));
const TeacherPage = lazy(() => import("../views/TeacherPage"));
const GraduatesPage = lazy(() => import("../views/GraduatesPage"));
const GraduatesYearPage = lazy(() => import("../views/GraduatesYearPage"));
const LoginPage = lazy(() => import("../views/LoginPage"));
const AdminHomePage = lazy(() => import("../views/admin/AdminHomePage"));
const AdminTeachersListPage = lazy(() => import("../views/admin/AdminTeachersListPage"));
const AdminTeacherCreatePage = lazy(() => import("../views/admin/AdminTeacherCreatePage"));
const AdminTeacherEditPage = lazy(() => import("../views/admin/AdminTeacherEditPage"));
const AdminLayoutSettingsPage = lazy(() => import("../views/admin/AdminLayoutSettingsPage"));
const AdminGraduatesListPage = lazy(() => import("../views/admin/AdminGraduatesListPage"));
const AdminGraduateCreatePage = lazy(() => import("../views/admin/AdminGraduateCreatePage"));
const AdminGraduateYearEditPage = lazy(() => import("../views/admin/AdminGraduateYearEditPage"));

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: rrPath(ROUTES.teachers), element: <TeachersPage /> },
      { path: ROUTE_PATTERNS.teacherDetail, element: <TeacherPage /> },
      { path: rrPath(ROUTES.graduates), element: <GraduatesPage /> },
      { path: ROUTE_PATTERNS.graduatesYear, element: <GraduatesYearPage /> },
      { path: rrPath(ROUTES.login), element: <LoginPage /> },
      {
        path: rrPath(ROUTES.admin),
        element: <RequireAdmin />,
        children: [
          { index: true, element: <AdminHomePage /> },
          {
            path: rrAdminChild(ROUTES.adminTeachers),
            element: <AdminTeachersListPage />,
          },
          {
            path: rrAdminChild(ROUTES.adminTeachersCreate),
            element: <AdminTeacherCreatePage />,
          },
          {
            path: rrAdminChild(ROUTES.adminTeachersLayout),
            element: <AdminLayoutSettingsPage />,
          },
          {
            path: ROUTE_PATTERNS.adminTeacherEdit,
            element: <AdminTeacherEditPage />,
          },
          {
            path: rrAdminChild(ROUTES.adminGraduates),
            element: <AdminGraduatesListPage />,
          },
          {
            path: rrAdminChild(ROUTES.adminGraduatesCreate),
            element: <AdminGraduateCreatePage />,
          },
          {
            path: ROUTE_PATTERNS.adminGraduateYearEdit,
            element: <AdminGraduateYearEditPage />,
          },
        ],
      },
      { path: "*", element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
];
