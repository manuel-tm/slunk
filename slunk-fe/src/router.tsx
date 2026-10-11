import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/components/app-layout"
import { Dashboard } from "@/routes/dashboard"
import { NotFound } from "@/routes/not-found"

// The routes of design §7.4, added as their phase is built
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])
