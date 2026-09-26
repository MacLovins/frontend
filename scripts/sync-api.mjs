// Copies the backend's OpenAPI snapshot next to this repo. The snapshot is produced by `lr export-openapi`
// in MacLovins/backend; never edit openapi.json by hand (narrowing lives in scripts/openapi-contract.ts).
import { copyFileSync, existsSync } from "node:fs"
import path from "node:path"

const backendDir = process.argv[2] ?? process.env.BACKEND_DIR ?? "../backend"
const source = path.join(backendDir, "openapi.json")

if (!existsSync(source)) {
  console.error(`No ${source}. Clone MacLovins/backend next to this repo or pass its path: npm run sync:api -- <dir>`)
  process.exit(1)
}

copyFileSync(source, "openapi.json")
console.log(`Copied ${source} to openapi.json. Run npm run gen:api to regenerate the client.`)
