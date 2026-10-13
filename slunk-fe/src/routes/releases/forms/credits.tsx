import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"

import { type CreditRow, CreditsEditor } from "@/components/credits-editor"
import { QueryError } from "@/components/query-error"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"

const ReleaseCreditsFormQuery = graphql(`
  query ReleaseCreditsForm($id: ID!) {
    release(id: $id) {
      id
      title
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
      tracks {
        id
        cdNumber
        trackNumber
        title
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

const SetReleaseCredits = graphql(`
  mutation SetReleaseCredits($id: ID!, $input: ReleaseCreditsInput!) {
    setReleaseCredits(id: $id, input: $input) {
      id
    }
  }
`)

type Track = { id: string; label: string; credits: CreditRow[] }

/** The release's credits, then each track's, as rows of role and artist. */
export function ReleaseCreditsForm({
  releaseId,
  submitLabel = "Save",
  onSaved,
}: {
  releaseId: string
  submitLabel?: string
  onSaved: () => void
}) {
  const { data, error } = useQuery(ReleaseCreditsFormQuery, {
    variables: { id: releaseId },
    fetchPolicy: "network-only",
  })

  if (error) return <QueryError error={error} title="Can't load the credits" />
  if (!data?.release) return <Skeleton className="h-64 w-full" />
  const discs = new Set(data.release.tracks.map((t) => t.cdNumber)).size
  return (
    <Form
      releaseId={releaseId}
      initialCredits={data.release.credits}
      initialTracks={data.release.tracks.map((track) => ({
        id: track.id,
        label: `${discs > 1 ? `${track.cdNumber}-` : ""}${track.trackNumber}. ${track.title}`,
        credits: track.credits,
      }))}
      submitLabel={submitLabel}
      onSaved={onSaved}
    />
  )
}

function Form({
  releaseId,
  initialCredits,
  initialTracks,
  submitLabel,
  onSaved,
}: {
  releaseId: string
  initialCredits: CreditRow[]
  initialTracks: Track[]
  submitLabel: string
  onSaved: () => void
}) {
  const [credits, setCredits] = useState(initialCredits)
  const [tracks, setTracks] = useState(initialTracks)
  const [save, { loading, error }] = useMutation(SetReleaseCredits)
  const input = (rows: CreditRow[]) =>
    rows.map((row) => ({ artistId: row.artist.id, roleId: row.role.id }))

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={async (event) => {
        event.preventDefault()
        try {
          await save({
            variables: {
              id: releaseId,
              input: {
                credits: input(credits),
                tracks: tracks.map((t) => ({
                  trackId: t.id,
                  credits: input(t.credits),
                })),
              },
            },
          })
          onSaved()
        } catch {
          // The form shows the error
        }
      }}
    >
      {error && <QueryError error={error} title="Can't save the credits" />}
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-semibold">Release</h2>
        <CreditsEditor credits={credits} onChange={setCredits} />
      </section>
      {tracks.map((track) => (
        <section key={track.id} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium">{track.label}</h2>
          <CreditsEditor
            credits={track.credits}
            onChange={(rows) =>
              setTracks((current) =>
                current.map((t) =>
                  t.id === track.id ? { ...t, credits: rows } : t
                )
              )
            }
          />
        </section>
      ))}
      <div>
        <Button type="submit" disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
