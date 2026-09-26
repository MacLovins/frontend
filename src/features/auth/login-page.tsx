import { useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"

import { LocaleSwitcher } from "@/features/components/locale-switcher"
import { useLocaleParam } from "@/lib/use-locale"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/features/auth/auth-context"
import { Field, FormError } from "@/features/auth/fields"
import { homePath } from "@/features/auth/paths"
import { loginSchema, type LoginValues } from "@/features/auth/schemas"

export function LoginPage() {
  const { t } = useTranslation()
  const lang = useLocaleParam()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [reason, setReason] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember_me: false },
  })

  async function onSubmit(values: LoginValues) {
    setReason(null)
    try {
      const tokens = await signIn(values)
      await navigate(homePath(lang, tokens.role))
    } catch (error) {
      setReason(error instanceof ApiError ? error.reason : "unknown")
    }
  }

  return (
    <AuthScreen>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>
        <LocaleSwitcher />
      </header>
      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError reason={reason} />
        <Field label={t("auth.email")} error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label={t("auth.password")} error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" {...register("remember_me")} />
          {t("auth.rememberMe")}
        </label>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t("auth.submitting") : t("auth.submitLogin")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link className="text-foreground underline underline-offset-4" to={`/${lang}/register`}>
          {t("auth.registerLink")}
        </Link>
      </p>
    </AuthScreen>
  )
}

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        {children}
      </section>
    </main>
  )
}
