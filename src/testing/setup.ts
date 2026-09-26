import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll } from "vitest"

import { resetDb } from "@/testing/mocks/db"
import { server } from "@/testing/server"

const nativeFetch = globalThis.fetch

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
  // The app calls same-origin paths ("/api/v1/…"); Node's fetch needs absolute URLs. Wrap after MSW has
  // patched fetch so the resolved URL reaches its interceptor.
  const mocked = globalThis.fetch
  globalThis.fetch = (input, init) =>
    mocked(
      typeof input === "string" && input.startsWith("/")
        ? new URL(input, window.location.origin)
        : input,
      init
    )
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
})

afterAll(() => {
  server.close()
  globalThis.fetch = nativeFetch
})
