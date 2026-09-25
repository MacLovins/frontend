import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"

import { LocaleSwitcher } from "@/features/components/locale-switcher"
import { useLocaleParam } from "@/lib/use-locale"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { ApiError } from "@/lib/api"
import { normalizeMdPhone } from "@/lib/phone"
import { useAuth } from "@/features/auth/auth-context"
import { AuthScreen } from "@/features/auth/login-page"
import { Field, FormError } from "@/features/auth/fields"
import { homePath } from "@/features/auth/paths"
import { registerSchema, type RegisterValues } from "@/features/auth/schemas"

export function RegisterPage() {
  const { t } = useTranslation()
  const lang = useLocaleParam()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [reason, setReason] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      surname: "",
      phone: "",
    },
  })

  async function onSubmit(values: RegisterValues) {
    setReason(null)
    const phone = normalizeMdPhone(values.phone)
    if (!phone) {
      setReason("phone")
      return
    }

    try {
      const tokens = await signUp({
        email: values.email,
        password: values.password,
        name: values.name,
        surname: values.surname,
        phone,
      })
      await navigate(homePath(lang, tokens.role))
    } catch (error) {
      setReason(error instanceof ApiError ? error.reason : "unknown")
    }
  }

  return (
    <AuthScreen>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">{t("auth.registerTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>
        </div>
        <LocaleSwitcher />
      </header>
      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormError reason={reason} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("auth.name")} error={errors.name?.message}>
            <Input autoComplete="given-name" {...register("name")} />
          </Field>
          <Field label={t("auth.surname")} error={errors.surname?.message}>
            <Input autoComplete="family-name" {...register("surname")} />
          </Field>
        </div>
        <Field label={t("auth.email")} error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label={t("auth.phone")} hint={t("auth.phoneHint")} error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" placeholder="+373 69 123 456" {...register("phone")} />
        </Field>
        <Field label={t("auth.password")} hint={t("auth.passwordHint")} error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label={t("auth.confirmPassword")} error={errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t("auth.submitting") : t("auth.submitRegister")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link className="text-foreground underline underline-offset-4" to={`/${lang}/login`}>
          {t("auth.loginLink")}
        </Link>
      </p>
    </AuthScreen>
  )
}
