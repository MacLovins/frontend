import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Link, Navigate, useLocation, useNavigate } from "react-router"
import { z } from "zod"

import { meQueryKey } from "@/api/cache"
import { useLogin } from "@/api/generated/auth/auth"
import { ApiError, errorMessage } from "@/api/mutator"
import { BrandMark } from "@/components/common/brand-mark"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useMe } from "@/hooks/use-session"

const schema = z.object({
  email: z.email("Enter a valid email address"),
  // The backend enforces no rule at login, so neither does the form.
  password: z.string().min(1, "Enter your password"),
})

type Values = z.infer<typeof schema>

function loginError(error: unknown) {
  if (error instanceof ApiError && error.code === "invalid_credentials") {
    return "Wrong email or password, or the account is deactivated."
  }
  if (error instanceof ApiError && error.code === "rate_limited") {
    return "Too many attempts. Wait a minute, then try again."
  }
  return errorMessage(error)
}

export function LoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const me = useMe()
  const from = (location.state as { from?: string } | null)?.from ?? "/prospects"

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })
  const login = useLogin({
    mutation: {
      meta: { errorToast: false },
      onSuccess: (session) => {
        queryClient.setQueryData(meQueryKey, session.user)
        void navigate(from, { replace: true })
      },
    },
  })

  if (me.data) return <Navigate to={from} replace />

  const submit = form.handleSubmit((values) => login.mutate({ data: values }))

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-[#ffffff] px-6 text-[#000000] dark:bg-[#000000] dark:text-[#ffffff]">
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-gradient" />
      </div>
      <ThemeToggle className="absolute top-5 right-8 z-20 text-[#000000] hover:bg-black/5 dark:text-[#ffffff] dark:hover:bg-white/10" />
      <header className="absolute top-10 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <span className="text-[22px] font-bold tracking-[-0.01em]">LeadRadar</span>
        </div>
      </header>

      <main className="relative z-10 flex w-full max-w-[440px] flex-col items-center rounded-3xl border border-white/70 bg-white/55 px-8 py-8 shadow-[0_12px_48px_rgb(255_121_0/0.12)] backdrop-blur-2xl dark:border-white/15 dark:bg-black/45 dark:shadow-[0_12px_48px_rgb(0_0_0/0.35)]">
        <form
          noValidate
          onSubmit={submit}
          className="flex w-full flex-col gap-6"
        >
          <div className="flex flex-col gap-1 text-center">
            <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">Sign in</h1>
            <p className="m-0 text-sm text-muted-foreground">Use the account your admin created for you.</p>
          </div>

          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          {login.isError ? (
            <p role="alert" className="m-0 rounded-md bg-negative-surface px-3 py-2.5 text-sm text-negative-strong">
              {loginError(login.error)}
            </p>
          ) : null}

          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>

          {import.meta.env.VITE_MOCK === "true" ? (
            <p className="m-0 text-xs leading-normal text-muted-foreground">
              Demo mode. Admin: admin@leadradar.ai / admin12345! · Sales: sales@leadradar.ai / sales12345!
            </p>
          ) : null}
        </form>
        <Link to="/about" className="mt-8 text-sm font-semibold text-inherit">
          How LeadRadar works →
        </Link>
      </main>
    </div>
  )
}
