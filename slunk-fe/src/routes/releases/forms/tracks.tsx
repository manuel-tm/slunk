import { useMutation, useQuery } from "@apollo/client/react"
import { XIcon } from "lucide-react"
import { Fragment, useState } from "react"

import { ChipList } from "@/components/chip-list"
import type { Option } from "@/components/picker"
import { ArtistPicker, FilePicker } from "@/components/pickers"
import { QueryError } from "@/components/query-error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { graphql } from "@/gql"
import type { ReleaseTracksFormQuery } from "@/gql/graphql"
import { creditedInput, creditedOption } from "@/lib/credited"
import { formatDuration } from "@/lib/format"

const ReleaseTracksFormQueryDocument = graphql(`
  query ReleaseTracksForm($id: ID!, $folder: String!, $withFolder: Boolean!) {
    release(id: $id) {
      id
      title
      variousArtists
      artists {
        artist {
          id
        }
        creditedAs {
          name
          language
        }
      }
      discTitles {
        cdNumber
        title
      }
      tracks {
        id
        cdNumber
        trackNumber
        title
        durationMs
        file {
          id
          path
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
        features {
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
    trackSuggestions(folder: $folder) @include(if: $withFolder) {
      path
      cdNumber
      discTitle
      trackNumber
      title
      durationMs
      file {
        id
      }
      track {
        id
        release {
          id
          title
        }
      }
      artists {
        name
        artist {
          id
          name
        }
      }
    }
  }
`)

const SetReleaseTracks = graphql(`
  mutation SetReleaseTracks(
    $id: ID!
    $tracks: [ReleaseTrackInput!]!
    $discTitles: [DiscTitleInput!]!
  ) {
    setReleaseTracks(id: $id, tracks: $tracks, discTitles: $discTitles) {
      id
      discTitles {
        cdNumber
        title
      }
      tracks {
        id
        cdNumber
        trackNumber
        title
      }
    }
  }
`)

type TrackRow = {
  key: string
  /** A track the release has */
  id?: string
  /** A registered file, for a new track */
  fileId?: string
  path: string
  cdNumber: number
  trackNumber: number | ""
  title: string
  artists: Option[]
  features: Option[]
  durationMs: number | null
  /** Unchecked rows are skipped */
  include: boolean
  /** A row from the import's folder, which is unchecked instead of removed */
  fromFolder: boolean
  /** Why it can't be checked: it's another release's track */
  locked?: string
  /** Tag artist names with no matching artist yet */
  hint?: string
}

function initialRows(
  data: ReleaseTracksFormQuery,
  releaseId: string
): TrackRow[] {
  const rows: TrackRow[] = (data.release?.tracks ?? []).map((track) => ({
    key: `track-${track.id}`,
    id: track.id,
    fileId: track.file.id,
    path: track.file.path,
    cdNumber: track.cdNumber,
    trackNumber: track.trackNumber,
    title: track.title,
    artists: track.artists.map(creditedOption),
    features: track.features.map(creditedOption),
    durationMs: track.durationMs,
    include: true,
    fromFolder: false,
  }))
  // On a regular release, the release's artists perform a track with none
  // of its own, so tags naming them don't become track artists (design §7.6)
  const releaseArtists = new Set(
    data.release?.variousArtists
      ? []
      : (data.release?.artists ?? []).map((link) => link.artist.id)
  )
  for (const suggestion of data.trackSuggestions ?? []) {
    // Already one of this release's tracks: it has its row
    if (suggestion.track?.release.id === releaseId) continue
    const unmatched = suggestion.artists
      .filter((a) => !a.artist)
      .map((a) => a.name)
    rows.push({
      key: `path-${suggestion.path}`,
      fileId: suggestion.file?.id,
      path: suggestion.path,
      cdNumber: suggestion.cdNumber,
      trackNumber: suggestion.trackNumber,
      title: suggestion.title,
      artists: suggestion.artists.flatMap((a) =>
        a.artist && !releaseArtists.has(a.artist.id) ? [a.artist] : []
      ),
      features: [],
      durationMs: suggestion.durationMs ?? null,
      include: !suggestion.track,
      fromFolder: true,
      locked: suggestion.track
        ? `Already a track on ${suggestion.track.release.title}`
        : undefined,
      hint: unmatched.length ? `Tags: ${unmatched.join(", ")}` : undefined,
    })
  }
  // Sorted once: rows don't move while their numbers are being typed
  return rows.sort(
    (a, b) =>
      a.cdNumber - b.cdNumber || Number(a.trackNumber) - Number(b.trackNumber)
  )
}

