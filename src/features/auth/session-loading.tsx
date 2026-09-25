import { useTranslation } from "react-i18next"

export function SessionLoading() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      {t("auth.loading")}
    </div>
  )
}
