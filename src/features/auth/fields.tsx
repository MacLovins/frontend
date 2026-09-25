import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Label } from "@/features/components/ui/label"

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {error ? (
        <span className="text-sm text-destructive">{t(`errors.${error}`)}</span>
      ) : null}
    </div>
  )
}

export function FormError({ reason }: { reason: string | null }) {
  const { t } = useTranslation()
  if (!reason) {
    return null
  }

  const key = `errors.${reason}`
  const message = t(key)
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message === key ? t("errors.unknown") : message}
    </p>
  )
}
