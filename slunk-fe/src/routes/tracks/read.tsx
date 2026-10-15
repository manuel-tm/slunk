import { useMutation, useQuery } from "@apollo/client/react"
import { Link, useParams } from "react-router"

import { ButtonLink } from "@/components/button-link"
import { CreditLines } from "@/components/credit-lines"
import { DeleteButton } from "@/components/delete-button"
import { artistUrl, Names } from "@/components/names"
import { PageHeader } from "@/components/page-header"
import { QueryError } from "@/components/query-error"
import { TagValues } from "@/components/tag-values"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import { formatDuration } from "@/lib/format"
import { NotFound } from "@/routes/not-found"

const TrackQuery = graphql(`
  query Track($id: ID!) {
    track(id: $id) {
      id
      title
      durationMs
      cdNumber
      trackNumber
      release {
        id
        title
      }
      performers {
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
      file {
        id
        path
      }
      tags {
        tag {
          id
          type
          name
        }
        values
      }
      files {
        note
        file {
          id
          path
        }
      }
    }
  }
`)

const DeleteTrack = graphql(`
  mutation DeleteTrack($id: ID!) {
    deleteTrack(id: $id)
  }
`)

/** `/tracks/:id` (design §7.8) */
export function TrackRead() {
  const { id = "" } = useParams()
  const { data, error } = useQuery(TrackQuery, { variables: { id } })
  const [deleteTrack] = useMutation(DeleteTrack, {
    variables: { id },
    update: (cache) => {
      cache.evict({ id: cache.identify({ __typename: "Track", id }) })
      cache.gc()
    },
  })

  if (data && !data.track) return <NotFound />
  const track = data?.track

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Tracks", to: "/tracks" },
          { label: track ? `${track.title} (${track.id})` : id },
        ]}
      >
        {track && (
          <>
            <ButtonLink variant="outline" to={`/tracks/${id}/update`}>
              Edit
            </ButtonLink>
            <DeleteButton
              name={track.title}
              blockers={[]}
              detail="Its artists, credits and file links go with it. Its audio file stays registered."
              onDelete={() => deleteTrack()}
              then="/tracks"
            />
          </>
        )}
      </PageHeader>
      <div className="flex max-w-3xl flex-col gap-4 p-4 text-xs">
        {error ? (
          <QueryError error={error} title="Can't load the track" />
        ) : !track ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div>
              <h1 className="font-heading text-2xl font-semibold">
                {track.title}
              </h1>
              <p>
                {track.performers.length > 0 && (
                  <>
                    by <Names items={track.performers} to={artistUrl} />
                  </>
                )}
                {track.features.length > 0 && (
                  <>
                    {" "}
                    (feat. <Names items={track.features} to={artistUrl} />)
                  </>
                )}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Release</dt>
              <dd>
                <Link
                  to={`/releases/${track.release.id}`}
                  className="hover:underline"
                >
                  {track.release.title}
                </Link>
                , disc {track.cdNumber}, track {track.trackNumber}
              </dd>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="tabular-nums">
                {formatDuration(track.durationMs) || "Unknown"}
              </dd>
              <dt className="text-muted-foreground">Audio file</dt>
              <dd className="flex flex-col gap-2">
                <Link
                  to={`/files/${track.file.id}`}
                  className="font-mono break-all hover:underline"
                >
                  {track.file.path}
                </Link>
                <audio
                  controls
                  preload="metadata"
                  src={`/raw/files/${track.file.id}`}
                  className="w-full max-w-md"
                />
              </dd>
              {track.tags.map(({ tag, values }) => (
                <div key={`${tag.type}:${tag.id}`} className="contents">
                  <dt className="text-muted-foreground">{tag.name}</dt>
                  <dd>
                    <TagValues
                      type={tag.type}
                      tagId={tag.id}
                      values={values}
                      list="/tracks"
                    />
                  </dd>
                </div>
              ))}
              {track.credits.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Credits</dt>
                  <dd>
                    <CreditLines credits={track.credits} />
                  </dd>
                </>
              )}
              {track.files.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Linked files</dt>
                  <dd className="flex flex-col gap-1">
                    {track.files.map((link) => (
                      <span key={link.file.id}>
                        <Link
                          to={`/files/${link.file.id}`}
                          className="font-mono hover:underline"
                        >
                          {link.file.path}
                        </Link>
                        {link.note && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {link.note}
                          </span>
                        )}
                      </span>
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </>
        )}
      </div>
    </>
  )
}
