import { useTranslation } from "react-i18next"
import { Navigate } from "react-router"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { useLocaleParam } from "@/lib/use-locale"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { SessionLoading } from "@/features/auth/session-loading"

export function HomePage() {
  const { role, status, signOut } = useAuth()
  const lang = useLocaleParam()

  if (status === "restoring") {
    return <SessionLoading />
  }

  if (role === "admin") {
    return <Navigate to={`/${lang}/admin`} replace />
  }

  return <Workspace titleKey="auth.homeTitle" bodyKey="auth.homeBody" onSignOut={signOut} />
}

export function AdminPage() {
  const { role, status, signOut } = useAuth()
  const lang = useLocaleParam()

  if (status === "restoring") {
    return <SessionLoading />
  }

  if (role === "employee") {
    return <Navigate to={`/${lang}`} replace />
  }

  return <Workspace titleKey="auth.adminTitle" bodyKey="auth.adminBody" onSignOut={signOut} />
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
      {t("auth.notFound")}
    </main>
  )
}

function Workspace({
  titleKey,
  bodyKey,
  onSignOut,
}: {
  titleKey: "auth.homeTitle" | "auth.adminTitle"
  bodyKey: "auth.homeBody" | "auth.adminBody"
  onSignOut: () => Promise<void>
}) {
  const { t } = useTranslation()

  return (
    <main className="min-h-svh p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-medium">{t(titleKey)}</h1>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button variant="outline" onClick={() => void onSignOut()}>
            {t("auth.signOut")}
          </Button>
        </div>
      </header>
      <p className="mt-4 text-sm text-muted-foreground">{t(bodyKey)}</p>
    </main>
  )
}
