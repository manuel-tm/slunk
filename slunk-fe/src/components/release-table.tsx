import { Link } from "react-router"

import { Cover } from "@/components/cover"
import { SortableHead } from "@/components/list/sortable-head"
import { artistUrl, labelUrl, Names } from "@/components/names"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, formatReleased } from "@/lib/format"

type Named = { id: string; name: string }

/** A release, with whichever fields the page asked for. */
export type ReleaseRow = {
  id: string
  title: string
  released?: string | null
  catalogNumber?: string | null
  variousArtists?: boolean
  insertedAt?: number
  updatedAt?: number
  cover?: { id: string } | null
  artists?: Named[]
  formats?: Named[]
  media?: Named[]
  labels?: Named[]
}

export type ReleaseColumn =
  | "id"
  | "cover"
  | "title"
  | "artists"
  | "released"
  | "formats"
  | "media"
  | "labels"
  | "catalogNumber"
  | "variousArtists"
  | "added"
  | "updated"

const HEADS: Record<ReleaseColumn, string> = {
  id: "Id",
  cover: "",
  title: "Title",
  artists: "Artists",
  released: "Released",
  formats: "Format",
  media: "Media",
  labels: "Label",
  catalogNumber: "Cat#",
  variousArtists: "Various artists",
  added: "Added",
  updated: "Updated",
}

const SORTABLE = new Set<ReleaseColumn>(["title", "released"])

/**
 * The release table (design §7.6): the release list's, also shown on label
 * and artist pages with fewer columns. `withArtists` names every artist in
 * the title cell, as on an artist page.
 */
export function ReleaseTable({
  releases,
  columns,
  sort,
  onSort,
  withArtists = false,
}: {
  releases: ReleaseRow[]
  columns: ReleaseColumn[]
  sort?: string | null
  onSort?: (sort: string | null) => void
  withArtists?: boolean
}) {
  const names = (items: Named[] | undefined) =>
    items?.map((i) => i.name).join(", ")

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) =>
            onSort && SORTABLE.has(column) ? (
              <SortableHead
                key={column}
                column={column}
                sort={sort ?? null}
                onSort={onSort}
              >
                {HEADS[column]}
              </SortableHead>
            ) : (
              <TableHead key={column}>{HEADS[column]}</TableHead>
            )
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {releases.map((release) => (
          <TableRow key={release.id}>
            {columns.map((column) => (
              <TableCell
                key={column}
                className={
                  column === "title" ||
                  column === "artists" ||
                  column === "labels"
                    ? "min-w-40 whitespace-normal"
                    : undefined
                }
              >
                {column === "id" && (
                  <span className="tabular-nums">{release.id}</span>
                )}
                {column === "cover" && (
                  <Link to={`/releases/${release.id}`}>
                    <Cover file={release.cover} alt="" className="size-10" />
                  </Link>
                )}
                {column === "title" && (
                  <>
                    {withArtists && release.artists?.length ? (
                      <>
                        <Names items={release.artists} to={artistUrl} /> –{" "}
                      </>
                    ) : null}
                    <Link
                      to={`/releases/${release.id}`}
                      className="font-medium hover:underline"
                    >
                      {release.title}
                    </Link>
                  </>
                )}
                {column === "artists" && release.artists && (
                  <Names items={release.artists} to={artistUrl} />
                )}
                {column === "released" && formatReleased(release.released)}
                {column === "formats" && names(release.formats)}
                {column === "media" && names(release.media)}
                {column === "labels" && release.labels && (
                  <Names items={release.labels} to={labelUrl} commas />
                )}
                {column === "catalogNumber" && release.catalogNumber}
                {column === "variousArtists" &&
                  (release.variousArtists ? "Yes" : "")}
                {column === "added" &&
                  release.insertedAt &&
                  formatDateTime(release.insertedAt)}
                {column === "updated" &&
                  release.updatedAt &&
                  formatDateTime(release.updatedAt)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
