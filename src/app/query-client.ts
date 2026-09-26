import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { meQueryKey } from "@/api/cache"
import { ApiError, errorMessage } from "@/api/mutator"

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** false when the screen shows the error itself (forms with inline errors). */
      errorToast?: boolean
    }
  }
}

const isUnauthorized = (error: unknown) =>
  error instanceof ApiError && error.status === 401

// Network failures and server errors are worth a retry; 4xx answers will not change.
const isRetryable = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.status >= 500)

export function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // An expired session anywhere signs the user out; RequireAuth then sends them to /login.
        if (isUnauthorized(error)) queryClient.setQueryData(meQueryKey, null)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (
          isUnauthorized(error) &&
          mutation.options.meta?.errorToast !== false
        ) {
          queryClient.setQueryData(meQueryKey, null)
          return
        }
        if (mutation.options.meta?.errorToast === false) return
        toast.error(errorMessage(error))
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      },
      mutations: { retry: false },
    },
  })
  return queryClient
}
