import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BuildingsIcon,
  ChartPieIcon,
  CrosshairIcon,
  FireIcon,
  GearIcon,
  LightningIcon,
  TargetIcon,
  SkullIcon,
  SneakerMoveIcon,
} from "@phosphor-icons/react"

// Demo data — nothing here talks to the API
const data = {
  user: {
    name: "Sales Ninja",
    email: "closer@leadradar.dev",
    avatar: "",
  },
  teams: [
    {
      name: "LeadRadar",
      logo: <TargetIcon />,
      plan: "Hackathon edition",
    },
    {
      name: "Night Shift",
      logo: <SneakerMoveIcon />,
      plan: "Runs on coffee",
    },
    {
      name: "Evil Corp.",
      logo: <SkullIcon />,
      plan: "Prospect #1",
    },
  ],
  navMain: [
    {
      title: "Prospects",
      url: "#/prospects",
      icon: <CrosshairIcon />,
      isActive: true,
      items: [
        { title: "Leaderboard", url: "#/prospects" },
        { title: "Fit × Intent", url: "#/prospects/matrix" },
        { title: "Hot today", url: "#/prospects/hot" },
      ],
    },
    {
      title: "Runs",
      url: "#/runs",
      icon: <LightningIcon />,
      items: [
        { title: "Live", url: "#/runs" },
        { title: "History", url: "#/runs/history" },
      ],
    },
    {
      title: "Accounts",
      url: "#/accounts",
      icon: <BuildingsIcon />,
      items: [
        { title: "All companies", url: "#/accounts" },
        { title: "Discover", url: "#/accounts/discover" },
        { title: "Import CSV", url: "#/accounts/import" },
      ],
    },
    {
      title: "Settings",
      url: "#/settings",
      icon: <GearIcon />,
      items: [
        { title: "Services", url: "#/settings/services" },
        { title: "Questions", url: "#/settings/questions" },
        { title: "ICP", url: "#/settings/icp" },
        { title: "Rules", url: "#/settings/rules" },
        { title: "Scoring", url: "#/settings/scoring" },
      ],
    },
    {
      title: "Quality",
      url: "#/quality",
      icon: <ChartPieIcon />,
      items: [
        { title: "Precision", url: "#/quality" },
        { title: "AI usage", url: "#/quality/ai" },
      ],
    },
  ],
  projects: [
    { name: "Acme Corp · 97", url: "#/companies/acme", icon: <FireIcon /> },
    { name: "Initech · 91", url: "#/companies/initech", icon: <FireIcon /> },
    { name: "Umbrella · 88", url: "#/companies/umbrella", icon: <FireIcon /> },
  ],
}

export type SidebarPage = { section: string; title: string; url: string }

export function AppSidebar({
  activeUrl,
  onNavigate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeUrl?: string
  onNavigate?: (page: SidebarPage) => void
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          activeUrl={activeUrl}
          onNavigate={onNavigate}
        />
        <NavProjects
          projects={data.projects}
          activeUrl={activeUrl}
          onNavigate={onNavigate}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
