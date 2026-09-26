import {
  BuildingOfficeIcon,
  CaretDownIcon,
  ChartScatterIcon,
  CompassIcon,
  CrosshairIcon,
  FunnelIcon,
  LightningIcon,
  ListNumbersIcon,
  PulseIcon,
  QuestionIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  StackIcon,
  type Icon,
} from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router"
import { cn } from "cn"

import { useListActivity } from "@/api/generated/activity/activity"
import { useListQuestions } from "@/api/generated/config/config"
import { useGetQuality } from "@/api/generated/feedback/feedback"
import { useListLeads } from "@/api/generated/leads/leads"
import type { UserOut } from "@/api/generated/model"
import { useListRuns } from "@/api/generated/runs/runs"
import { BrandMark } from "@/components/common/brand-mark"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentService, useSelectService, withService } from "@/hooks/use-current-service"
import { isRunActive } from "@/hooks/use-run-events"
import { useSignOut } from "@/hooks/use-session"
import { roleLabels } from "@/lib/labels"
import { readStorage, storageKeys } from "@/lib/storage"

const DAY_MS = 24 * 60 * 60 * 1000

type Item = {
  label: string
  to: string
  icon: Icon
  active: boolean
  trailing?: ReactNode
}

function NavItem({ item }: { item: Item }) {
  const IconComponent = item.icon
  return (
    <Link
      to={item.to}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "flex h-[38px] items-center gap-2.5 rounded-sm px-2.5 text-sm no-underline outline-sidebar-ring focus-visible:outline-2",
        item.active
          ? "bg-sidebar-accent font-semibold text-white shadow-[inset_3px_0_0_var(--primary)] hover:text-white"
          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
      )}
    >
      <IconComponent size={18} aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.trailing}
    </Link>
  )
}

function NavGroup({ label, items }: { label: string; items: Item[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-1.5 text-2xs font-semibold tracking-[0.08em] text-sidebar-muted uppercase">{label}</div>
      {items.map((item) => (
        <NavItem key={item.label} item={item} />
      ))}
    </div>
  )
}

function CountBadge({ value, tone }: { value: number; tone: "primary" | "dark" }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-2xs font-bold",
        tone === "primary" ? "bg-primary text-black" : "bg-sidebar-border text-warning",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  )
}

