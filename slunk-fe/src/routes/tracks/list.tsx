import { useQuery } from "@apollo/client/react"
import { Link } from "react-router"

import { ListLayout, PER_PAGE } from "@/components/list/list-layout"
import { SortableHead } from "@/components/list/sortable-head"
import { artistUrl, Names } from "@/components/names"
import { ReleasePicker } from "@/components/pickers"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { graphql } from "@/gql"
import { useListParams } from "@/hooks/use-list-params"
import { formatDateTime, formatDuration } from "@/lib/format"

const TracksQuery = graphql(`
  query Tracks(
    $page: Int!
    $perPage: Int!
    $sort: String
    $q: String
    $release: ID
    $releaseId: ID!
    $withRelease: Boolean!
  ) {
    tracks(
      page: $page
      perPage: $perPage
      sort: $sort
      q: $q
      release: $release
    ) {
      total
      items {
        id
        title
        durationMs
        cdNumber
        trackNumber
        insertedAt
        updatedAt
        release {
          id
          title
        }
        performers {
          id
          name
        }
        file {
          id
          path
        }
      }
    }
    filterRelease: release(id: $releaseId) @include(if: $withRelease) {
      id
      name: title
    }
  }
`)

/** `/tracks` (design §7.8) */
export function TrackList() {
  const list = useListParams()
  const release = list.params.get("release")
  const { data, error } = useQuery(TracksQuery, {
    variables: {
      page: list.page,
      perPage: PER_PAGE,
      sort: list.sort,
      q: list.q,
      release,
      releaseId: release ?? "",
      withRelease: release !== null,
    },
  })

  return (
    <ListLayout
      title="Tracks"
      newTo="/tracks/create"
      list={list}
      searchPlaceholder="Search titles"
      filters={
        <div className="w-64">
          <ReleasePicker
            value={data?.filterRelease ?? null}
            placeholder="Any release"
            onChange={(option) => list.update({ release: option?.id ?? null })}
          />
        </div>
      }
      total={data?.tracks.total}
      error={error}
      emptyText="No tracks yet. Tracks are created from registered audio files."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <SortableHead
              column="title"
              sort={list.sort}
              onSort={(sort) => list.update({ sort })}
            >
              Title
            </SortableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Disc</TableHead>
            <TableHead className="text-right">No.</TableHead>
            <TableHead>Release</TableHead>
            <TableHead>Artists</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.tracks.items.map((track) => (
            <TableRow key={track.id}>
              <TableCell className="tabular-nums">{track.id}</TableCell>
              <TableCell className="min-w-40 whitespace-normal">
                <Link to={`/tracks/${track.id}`} className="hover:underline">
                  {track.title}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDuration(track.durationMs)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {track.cdNumber}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {track.trackNumber}
              </TableCell>
              <TableCell className="whitespace-normal">
                <Link
                  to={`/releases/${track.release.id}`}
                  className="hover:underline"
                >
                  {track.release.title}
                </Link>
              </TableCell>
              <TableCell className="whitespace-normal">
                <Names items={track.performers} to={artistUrl} />
              </TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                <Link
                  to={`/files/${track.file.id}`}
                  className="font-mono hover:underline"
                >
                  {track.file.path}
                </Link>
              </TableCell>
              <TableCell>{formatDateTime(track.insertedAt)}</TableCell>
              <TableCell>{formatDateTime(track.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ListLayout>
  )
}
