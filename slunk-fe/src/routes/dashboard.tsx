import { useQuery } from "@apollo/client/react"
import { CircleAlertIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { Cover } from "@/components/cover"
import { artistUrl, Names } from "@/components/names"
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
import { Title } from "@/components/titles"
import { graphql } from "@/gql"
import { formatDuration } from "@/lib/format"

const DashboardQuery = graphql(`
  query Dashboard {
    health {
      database
      migration
    }
    fileCounts {
      total
      unused
    }
    catalogTotals {
      releases
      artists
      tracks
      labels
      durationMs
    }
    newest: releases(perPage: 12) {
      items {
        id
        title
        titleLanguage
        cover {
          id
        }
        artists {
          artist {
            id
            name
            nameLanguage
          }
          creditedAs {
            name
            language
          }
        }
      }
    }
  }
`)

/** `/` (design §7.5): numbers that are cheap to compute, and the latest additions. */
export function Dashboard() {
  const { data, error } = useQuery(DashboardQuery)

  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard" }]} />
      <div className="flex flex-col gap-4 p-4">
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
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
              <Total
                title="Releases"
                to="/releases"
                value={data.catalogTotals.releases}
              />
              <Total
                title="Artists"
                to="/artists"
                value={data.catalogTotals.artists}
              />
              <Total
                title="Tracks"
                to="/tracks"
                value={data.catalogTotals.tracks}
              >
                {formatDuration(data.catalogTotals.durationMs) || "0:00"}{" "}
                playing time
              </Total>
              <Total
                title="Labels"
                to="/labels"
                value={data.catalogTotals.labels}
              />
              <Total title="Files" to="/files" value={data.fileCounts.total} />
              <Total
                title="Unused files"
                to="/files?unused=1"
                value={data.fileCounts.unused}
              >
                Registered files nothing uses yet
              </Total>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Newest releases</CardTitle>
              </CardHeader>
              <CardContent>
                {data.newest.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No releases yet.{" "}
                    <Link
                      to="/import"
                      className="text-foreground hover:underline"
                    >
                      Import a folder
                    </Link>{" "}
                    to make one.
                  </p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4">
                    {data.newest.items.map((release) => (
                      <div
                        key={release.id}
                        className="flex flex-col gap-1 text-xs"
                      >
                        <Link to={`/releases/${release.id}`}>
                          <Cover
                            file={release.cover}
                            alt={`${release.title} cover`}
                            className="w-full"
                          />
                        </Link>
                        <Link
                          to={`/releases/${release.id}`}
                          className="font-medium hover:underline"
                        >
                          <Title
                            title={release.title}
                            language={release.titleLanguage}
                          />
                        </Link>
                        <span className="text-muted-foreground">
                          <Names items={release.artists} to={artistUrl} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}

/** A number that links to its list. */
function Total({
  title,
  to,
  value,
  children,
}: {
  title: string
  to: string
  value: number
  children?: ReactNode
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:bg-muted/50">
        <CardHeader>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {value.toLocaleString()}
          </CardTitle>
        </CardHeader>
        {children && (
          <CardContent className="text-xs text-muted-foreground">
            {children}
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
