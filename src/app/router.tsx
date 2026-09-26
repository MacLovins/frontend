import { createBrowserRouter, Navigate } from "react-router"

import { AppShell } from "@/app/app-shell"
import { NotFoundPage } from "@/app/not-found-page"
import { ToProspects } from "@/app/redirects"
import { RequireAdmin, RequireAuth } from "@/features/auth/guards"

export const router = createBrowserRouter([
  { path: "/login", lazy: { Component: async () => (await import("@/features/auth/login-page")).LoginPage } },
  { path: "/about", lazy: { Component: async () => (await import("@/features/about/brief-page")).BriefPage } },
  {
    path: "/about/market",
    lazy: { Component: async () => (await import("@/features/about/market-page")).MarketPage },
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <ToProspects /> },
          { path: "today", lazy: { Component: async () => (await import("@/features/today/today-page")).TodayPage } },
          {
            path: "prospects",
            lazy: { Component: async () => (await import("@/features/prospects/prospects-page")).ProspectsPage },
          },
          {
            path: "companies/:companyId",
            lazy: { Component: async () => (await import("@/features/company/company-page")).CompanyPage },
          },
          {
            path: "companies/:companyId/sources",
            lazy: { Component: async () => (await import("@/features/company/sources-page")).SourcesPage },
          },
          {
            path: "companies/:companyId/outreach",
            lazy: { Component: async () => (await import("@/features/outreach/outreach-page")).OutreachPage },
          },
          { path: "runs", lazy: { Component: async () => (await import("@/features/runs/runs-page")).RunsPage } },
          { path: "runs/:runId", lazy: { Component: async () => (await import("@/features/runs/run-page")).RunPage } },
          {
            path: "accounts",
            lazy: { Component: async () => (await import("@/features/accounts/accounts-page")).AccountsPage },
          },
          {
            path: "accounts/discover",
            lazy: { Component: async () => (await import("@/features/discovery/discovery-page")).DiscoveryPage },
          },
          {
            path: "quality",
            lazy: { Component: async () => (await import("@/features/quality/quality-page")).QualityPage },
          },
          {
            path: "403",
            lazy: { Component: async () => (await import("@/features/auth/forbidden-page")).ForbiddenPage },
          },
          {
            path: "settings",
            element: <RequireAdmin />,
            children: [
              { index: true, element: <Navigate to="/settings/services" replace /> },
              {
                path: "services",
                lazy: {
                  Component: async () => (await import("@/features/settings/services/services-page")).ServicesPage,
                },
              },
              {
                path: "users",
                lazy: { Component: async () => (await import("@/features/settings/users/users-page")).UsersPage },
              },
              {
                path: ":serviceId/questions",
                lazy: {
                  Component: async () => (await import("@/features/settings/questions/questions-page")).QuestionsPage,
                },
              },
              {
                path: ":serviceId/icp",
                lazy: { Component: async () => (await import("@/features/settings/icp/icp-page")).IcpPage },
              },
              {
                path: ":serviceId/rules",
                lazy: { Component: async () => (await import("@/features/settings/rules/rules-page")).RulesPage },
              },
              {
                path: ":serviceId/scoring",
                lazy: {
                  Component: async () => (await import("@/features/settings/scoring/scoring-page")).ScoringPage,
                },
              },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
