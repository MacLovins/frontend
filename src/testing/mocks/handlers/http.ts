/**
 * Route wrapper and request helpers shared by all handlers: response latency, the session check
 * (401 `unauthorized` → 403 `forbidden` → 422, in the backend's order), the error envelope
 * `{"error": {"code", "message", "details"}}` and pydantic-style validation errors.
 */
import { http, HttpResponse, type JsonBodyType } from "msw"

import type { ErrorResponse } from "@/api/generated/model"

import { isUuid } from "../data/ids"
import { currentUser } from "../db"
import { responseDelay } from "../settings"
import type { UserRecord } from "../types"

/** Matches any origin, so relative ("/api/v1/…") and absolute test URLs both hit the mock. */
export const API = "*/api/v1"

export interface ValidationItem {
  loc: (string | number)[]
  msg: string
  type: string
}

export class ApiFailure extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>
  readonly headers: Record<string, string>

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {},
    headers: Record<string, string> = {}
  ) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.headers = headers
  }
}

export const fail = {
  unauthorized: (message = "Authentication required") =>
    new ApiFailure(
      401,
      "unauthorized",
      message,
      {},
      { "WWW-Authenticate": "Bearer" }
    ),
  forbidden: (role: string) =>
    new ApiFailure(
      403,
      "forbidden",
      `Operation not permitted for role '${role}'`
    ),
  notFound: (message: string) => new ApiFailure(404, "not_found", message),
  conflict: (message: string, details: Record<string, unknown> = {}) =>
    new ApiFailure(409, "conflict", message, details),
  badRequest: (message: string) => new ApiFailure(400, "bad_request", message),
  validation: (errors: ValidationItem[]) =>
    new ApiFailure(422, "validation_error", "Request validation failed", {
      errors,
    }),
  /** A 422 raised with a plain-text detail (code by status, message = text). */
  unprocessable: (message: string, details: Record<string, unknown> = {}) =>
    new ApiFailure(422, "validation_error", message, details),
  /** A domain 422 with its own code (e.g. `discovery_query_incomplete`, `missing_columns`). */
  domain: (
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) => new ApiFailure(status, code, message, details),
  /** Unhandled backend exception (e.g. an IntegrityError the backend does not map). */
  internal: () =>
    new ApiFailure(500, "internal_error", "Internal server error"),
}

export function errorResponse(failure: ApiFailure): Response {
  const body: ErrorResponse = {
    error: {
      code: failure.code,
      message: failure.message,
      details: failure.details,
    },
  }
  return HttpResponse.json(body, {
    status: failure.status,
    headers: failure.headers,
  })
}

export function json<T>(
  body: T,
  status = 200,
  headers?: Record<string, string>
): Response {
  return HttpResponse.json(body as JsonBodyType, { status, headers })
}

export function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}

// --- routing -----------------------------------------------------------------------------------------

export interface Ctx {
  request: Request
  url: URL
  params: Record<string, string>
}

export interface AuthedCtx extends Ctx {
  user: UserRecord
}

type Method = "get" | "post" | "put" | "patch" | "delete"

function wrap<C extends Ctx>(
  resolve: (ctx: Ctx) => C,
  handler: (ctx: C) => Response | Promise<Response>
) {
  return async ({
    request,
    params,
  }: {
    request: Request
    params: Record<string, string | readonly string[] | undefined>
  }) => {
    await responseDelay()
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(params))
      if (typeof v === "string") flat[k] = v
    try {
      return await handler(
        resolve({ request, url: new URL(request.url), params: flat })
      )
    } catch (error) {
      if (error instanceof ApiFailure) return errorResponse(error)
      console.error("[mock api] unhandled error", error)
      return errorResponse(fail.internal())
    }
  }
}

/** A route open to anyone (login, logout, token, health). */
export function publicRoute(
  method: Method,
  path: string,
  handler: (ctx: Ctx) => Response | Promise<Response>
) {
  return http[method](
    `${API}${path}`,
    wrap((ctx) => ctx, handler)
  )
}

/** A route that needs a signed-in user (`role: "admin"` → 403 for sales). */
export function route(
  method: Method,
  path: string,
  handler: (ctx: AuthedCtx) => Response | Promise<Response>,
  options: { role?: "admin" } = {}
) {
  return http[method](
    `${API}${path}`,
    wrap((ctx) => {
      const user = currentUser()
      if (!user) throw fail.unauthorized()
      if (options.role === "admin" && user.role !== "admin")
        throw fail.forbidden(user.role)
      return { ...ctx, user }
    }, handler)
  )
}

// --- request parsing ---------------------------------------------------------------------------------

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (!text.trim())
    throw fail.validation([
      { loc: ["body"], msg: "Field required", type: "missing" },
    ])
  try {
    return JSON.parse(text)
  } catch {
    throw fail.validation([
      { loc: ["body", 0], msg: "JSON decode error", type: "json_invalid" },
    ])
  }
}