/** Titles by disc number: the release's, and else the folder's tags. */
function initialTitles(data: ReleaseTracksFormQuery): Record<number, string> {
  const titles: Record<number, string> = {}
  for (const { cdNumber, title } of data.release?.discTitles ?? []) {
    titles[cdNumber] = title
  }
  for (const { cdNumber, discTitle } of data.trackSuggestions ?? []) {
    if (discTitle && titles[cdNumber] === undefined) {
      titles[cdNumber] = discTitle
    }
  }
  return titles
}

/**
 * A release's tracks (design §7.6): a row each, in order. Saving deletes the
 * tracks whose rows were removed, not their files. With `folder` (the
 * import), there's also a row for each of its audio files that isn't a
 * track yet (design §7.9).
 */
export function ReleaseTracksForm({
  releaseId,
  folder,
  submitLabel = "Save",
  onSaved,
}: {
  releaseId: string
  folder?: string
  submitLabel?: string
  onSaved: () => void
}) {
  const { data, error } = useQuery(ReleaseTracksFormQueryDocument, {
    variables: {
      id: releaseId,
      folder: folder ?? "",
      withFolder: folder !== undefined,
    },
    // Rows start from what's on disk and in the database now
    fetchPolicy: "network-only",
  })

  if (error) return <QueryError error={error} title="Can't load the tracks" />
  if (!data) return <Skeleton className="h-64 w-full" />
  return (
    <Rows
      releaseId={releaseId}
      variousArtists={data.release?.variousArtists ?? false}
      initial={initialRows(data, releaseId)}
      initialTitles={initialTitles(data)}
      submitLabel={submitLabel}
      onSaved={onSaved}
    />
  )
}

