import type { ReactNode } from "react"
import { Link, useLocation } from "react-router"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: ReactNode }[]
}) {
  const { pathname } = useLocation()
  if (projects.length === 0) {
    return null
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Hot now</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.url}>
            <SidebarMenuButton
              isActive={pathname === project.url.split("?")[0]}
              render={<Link to={project.url} />}
              tooltip={project.name}
            >
              {project.icon}
              <span>{project.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