export function pathUuid(ctx: Ctx, name = "id"): string {
  const value = ctx.params[name] ?? ""
  if (!isUuid(value))
    throw fail.validation([
      {
        loc: ["path", name],
        msg: "Input should be a valid UUID",
        type: "uuid_parsing",
      },
    ])
  return value.toLowerCase()
}

type QueryNumber = { ge?: number; le?: number }

function queryError(name: string, msg: string, type: string): never {
  throw fail.validation([{ loc: ["query", name], msg, type }])
}

function checkRange(name: string, value: number, range: QueryNumber) {
  if (range.ge !== undefined && value < range.ge)
    queryError(
      name,
      `Input should be greater than or equal to ${range.ge}`,
      "greater_than_equal"
    )
  if (range.le !== undefined && value > range.le)
    queryError(
      name,
      `Input should be less than or equal to ${range.le}`,
      "less_than_equal"
    )
}

export function queryInt(
  url: URL,
  name: string,
  fallback: number,
  range: QueryNumber = {}
): number {
  const raw = url.searchParams.get(name)
  if (raw === null) return fallback
  if (!/^-?\d+$/.test(raw.trim()))
    queryError(
      name,
      "Input should be a valid integer, unable to parse string as an integer",
      "int_parsing"
    )
  const value = Number(raw)
  checkRange(name, value, range)
  return value
}

export function queryNumber(url: URL, name: string): number | null {
  const raw = url.searchParams.get(name)
  if (raw === null) return null
  const value = Number(raw)
  if (raw.trim() === "" || Number.isNaN(value))
    queryError(
      name,
      "Input should be a valid number, unable to parse string as a number",
      "float_parsing"
    )
  return value
}

const TRUE = ["true", "1", "yes", "on", "t", "y"]
const FALSE = ["false", "0", "no", "off", "f", "n"]

export function queryBool(url: URL, name: string): boolean | null {
  const raw = url.searchParams.get(name)
  if (raw === null) return null
  const v = raw.trim().toLowerCase()
  if (TRUE.includes(v)) return true
  if (FALSE.includes(v)) return false
  return queryError(
    name,
    "Input should be a valid boolean, unable to interpret input",
    "bool_parsing"
  )
}

export function queryUuid(url: URL, name: string): string | null {
  const raw = url.searchParams.get(name)
  if (raw === null) return null
  if (!isUuid(raw.trim()))
    queryError(name, "Input should be a valid UUID", "uuid_parsing")
  return raw.trim().toLowerCase()
}

/** `?x=a&x=b` and `?x=a,b` are equivalent (backend leads/router.py `_multi`). */
export function queryMulti(url: URL, name: string): string[] {
  return url.searchParams
    .getAll(name)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean)
}

export function paginate<T>(
  items: T[],
  url: URL
): { items: T[]; total: number; page: number; page_size: number } {
  const page = queryInt(url, "page", 1, { ge: 1 })
  const pageSize = queryInt(url, "page_size", 20, { ge: 1, le: 100 })
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  }
}

// --- body validation (pydantic-style errors) ---------------------------------------------------------

type Base = { required?: boolean; nullable?: boolean }
export type FieldSpec =
  | (Base & {
      type: "string"
      min?: number
      max?: number
      enum?: readonly string[]
    })
  | (Base & { type: "int" | "number"; gt?: number; ge?: number; le?: number })
  | (Base & { type: "bool" })
  | (Base & { type: "uuid" })
  | (Base & { type: "email" })
  | (Base & { type: "object" })
  | (Base & { type: "any" })
  | (Base & {
      type: "list"
      items?: "string" | "uuid" | "number" | "any" | { enum: readonly string[] }
      minItems?: number
      maxItems?: number
    })

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function enumMsg(values: readonly string[]): string {
  const quoted = values.map((v) => `'${v}'`)
  return quoted.length <= 1
    ? `Input should be ${quoted[0] ?? "''"}`
    : `Input should be ${quoted.slice(0, -1).join(", ")} or ${quoted.at(-1)}`
}

