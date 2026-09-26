import type { QueryClient } from "@tanstack/react-query"

import { getGetMeQueryKey } from "@/api/generated/auth/auth"

/** Generated query keys start with the request path, e.g. ["/api/v1/leads", params]. */
export function invalidateApi(queryClient: QueryClient, ...pathPrefixes: string[]) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const [path] = query.queryKey
      return typeof path === "string" && pathPrefixes.some((prefix) => path.startsWith(prefix))
    },
  })
}

/** Cached as `UserOut | null`: null means signed out. */
export const meQueryKey = getGetMeQueryKey()

export const apiPaths = {
  leads: "/api/v1/leads",
  companies: "/api/v1/companies",
  runs: "/api/v1/runs",
  activity: "/api/v1/activity",
  quality: "/api/v1/quality",
  services: "/api/v1/services",
  questions: "/api/v1/questions",
  rules: "/api/v1/rules",
  users: "/api/v1/auth/users",
} as const
