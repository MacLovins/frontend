import { ApiError } from "@/api/mutator"

/** A fresh service has no ICP or scoring profile yet: their GET answers 404 (config/router.py). */
export const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404
