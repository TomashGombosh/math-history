import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AppLayout } from "../shared/AppLayout";
import { RequireAdmin } from "../state/RequireAdmin";

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
      { path: "teachers", element: <TeachersPage /> },
      { path: "teacher/:slug", element: <TeacherPage /> },
      { path: "graduates", element: <GraduatesPage /> },
      { path: "graduates/:year", element: <GraduatesYearPage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "admin",
        element: <RequireAdmin />,
        children: [
          { index: true, element: <AdminHomePage /> },
          {
            path: "teachers",
            element: <AdminPlaceholderPage title="Список викладачів" />,
          },
          {
            path: "teachers/create",
            element: <AdminPlaceholderPage title="Додати викладача" />,
          },
          {
            path: "teachers/layout",
            element: (
              <AdminPlaceholderPage title="Структура сторінки викладача" />
            ),
          },
          {
            path: "teachers/:id/edit",
            element: <AdminPlaceholderPage title="Редагування викладача" />,
          },
          {
            path: "graduates",
            element: <AdminPlaceholderPage title="Список випусків" />,
          },
          {
            path: "graduates/create",
            element: <AdminPlaceholderPage title="Додати випуск" />,
          },
          {
            path: "graduates/:year/edit",
            element: <AdminPlaceholderPage title="Редагування випуску" />,
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];
