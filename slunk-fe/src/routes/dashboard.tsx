import { useQuery } from "@apollo/client/react"
import { CircleAlertIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"

const HealthQuery = graphql(`
  query Health {
    health {
      database
      migration
    }
  }
`)

/** `/` (design §7.5). Each part appears once its phase is built. */
export function Dashboard() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard" }]} />
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <StatusCard />
      </div>
    </>
  )
}

function StatusCard() {
  const { data, error } = useQuery(HealthQuery)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
        <CardDescription>
          The backend, and the database it serves
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Can't reach the backend</AlertTitle>
            <AlertDescription>
              {error.message}. Is it running? Start it with{" "}
              <code>npm run dev</code> in <code>slunk-be/</code>.
            </AlertDescription>
          </Alert>
        ) : !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Backend</dt>
            <dd>
              <Badge variant="secondary">Connected</Badge>
            </dd>
            <dt className="text-muted-foreground">Database</dt>
            <dd className="font-mono break-all">{data.health.database}</dd>
            <dt className="text-muted-foreground">Schema</dt>
            <dd className="font-mono break-all">
              {data.health.migration ?? "No migrations applied"}
            </dd>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
