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
const AdminPlaceholderPage = lazy(
  () => import("../views/admin/AdminPlaceholderPage")
);

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
            element: <AdminPlaceholderPage title="Список викладачів" />,
          },
          {
            path: rrAdminChild(ROUTES.adminTeachersCreate),
            element: <AdminPlaceholderPage title="Додати викладача" />,
          },
          {
            path: rrAdminChild(ROUTES.adminTeachersLayout),
            element: (
              <AdminPlaceholderPage title="Структура сторінки викладача" />
            ),
          },
          {
            path: ROUTE_PATTERNS.adminTeacherEdit,
            element: <AdminPlaceholderPage title="Редагування викладача" />,
          },
          {
            path: rrAdminChild(ROUTES.adminGraduates),
            element: <AdminPlaceholderPage title="Список випусків" />,
          },
          {
            path: rrAdminChild(ROUTES.adminGraduatesCreate),
            element: <AdminPlaceholderPage title="Додати випуск" />,
          },
          {
            path: ROUTE_PATTERNS.adminGraduateYearEdit,
            element: <AdminPlaceholderPage title="Редагування випуску" />,
          },
        ],
      },
      { path: "*", element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
];
