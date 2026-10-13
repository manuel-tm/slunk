import { FilesIcon, LayoutDashboardIcon, type LucideIcon } from "lucide-react"
import { Link, useMatch } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type Section = { title: string; to: string; icon: LucideIcon }

// A section appears once its phase is built (design §7.1)
const sections: Section[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboardIcon },
  { title: "Files", to: "/files", icon: FilesIcon },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="px-2 py-1 font-heading text-lg font-semibold">
          slunk
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
                <SectionLink key={section.to} {...section} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function SectionLink({ title, to, icon: Icon }: Section) {
  // A section stays active on its entities' pages, e.g. /artists/12
  const active = useMatch({ path: to, end: to === "/" }) !== null

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link to={to} />} isActive={active}>
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
