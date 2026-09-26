/** /auth/* (backend auth/router.py). The session cookie is simulated by `db.sessionUserId`. */
import type {
  LoginIn,
  LoginResponse,
  UserCreate,
  UserOut,
  UserUpdate,
} from "@/api/generated/model"

import { nextId, ORG_ID } from "../data/ids"
import { iso } from "../data/time"
import { db, signIn, signOut } from "../db"
import type { UserRecord } from "../types"
import {
  ApiFailure,
  fail,
  has,
  json,
  noContent,
  publicRoute,
  readJson,
  route,
  validateBody,
} from "./http"

const MAX_FAILURES = 5
const WINDOW_MS = 60_000

export function userOut(u: UserRecord): UserOut {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    last_login_at: u.last_login_at,
  }
}

/** Not a real JWT; the SPA must not use it (the backend's token is in an httpOnly cookie). */
function fakeToken(u: UserRecord): string {
  const payload = btoa(
    JSON.stringify({ sub: u.id, org: ORG_ID, role: u.role, email: u.email })
  )
  return `mock.${payload.replace(/=+$/, "")}.signature`
}

function loginResponse(u: UserRecord): LoginResponse {
  const token = fakeToken(u)
  return {
    user: userOut(u),
    access: token,
    refresh: token,
    role: u.role,
    token_type: "bearer",
  }
}

function recentFailures(email: string, now: number): number[] {
  const list = (db.loginFailures[email] ?? []).filter(
    (t) => now - t < WINDOW_MS
  )
  db.loginFailures[email] = list
  return list
}

/** Rate limit (5 failures / 60 s, checked before the password) + credentials check. */
function authenticate(email: string, password: string): UserRecord {
  const key = email.trim().toLowerCase()
  const now = Date.now()
  const failures = recentFailures(key, now)
  if (failures.length >= MAX_FAILURES) {
    const retry = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - failures[0])) / 1000)
    )
    throw new ApiFailure(
      429,
      "rate_limited",
      "Too many login attempts. Please try again later.",
      {},
      {
        "Retry-After": String(retry),
      }
    )
  }
  const user = db.users.find((u) => u.email === key)
  if (!user || user.password !== password || !user.is_active) {
    failures.push(now)
    throw fail.domain(401, "invalid_credentials", "Invalid credentials")
  }
  delete db.loginFailures[key]
  user.last_login_at = iso(now)
  return user
}

export const authHandlers = [
  publicRoute("post", "/auth/login", async ({ request }) => {
    const body = validateBody<LoginIn>(await readJson(request), {
      email: { type: "email", required: true },
      password: { type: "string", required: true },
      remember_me: { type: "bool" },
    })
    const user = authenticate(body.email, body.password)
    signIn(user.id)
    return json<LoginResponse>(loginResponse(user))
  }),

  publicRoute("post", "/auth/token", async ({ request }) => {
    const form = new URLSearchParams(await request.text())
    const username = form.get("username")
    const password = form.get("password")
    const missing = [!username && "username", !password && "password"].filter(
      Boolean
    ) as string[]
    if (missing.length)
      throw fail.validation(
        missing.map((f) => ({
          loc: ["body", f],
          msg: "Field required",
          type: "missing",
        }))
      )
    const user = authenticate(username ?? "", password ?? "")
    return json<{ access_token: string; token_type: string }>({
      access_token: fakeToken(user),
      token_type: "bearer",
    })
  }),

  route("post", "/auth/refresh", ({ user }) =>
    json<LoginResponse>(loginResponse(user))
  ),

  publicRoute("post", "/auth/logout", () => {
    signOut()
    return noContent()
  }),

  route("get", "/auth/me", ({ user }) => json<UserOut>(userOut(user))),

  route(
    "get",
    "/auth/users",
    () =>
      json<UserOut[]>(
        [...db.users]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map(userOut)
      ),
    { role: "admin" }
  ),

  route(
    "post",
    "/auth/users",
    async ({ request }) => {
      const body = validateBody<UserCreate>(
        await readJson(request),
        {
          email: { type: "email", required: true },
          password: { type: "string", required: true },
          full_name: { type: "string", nullable: true },
          role: { type: "string", enum: ["admin", "sales"] },
          org_id: { type: "uuid", nullable: true },
        },
        { forbidExtra: true }
      )
      const email = body.email.trim().toLowerCase()
      if (db.users.some((u) => u.email === email))
        throw fail.conflict(`User with email '${email}' already exists`)
      const now = iso(Date.now())
      const user: UserRecord = {
        id: nextId(db),
        org_id: ORG_ID,
        email,
        password: body.password,
        full_name: body.full_name ?? null,
        role: body.role ?? "sales",
        is_active: true,
        last_login_at: null,
        created_at: now,
      }
      db.users.push(user)
      return json<UserOut>(userOut(user), 201)
    },
    { role: "admin" }
  ),

  route(
    "patch",
    "/auth/users/:id",
    async (ctx) => {
      const id = ctx.params.id
      const body = validateBody<UserUpdate>(
        await readJson(ctx.request),
        {
          full_name: { type: "string", nullable: true },
          role: { type: "string", enum: ["admin", "sales"], nullable: true },
          is_active: { type: "bool", nullable: true },
          password: { type: "string", nullable: true },
        },
        { forbidExtra: true }
      )
      const user = db.users.find((u) => u.id === id?.toLowerCase())
      if (!user) throw fail.notFound("User not found")
      // null = leave unchanged (auth/service.py)
      if (has(body, "full_name") && body.full_name !== null)
        user.full_name = body.full_name ?? user.full_name
      if (has(body, "role") && body.role) user.role = body.role
      if (
        has(body, "is_active") &&
        body.is_active !== null &&
        body.is_active !== undefined
      )
        user.is_active = body.is_active
      if (has(body, "password") && body.password) user.password = body.password
      return json<UserOut>(userOut(user))
    },
    { role: "admin" }
  ),
]
