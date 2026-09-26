/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" serves every /api request from the in-browser mock backend (src/testing). */
  readonly VITE_MOCK?: string
  /** Organisation name shown under the logo; the API has no org name. */
  readonly VITE_ORG_NAME?: string
}
