import { Link, useLocation, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { LOCALES } from "@/lib/locale"
import { cn } from "cn"

export function LocaleSwitcher() {
  const { lang } = useParams()
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
      {LOCALES.map((code) => {
        const segments = location.pathname.split("/")
        segments[1] = code
        const to = `${segments.join("/")}${location.search}`
        const active = lang === code

        return (
          <Link
            key={code}
            to={to}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium text-muted-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            {t(`locales.${code}`)}
          </Link>
        )
      })}
    </div>
  )
}
