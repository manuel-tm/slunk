import { useMutation, useQuery } from "@apollo/client/react"
import { PauseIcon, PlayIcon } from "lucide-react"
import { type ReactNode, useRef, useState } from "react"
import { Link, useParams } from "react-router"

import { ButtonLink } from "@/components/button-link"
import { Cover } from "@/components/cover"
import { CreditLines } from "@/components/credit-lines"
import { DeleteButton } from "@/components/delete-button"
import { artistUrl, labelUrl, Names } from "@/components/names"
import { PageHeader } from "@/components/page-header"
import { QueryError } from "@/components/query-error"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import type { ReleaseQuery } from "@/gql/graphql"
import { formatDuration, formatReleased } from "@/lib/format"
import { formatTagValue, tagValueUrl } from "@/lib/tags"
import { NotFound } from "@/routes/not-found"

const ReleaseQueryDocument = graphql(`
  query Release($id: ID!) {
    release(id: $id) {
      id
      title
      released
      catalogNumber
      variousArtists
      fileCount
      durationMs
      blockers
      cover {
        id
      }
      artists {
        id
        name
      }
      labels {
        id
        name
      }
      formats {
        id
        name
      }
      media {
        id
        name
      }
      credits {
        role {
          id
          name
        }
        artist {
          id
          name
        }
      }
      tags {
        tag {
          id
          type
          name
        }
        values
      }
      tracks {
        id
        title
        durationMs
        cdNumber
        trackNumber
        file {
          id
        }
        artists {
          id
          name
        }
        features {
          id
          name
        }
        credits {
          role {
            id
            name
          }
          artist {
            id
            name
          }
        }
      }
    }
  }
`)

const DeleteRelease = graphql(`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`)

type Release = NonNullable<ReleaseQuery["release"]>

// The browser remembers whether credits are hidden (design §7.6)
const HIDE_CREDITS = "slunk.release.hideCredits"

function readHideCredits() {
  try {
    return localStorage.getItem(HIDE_CREDITS) === "1"
  } catch {
    return false
  }
}

