import type { ComponentProps, ReactNode } from "react"

import { NavMain, type NavItem } from "@/components/nav-main"
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

export function AppSidebar({
  items,
  teams,
  activeServiceId,
  onServiceChange,
  projects,
  user,
  onSignOut,
  ...props
}: ComponentProps<typeof Sidebar> & {
  items: NavItem[]
  teams: { id: string; name: string; plan: string; logo: ReactNode }[]
  activeServiceId: string
  onServiceChange: (id: string) => void
  projects: { name: string; url: string; icon: ReactNode }[]
  user: { email: string; role: string }
  onSignOut: () => void
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} activeId={activeServiceId} onChange={onServiceChange} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
