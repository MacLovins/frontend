import { QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { createQueryClient } from "@/app/query-client"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider, useTheme } from "@/lib/theme"

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} />
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <ThemedToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
