import { createBrowserRouter } from "react-router"

import { LocaleLayout, LocaleRedirect } from "@/app/locale-layout"
import { GuestOnly, RequireAuth } from "@/features/auth/guards"
import { LoginPage } from "@/features/auth/login-page"
import { RegisterPage } from "@/features/auth/register-page"
import { AdminPage, HomePage, NotFoundPage } from "@/features/auth/workspace"
import { Demo } from "@/pages/Demo"

export const router = createBrowserRouter([
  { path: "/", element: <LocaleRedirect /> },
  { path: "/demo", element: <Demo /> },
  {
    path: "/:lang",
    element: <LocaleLayout />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "admin", element: <AdminPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <LocaleRedirect /> },
])
