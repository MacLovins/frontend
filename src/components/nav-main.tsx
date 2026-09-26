import type { ReactNode } from "react"
import { Link, useLocation } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { CaretRightIcon } from "@phosphor-icons/react"

export type NavItem = {
  title: string
  url: string
  icon?: ReactNode
  items?: { title: string; url: string }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Radar</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const open =
            item.items?.some((subItem) => pathname === subItem.url.split("?")[0]) ||
            pathname === item.url.split("?")[0]
          return (
            <Collapsible
              key={item.title}
              defaultOpen={open}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
                {item.icon}
                <span>{item.title}</span>
                <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={pathname === subItem.url.split("?")[0]}
                        render={<Link to={subItem.url} />}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
