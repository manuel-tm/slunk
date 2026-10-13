import { Outlet } from "react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/** The app shell (design §7.1): the sidebar, and the page beside it. */
export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* min-w-0 lets wide tables scroll inside the page, not widen it */}
      <SidebarInset className="min-w-0">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
