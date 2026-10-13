import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/components/app-layout"
import { Dashboard } from "@/routes/dashboard"
import { RegisterFiles } from "@/routes/files/create"
import { FileList } from "@/routes/files/list"
import { FileRead } from "@/routes/files/read"
import { FileUpdate } from "@/routes/files/update"
import { NotFound } from "@/routes/not-found"

// The routes of design §7.4, added as their phase is built
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "files",
        children: [
          { index: true, element: <FileList /> },
          { path: "create", element: <RegisterFiles /> },
          { path: ":id", element: <FileRead /> },
          { path: ":id/update", element: <FileUpdate /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
])
