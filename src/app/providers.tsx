import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { Toaster } from "sonner"

import { SessionProvider } from "@/features/session/session"

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        {children}
        <Toaster richColors />
      </SessionProvider>
    </QueryClientProvider>
  )
}