function ServiceSwitcher() {
  const { serviceId, service, services, isLoading } = useCurrentService()
  const selectService = useSelectService()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!services.length}
        className="flex h-11 w-full items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-input px-3 text-left text-sm text-white outline-sidebar-ring focus-visible:outline-2 disabled:cursor-default"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-2xs text-sidebar-subtle">Service</span>
          {isLoading ? (
            <Skeleton className="my-0.5 h-4 w-32 bg-sidebar-border" />
          ) : (
            <span className="truncate font-semibold">{service?.name ?? "No services yet"}</span>
          )}
        </span>
        <CaretDownIcon size={16} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[220px]">
        <DropdownMenuRadioGroup value={serviceId} onValueChange={(value: string) => selectService(value)}>
          {services.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              {item.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function initials(user: UserOut) {
  const name = user.full_name?.trim()
  if (name) {
    const words = name.split(/\s+/)
    return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

function UserMenu({ me }: { me: UserOut }) {
  const navigate = useNavigate()
  const signOut = useSignOut()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mt-auto flex w-full items-center gap-2.5 border-t border-sidebar-border p-2.5 text-left text-white outline-sidebar-ring focus-visible:outline-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tier-cold text-xs font-bold text-black">
          {initials(me)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold">{me.full_name || me.email}</span>
          <span className="text-xs text-sidebar-subtle">{roleLabels[me.role]}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="min-w-[232px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{me.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {me.role === "admin" ? (
          <DropdownMenuItem onClick={() => void navigate("/settings/users")}>Users</DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => void navigate("/about")}>About LeadRadar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut().then(() => navigate("/login"))}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar({ me }: { me: UserOut }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const { serviceId } = useCurrentService()
  const isAdmin = me.role === "admin"
  const link = (path: string) => withService(path, serviceId)

  const leads = useListLeads(
    { service_id: serviceId, page_size: 1 },
    { query: { enabled: !!serviceId, staleTime: 60_000 } },
  )
  const activity = useListActivity({ limit: 100 }, { query: { refetchInterval: 60_000 } })
  const runs = useListRuns(
    { limit: 10 },
    {
      query: {
        refetchInterval: (query) => (query.state.data?.some((run) => isRunActive(run.status)) ? 15_000 : 60_000),
      },
    },
  )
  const questions = useListQuestions(serviceId ?? "", { query: { enabled: isAdmin && !!serviceId } })
  const quality = useGetQuality(undefined, { query: { staleTime: 5 * 60_000 } })

  const onToday = pathname.startsWith("/today")
  // Before the first visit to Today, count the last 24 hours.
  const [firstVisitSince] = useState(() => Date.now() - DAY_MS)
  const seenAt = Number(readStorage(storageKeys.todaySeen(me.id))) || firstVisitSince
  const unseen = onToday ? 0 : (activity.data ?? []).filter((event) => Date.parse(event.created_at) > seenAt).length
  const runActive = runs.data?.some((run) => isRunActive(run.status)) ?? false
  const questionsNeedingWork = (questions.data ?? []).filter(
    (question) => question.is_active && question.keywords_status !== "ready",
  ).length
  const precision = quality.data && quality.data.labeled > 0 ? Math.round(quality.data.precision * 100) : null
  const matrixView = pathname === "/prospects" && params.get("view") === "matrix"

  const sell: Item[] = [
    {
      label: "Today",
      to: link("/today"),
      icon: LightningIcon,
      active: onToday,
      trailing: unseen ? <CountBadge value={unseen} tone="primary" /> : null,
    },
    {
      label: "Prospects",
      to: link("/prospects"),
      icon: ListNumbersIcon,
      active: (pathname === "/prospects" && !matrixView) || pathname.startsWith("/companies/"),
      trailing: leads.data?.total ? <span className="text-xs text-sidebar-muted">{leads.data.total}</span> : null,
    },
    {
      label: "Fit × Signals",
      to: link("/prospects?view=matrix"),
      icon: ChartScatterIcon,
      active: matrixView,
    },
    {
      label: "Runs",
      to: link("/runs"),
      icon: PulseIcon,
      active: pathname.startsWith("/runs"),
      trailing: runActive ? (
        <span role="img" aria-label="Analysis running" className="size-2 rounded-full bg-live" />
      ) : null,
    },
  ]
  const accounts: Item[] = [
    { label: "All accounts", to: link("/accounts"), icon: BuildingOfficeIcon, active: pathname === "/accounts" },
    {
      label: "Discover",
      to: link("/accounts/discover"),
      icon: CompassIcon,
      active: pathname.startsWith("/accounts/discover"),
    },
  ]
  const settingsPath = (section: string) => (serviceId ? `/settings/${serviceId}/${section}` : "/settings/services")
  const configure: Item[] = [
    {
      label: "Services",
      to: link("/settings/services"),
      icon: StackIcon,
      active: pathname.startsWith("/settings/services"),
    },
    {
      label: "Signal questions",
      to: settingsPath("questions"),
      icon: QuestionIcon,
      active: pathname.endsWith("/questions"),
      trailing: questionsNeedingWork ? <CountBadge value={questionsNeedingWork} tone="dark" /> : null,
    },
    { label: "Ideal customer", to: settingsPath("icp"), icon: CrosshairIcon, active: pathname.endsWith("/icp") },
    { label: "Rules", to: settingsPath("rules"), icon: FunnelIcon, active: pathname.endsWith("/rules") },
    {
      label: "Scoring",
      to: settingsPath("scoring"),
      icon: SlidersHorizontalIcon,
      active: pathname.endsWith("/scoring"),
    },
  ]
  const insight: Item[] = [
    {
      label: "Quality",
      to: link("/quality"),
      icon: ShieldCheckIcon,
      active: pathname.startsWith("/quality"),
      trailing:
        precision !== null ? (
          <span
            className={cn(
              "text-xs font-semibold",
              precision >= 80 ? "text-live" : precision >= 60 ? "text-warning" : "text-[#ff4d4d]",
            )}
          >
            {precision}%
          </span>
        ) : null,
    },
  ]

  const orgName = import.meta.env.VITE_ORG_NAME

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 flex h-svh w-[248px] shrink-0 flex-col gap-5 overflow-y-auto bg-sidebar px-3.5 py-5 text-white"
    >
      <Link to={link("/prospects")} className="flex items-center gap-2.5 px-1.5 text-white no-underline hover:text-white">
        <BrandMark />
        <span className="flex flex-col">
          <span className="text-base font-bold">LeadRadar</span>
          {orgName ? <span className="text-xs text-sidebar-subtle">{orgName}</span> : null}
        </span>
      </Link>
      <ServiceSwitcher />
      <NavGroup label="Sell" items={sell} />
      <NavGroup label="Accounts" items={accounts} />
      {isAdmin ? <NavGroup label="Configure · admin" items={configure} /> : null}
      <NavGroup label="Insight" items={insight} />
      <UserMenu me={me} />
    </nav>
  )
}
