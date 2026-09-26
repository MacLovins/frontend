import { defineConfig } from "orval"

import { applyContract } from "./scripts/openapi-contract"

// FastAPI operation ids look like `list_leads_api_v1_leads_get`; keep the verb and noun only.
function operationName(operationId: string | undefined, route: string, verb: string) {
  return (operationId ?? `${verb}_${route}`)
    .replace(/_api_v1_.*$/, "")
    .replace(/[_-]+(\w)/g, (_, char: string) => char.toUpperCase())
}

export default defineConfig({
  leadradar: {
    input: {
      target: "./openapi.json",
      override: { transformer: applyContract },
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        operationName: (operation, route, verb) => operationName(operation.operationId, route, verb),
        mutator: { path: "./src/api/mutator.ts", name: "apiFetch" },
        fetch: { includeHttpResponseReturnType: false },
        query: { version: 5 },
      },
    },
  },
})
