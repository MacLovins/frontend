import { Navigate, createBrowserRouter } from "react-router"

import { AppShell } from "@/app/app-shell"
import { AccountsPage, DiscoveryPage } from "@/features/accounts/accounts-pages"
import { CompanyPage } from "@/features/company/company-page"
import { ProspectsPage } from "@/features/prospects/prospects-page"
import { RunDetailPage, RunsPage } from "@/features/runs/runs-pages"
import { ForbiddenPage, LoginPage } from "@/features/session/login-page"
import { RequireAdmin, RequireAuth } from "@/features/session/session"
import {
  IcpPage,
  QuestionsPage,
  RulesPage,
  ScoringPage,
  ServicesPage,
} from "@/features/settings/settings-pages"
import { UsersPage } from "@/features/settings/users-page"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/prospects" replace /> },
          { path: "prospects", element: <ProspectsPage /> },
          { path: "companies/:id", element: <CompanyPage /> },
          { path: "runs", element: <RunsPage /> },
          { path: "runs/:id", element: <RunDetailPage /> },
          { path: "accounts", element: <AccountsPage /> },
          { path: "accounts/discover", element: <DiscoveryPage /> },
          { path: "403", element: <ForbiddenPage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: "settings/services", element: <ServicesPage /> },
              { path: "settings/users", element: <UsersPage /> },
              { path: "settings/:serviceId/questions", element: <QuestionsPage /> },
              { path: "settings/:serviceId/icp", element: <IcpPage /> },
              { path: "settings/:serviceId/rules", element: <RulesPage /> },
              { path: "settings/:serviceId/scoring", element: <ScoringPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
