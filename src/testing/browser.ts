/** In-browser mock backend for `npm run dev:mock` (VITE_MOCK=true). */
import { setupWorker } from "msw/browser"

import { handlers } from "./mocks/handlers"

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
    quiet: true,
  })
}
