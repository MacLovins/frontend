/** Mock backend for Vitest (msw/node). `src/testing/setup.ts` starts it and resets the db after each test. */
import { setupServer } from "msw/node"

import { handlers } from "./mocks/handlers"

export const server = setupServer(...handlers)
