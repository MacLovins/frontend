import { copyFileSync, existsSync } from "node:fs"

const candidates = ["../backend/openapi.json", "../backend/backend/openapi.json"]
const source = candidates.find((path) => existsSync(path))

if (!source) {
  console.error(`No OpenAPI file next to this repo. Looked for ${candidates.join(", ")}.`)
  process.exit(1)
}

copyFileSync(source, "openapi.json")
console.log(`Copied ${source} to openapi.json`)