/** `/releases/:id`, laid out like a Discogs release page (design §7.6). */
export function ReleasePage() {
  const { id = "" } = useParams()
  const { data, error } = useQuery(ReleaseQueryDocument, { variables: { id } })
  const [deleteRelease] = useMutation(DeleteRelease, { variables: { id } })

  if (data && !data.release) return <NotFound />
  const release = data?.release

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Releases", to: "/releases" },
          { label: release ? `${release.title} (${release.id})` : id },
        ]}
      >
        {release && (
          <>
            <ButtonLink variant="outline" to={`/releases/${id}/update`}>
              Edit
            </ButtonLink>
            <DeleteButton
              name={release.title}
              blockers={release.blockers}
              detail="Its artists, labels, formats, media, credits, tags and file links go with it. Its files stay registered."
              onDelete={() => deleteRelease()}
              then="/releases"
            />
          </>
        )}
      </PageHeader>
      <div className="flex max-w-5xl flex-col gap-8 p-4 text-xs">
        {error ? (
          <QueryError error={error} title="Can't load the release" />
        ) : !release ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <Heading release={release} />
            <Tracklist release={release} />
            {release.credits.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="font-heading text-base font-semibold">
                  Credits
                </h2>
                <CreditLines credits={release.credits} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}

function Heading({ release }: { release: Release }) {
  const filterLinks = (items: { id: string; name: string }[], filter: string) =>
    items.map((item, index) => (
      <span key={item.id}>
        {index > 0 && ", "}
        <Link to={`/releases?${filter}=${item.id}`} className="hover:underline">
          {item.name}
        </Link>
      </span>
    ))

  // A row with nothing in it is hidden. Tags come last, a row each.
  const facts: [string, ReactNode][] = [
    [
      "Label",
      (release.labels.length > 0 || release.catalogNumber) && (
        <>
          <Names items={release.labels} to={labelUrl} commas />
          {release.catalogNumber && <> – {release.catalogNumber}</>}
        </>
      ),
    ],
    [
      "Format",
      release.formats.length > 0 && filterLinks(release.formats, "format"),
    ],
    ["Media", release.media.length > 0 && filterLinks(release.media, "medium")],
    ["Released", formatReleased(release.released)],
    ...release.tags.map(({ tag, values }): [string, ReactNode] => [
      tag.name,
      values.map((value, index) => (
        <span key={value}>
          {index > 0 && ", "}
          <Link
            to={tagValueUrl(tag.type, tag.id, value)}
            className="hover:underline"
          >
            {formatTagValue(tag.type, value)}
          </Link>
        </span>
      )),
    ]),
  ]

  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex w-48 flex-col gap-1">
        <Cover
          file={release.cover}
          alt={`${release.title} cover`}
          className="w-48"
        />
        <Link to={`/releases/${release.id}/files`} className="hover:underline">
          Files ({release.fileCount})
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold">
          {release.artists.length > 0 && (
            <>
              <Names items={release.artists} to={artistUrl} /> –{" "}
            </>
          )}
          {release.title}
        </h1>
        <dl className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-2 gap-y-1">
          {facts
            .filter(([, value]) => value)
            .map(([label, value], index) => (
              // Labels can repeat, since a tag can be named "Format"
              <div key={index} className="contents">
                <dt className="text-muted-foreground">{label}:</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  )
}

/**
 * Grouped by disc. On a various-artists release, each row starts with the
 * track's artists; a regular release only shows features.
 */
function Tracklist({ release }: { release: Release }) {
  const [hideCredits, setHideCredits] = useState(readHideCredits)
  const [playing, setPlaying] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const discs = [...new Set(release.tracks.map((track) => track.cdNumber))]

  function toggleCredits() {
    const next = !hideCredits
    setHideCredits(next)
    try {
      localStorage.setItem(HIDE_CREDITS, next ? "1" : "0")
    } catch {
      // Remembering is a convenience
    }
  }

  function play(track: Release["tracks"][number]) {
    const element = audio.current
    if (!element) return
    if (playing === track.id) {
      element.pause()
      setPlaying(null)
      return
    }
    element.src = `/raw/files/${track.file.id}`
    void element.play()
    setPlaying(track.id)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">Tracklist</h2>
        {release.tracks.some((track) => track.credits.length > 0) && (
          <Button variant="ghost" size="sm" onClick={toggleCredits}>
            {hideCredits ? "Show credits" : "Hide credits"}
          </Button>
        )}
      </div>
      <audio ref={audio} onEnded={() => setPlaying(null)} className="hidden" />
      {release.tracks.length === 0 && (
        <p className="text-muted-foreground">
          No tracks yet. Add them from Edit, Tracks.
        </p>
      )}
      {discs.map((disc) => (
        <div key={disc} className="flex flex-col">
          {discs.length > 1 && (
            <h3 className="border-b py-1 font-medium text-muted-foreground">
              CD {disc}
            </h3>
          )}
          {release.tracks
            .filter((track) => track.cdNumber === disc)
            .map((track) => (
              <div
                key={track.id}
                className="grid grid-cols-[2rem_1fr_auto_auto] items-start gap-2 border-b py-1.5"
              >
                <span className="text-muted-foreground tabular-nums">
                  {track.trackNumber}
                </span>
                <div className="flex flex-col gap-1">
                  <span>
                    {release.variousArtists && track.artists.length > 0 && (
                      <>
                        <Names items={track.artists} to={artistUrl} /> –{" "}
                      </>
                    )}
                    <Link
                      to={`/tracks/${track.id}`}
                      className="hover:underline"
                    >
                      {track.title}
                    </Link>
                    {track.features.length > 0 && (
                      <>
                        {" "}
                        (feat. <Names items={track.features} to={artistUrl} />)
                      </>
                    )}
                  </span>
                  {!hideCredits && track.credits.length > 0 && (
                    <div className="pl-4">
                      <CreditLines credits={track.credits} />
                    </div>
                  )}
                </div>
                <span className="tabular-nums">
                  {formatDuration(track.durationMs)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={
                    playing === track.id
                      ? `Pause ${track.title}`
                      : `Play ${track.title}`
                  }
                  onClick={() => play(track)}
                >
                  {playing === track.id ? <PauseIcon /> : <PlayIcon />}
                </Button>
              </div>
            ))}
        </div>
      ))}
      {release.durationMs !== null && release.tracks.length > 0 && (
        <p className="text-right">
          <span className="text-muted-foreground">Total </span>
          <span className="tabular-nums">
            {formatDuration(release.durationMs)}
          </span>
        </p>
      )}
    </section>
  )
}
