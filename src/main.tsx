import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import { Providers } from "@/app/providers"
import { router } from "@/app/router"
import "./index.css"

// `npm run dev:mock` serves the API from an in-browser mock; the import keeps it out of production bundles.
async function startMocks() {
  if (import.meta.env.VITE_MOCK !== "true") return
  const { startMockWorker } = await import("@/testing/browser")
  await startMockWorker()
}

void startMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
})
