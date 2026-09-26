import { defineConfig } from "orval"

function stripEventStreamItemSchema(spec: {
  paths?: Record<string, Record<string, { responses?: Record<string, { content?: Record<string, Record<string, unknown>> }> }>>
}) {
  for (const path of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(path)) {
      const stream = operation?.responses?.["200"]?.content?.["text/event-stream"]
      if (stream && "itemSchema" in stream) {
        delete stream.itemSchema
      }
    }
  }
  return spec
}

export default defineConfig({
  leadradar: {
    input: {
      target: "./openapi.json",
      override: {
        transformer: stripEventStreamItemSchema,
      },
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      mock: true,
      clean: true,
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "apiFetch",
        },
      },
    },
  },
})