function checkValue(
  loc: (string | number)[],
  value: unknown,
  spec: FieldSpec,
  errors: ValidationItem[]
): void {
  if (value === null) {
    if (!spec.nullable) {
      const kind =
        spec.type === "list"
          ? "list"
          : spec.type === "int"
            ? "integer"
            : spec.type === "bool"
              ? "boolean"
              : spec.type === "object"
                ? "dictionary"
                : spec.type
      errors.push({
        loc,
        msg: `Input should be a valid ${kind}`,
        type: `${spec.type === "list" ? "list" : spec.type}_type`,
      })
    }
    return
  }
  switch (spec.type) {
    case "any":
      return
    case "string":
    case "email":
    case "uuid": {
      if (typeof value !== "string") {
        errors.push({
          loc,
          msg: "Input should be a valid string",
          type: "string_type",
        })
        return
      }
      if (spec.type === "uuid" && !isUuid(value))
        errors.push({
          loc,
          msg: "Input should be a valid UUID",
          type: "uuid_parsing",
        })
      if (spec.type === "email" && !EMAIL_RE.test(value.trim()))
        errors.push({
          loc,
          msg: "value is not a valid email address: An email address must have an @-sign.",
          type: "value_error",
        })
      if (spec.type === "string") {
        if (spec.min !== undefined && value.length < spec.min)
          errors.push({
            loc,
            msg: `String should have at least ${spec.min} character${spec.min === 1 ? "" : "s"}`,
            type: "string_too_short",
          })
        if (spec.max !== undefined && value.length > spec.max)
          errors.push({
            loc,
            msg: `String should have at most ${spec.max} characters`,
            type: "string_too_long",
          })
        if (spec.enum && !spec.enum.includes(value))
          errors.push({ loc, msg: enumMsg(spec.enum), type: "literal_error" })
      }
      return
    }
    case "int":
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push({
          loc,
          msg:
            spec.type === "int"
              ? "Input should be a valid integer"
              : "Input should be a valid number",
          type: spec.type === "int" ? "int_type" : "float_type",
        })
        return
      }
      if (spec.type === "int" && !Number.isInteger(value)) {
        errors.push({
          loc,
          msg: "Input should be a valid integer, got a number with a fractional part",
          type: "int_from_float",
        })
        return
      }
      if (spec.gt !== undefined && !(value > spec.gt))
        errors.push({
          loc,
          msg: `Input should be greater than ${spec.gt}`,
          type: "greater_than",
        })
      if (spec.ge !== undefined && value < spec.ge)
        errors.push({
          loc,
          msg: `Input should be greater than or equal to ${spec.ge}`,
          type: "greater_than_equal",
        })
      if (spec.le !== undefined && value > spec.le)
        errors.push({
          loc,
          msg: `Input should be less than or equal to ${spec.le}`,
          type: "less_than_equal",
        })
      return
    }
    case "bool":
      if (typeof value !== "boolean")
        errors.push({
          loc,
          msg: "Input should be a valid boolean",
          type: "bool_type",
        })
      return
    case "object":
      if (typeof value !== "object" || Array.isArray(value))
        errors.push({
          loc,
          msg: "Input should be a valid dictionary",
          type: "dict_type",
        })
      return
    case "list": {
      if (!Array.isArray(value)) {
        errors.push({
          loc,
          msg: "Input should be a valid list",
          type: "list_type",
        })
        return
      }
      if (spec.minItems !== undefined && value.length < spec.minItems)
        errors.push({
          loc,
          msg: `List should have at least ${spec.minItems} item${spec.minItems === 1 ? "" : "s"} after validation, not ${value.length}`,
          type: "too_short",
        })
      if (spec.maxItems !== undefined && value.length > spec.maxItems)
        errors.push({
          loc,
          msg: `List should have at most ${spec.maxItems} items after validation, not ${value.length}`,
          type: "too_long",
        })
      const items = spec.items ?? "any"
      value.forEach((item, i) => {
        if (items === "any") return
        if (items === "string")
          checkValue([...loc, i], item, { type: "string" }, errors)
        else if (items === "uuid")
          checkValue([...loc, i], item, { type: "uuid" }, errors)
        else if (items === "number")
          checkValue([...loc, i], item, { type: "number" }, errors)
        else
          checkValue(
            [...loc, i],
            item,
            { type: "string", enum: items.enum },
            errors
          )
      })
    }
  }
}

/**
 * Validates a JSON body like a pydantic model; throws 422 `validation_error` with `details.errors`.
 * `forbidExtra` mirrors `extra="forbid"`.
 */
export function validateBody<T>(
  body: unknown,
  fields: Record<string, FieldSpec>,
  opts: { forbidExtra?: boolean } = {}
): T {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    throw fail.validation([
      {
        loc: ["body"],
        msg: "Input should be a valid dictionary or object to extract fields from",
        type: "model_attributes_type",
      },
    ])
  const errors: ValidationItem[] = []
  const record = body as Record<string, unknown>
  for (const [name, spec] of Object.entries(fields)) {
    if (!(name in record) || record[name] === undefined) {
      if (spec.required)
        errors.push({
          loc: ["body", name],
          msg: "Field required",
          type: "missing",
        })
      continue
    }
    checkValue(["body", name], record[name], spec, errors)
  }
  if (opts.forbidExtra)
    for (const name of Object.keys(record))
      if (!(name in fields))
        errors.push({
          loc: ["body", name],
          msg: "Extra inputs are not permitted",
          type: "extra_forbidden",
        })
  if (errors.length) throw fail.validation(errors)
  return record as T
}

/** Keys of `patch` that are present (PATCH semantics: omitted = untouched). */
export function has<T extends object>(patch: T, key: keyof T): boolean {
  return (
    Object.prototype.hasOwnProperty.call(patch, key) &&
    (patch as Record<PropertyKey, unknown>)[key] !== undefined
  )
}