function Rows({
  releaseId,
  variousArtists,
  initial,
  initialTitles,
  submitLabel,
  onSaved,
}: {
  releaseId: string
  variousArtists: boolean
  initial: TrackRow[]
  initialTitles: Record<number, string>
  submitLabel: string
  onSaved: () => void
}) {
  const [rows, setRows] = useState(initial)
  const [titles, setTitles] = useState(initialTitles)
  const [pickerKey, setPickerKey] = useState(0)
  const [save, { loading, error }] = useMutation(SetReleaseTracks)
  const edit = (key: string, changes: Partial<TrackRow>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row))
    )
  const included = rows.filter((row) => row.include)
  // A title field for each disc the saved tracks will be on
  const discs = [...new Set(included.map((row) => row.cdNumber))]
    .filter((disc) => Number.isInteger(disc) && disc > 0)
    .sort((a, b) => a - b)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault()
        try {
          await save({
            variables: {
              id: releaseId,
              tracks: included.map((row) => ({
                id: row.id,
                fileId: row.id ? undefined : row.fileId,
                path: row.id || row.fileId ? undefined : row.path,
                cdNumber: row.cdNumber,
                trackNumber: Number(row.trackNumber),
                title: row.title,
                artists: creditedInput(row.artists),
                features: creditedInput(row.features),
              })),
              discTitles: discs.map((disc) => ({
                cdNumber: disc,
                title: titles[disc] ?? "",
              })),
            },
          })
          onSaved()
        } catch {
          // The form shows the error
        }
      }}
    >
      <p className="text-xs text-muted-foreground">
        {variousArtists
          ? "A various-artists release: give each track its own artists."
          : "On a regular release, leave artists empty and the release's artists perform the track."}
      </p>
      {error && <QueryError error={error} title="Can't save the tracks" />}
      {discs.length > 0 && (
        <fieldset className="flex max-w-2xl flex-col gap-2">
          <legend className="mb-2 font-medium">Disc titles</legend>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            {discs.map((disc) => (
              <Fragment key={disc}>
                <Label htmlFor={`disc-title-${disc}`}>Disc {disc}</Label>
                <Input
                  id={`disc-title-${disc}`}
                  placeholder="No title"
                  value={titles[disc] ?? ""}
                  onChange={(e) =>
                    setTitles((current) => ({
                      ...current,
                      [disc]: e.target.value,
                    }))
                  }
                />
              </Fragment>
            ))}
          </div>
        </fieldset>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Disc</TableHead>
            <TableHead>No.</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Artists</TableHead>
            <TableHead>Features</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const off = !row.include
            return (
              <TableRow
                key={row.key}
                className={off ? "opacity-60" : undefined}
              >
                {/* Top-aligned, so a hint or chips don't push the row's inputs
                    down; non-inputs are centered on the inputs' h-8 line */}
                <TableCell className="align-top">
                  <div className="flex h-8 items-center">
                    {row.fromFolder ? (
                      <Checkbox
                        aria-label={`Include ${row.path}`}
                        checked={row.include}
                        disabled={!!row.locked}
                        onCheckedChange={(include) =>
                          edit(row.key, { include })
                        }
                      />
                    ) : (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Remove ${row.title}`}
                        onClick={() =>
                          setRows((current) =>
                            current.filter((r) => r.key !== row.key)
                          )
                        }
                      >
                        <XIcon />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    aria-label="Disc"
                    type="number"
                    min={1}
                    className="w-14"
                    disabled={off}
                    value={row.cdNumber}
                    onChange={(e) =>
                      edit(row.key, { cdNumber: Number(e.target.value) })
                    }
                  />
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    aria-label="Number"
                    type="number"
                    min={1}
                    required={row.include}
                    className="w-16"
                    disabled={off}
                    value={row.trackNumber}
                    onChange={(e) =>
                      edit(row.key, {
                        trackNumber:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    aria-label="Title"
                    required={row.include}
                    className="min-w-48"
                    disabled={off}
                    value={row.title}
                    onChange={(e) => edit(row.key, { title: e.target.value })}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <ChipList
                    items={row.artists}
                    disabled={off}
                    onChange={(artists) => edit(row.key, { artists })}
                    picker={(p) => <ArtistPicker {...p} />}
                    credited
                  />
                  {row.hint && (
                    <p className="mt-1 text-muted-foreground">{row.hint}</p>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <ChipList
                    items={row.features}
                    disabled={off}
                    onChange={(features) => edit(row.key, { features })}
                    picker={(p) => <ArtistPicker {...p} />}
                    credited
                  />
                </TableCell>
                <TableCell className="text-right align-top leading-8 tabular-nums">
                  {formatDuration(row.durationMs)}
                </TableCell>
                <TableCell className="align-top">
                  <div className="font-mono leading-8">{row.path}</div>
                  {row.locked && (
                    <p className="text-muted-foreground">{row.locked}</p>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex items-end gap-4">
        <div key={pickerKey} className="w-96">
          <FilePicker
            type="music"
            withoutTrack
            placeholder="Add track: a registered audio file"
            value={null}
            exclude={rows.flatMap((row) => (row.fileId ? [row.fileId] : []))}
            onChange={(file) => {
              if (!file) return
              const last = Math.max(
                0,
                ...rows
                  .filter((r) => r.cdNumber === 1)
                  .map((r) => Number(r.trackNumber) || 0)
              )
              const name = file.name.split("/").pop() ?? file.name
              setRows((current) => [
                ...current,
                {
                  key: `file-${file.id}`,
                  fileId: file.id,
                  path: file.name,
                  cdNumber: 1,
                  trackNumber: last + 1,
                  title: name
                    .replace(/\.[^.]+$/, "")
                    .replace(/^\d+[\s._-]+/, ""),
                  artists: [],
                  features: [],
                  durationMs: null,
                  include: true,
                  fromFolder: false,
                },
              ])
              setPickerKey((key) => key + 1)
            }}
          />
        </div>
        <Button type="submit" disabled={loading} className="ml-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
