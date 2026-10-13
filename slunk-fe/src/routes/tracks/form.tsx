import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"

import { ButtonLink } from "@/components/button-link"
import { type CreditRow, CreditsEditor } from "@/components/credits-editor"
import {
  type FileLinkRow,
  FileLinksEditor,
  fileLinksInput,
} from "@/components/file-links-editor"
import { OrderedList } from "@/components/ordered-list"
import { PageHeader } from "@/components/page-header"
import type { Option } from "@/components/picker"
import { ArtistPicker, FilePicker, ReleasePicker } from "@/components/pickers"
import { QueryError } from "@/components/query-error"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import { NotFound } from "@/routes/not-found"

const TrackFormQuery = graphql(`
  query TrackForm(
    $id: ID!
    $isEdit: Boolean!
    $releaseId: ID!
    $withRelease: Boolean!
    $fileId: ID!
    $withFile: Boolean!
  ) {
    track(id: $id) @include(if: $isEdit) {
      id
      title
      cdNumber
      trackNumber
      release {
        id
        name: title
      }
      file {
        id
        name: path
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
      files {
        note
        file {
          id
          name: path
        }
      }
    }
    prefillRelease: release(id: $releaseId) @include(if: $withRelease) {
      id
      name: title
    }
    prefillFile: file(id: $fileId) @include(if: $withFile) {
      id
      name: path
      fileName: name
    }
  }
`)

const CreateTrack = graphql(`
  mutation CreateTrack($input: TrackInput!) {
    createTrack(input: $input) {
      id
    }
  }
`)

const UpdateTrack = graphql(`
  mutation UpdateTrack($id: ID!, $input: TrackInput!) {
    updateTrack(id: $id, input: $input) {
      id
      title
    }
  }
`)

type Values = {
  release: Option | null
  file: Option | null
  cdNumber: number
  trackNumber: number | ""
  title: string
  artists: Option[]
  features: Option[]
  credits: CreditRow[]
  links: FileLinkRow[]
}

/**
 * `/tracks/create` and `/tracks/:id/update` (design §7.8). `?release=` and
 * `?file=` prefill a new track.
 */
export function TrackForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const releaseId = params.get("release")
  const fileId = params.get("file")
  const { data, error } = useQuery(TrackFormQuery, {
    variables: {
      id: id ?? "",
      isEdit: id !== undefined,
      releaseId: releaseId ?? "",
      withRelease: releaseId !== null,
      fileId: fileId ?? "",
      withFile: fileId !== null,
    },
  })

  if (id && data && !data.track) return <NotFound />
  const track = data?.track

  const initial: Values | null = !data
    ? null
    : track
      ? {
          release: track.release,
          file: track.file,
          cdNumber: track.cdNumber,
          trackNumber: track.trackNumber,
          title: track.title,
          artists: track.artists,
          features: track.features,
          credits: track.credits,
          links: track.files.map((link) => ({
            file: link.file,
            note: link.note ?? "",
          })),
        }
      : {
          release: data.prefillRelease ?? null,
          file: data.prefillFile ?? null,
          cdNumber: 1,
          trackNumber: "",
          title:
            data.prefillFile?.fileName
              .replace(/\.[^.]+$/, "")
              .replace(/^\d+[\s._-]+/, "") ?? "",
          artists: [],
          features: [],
          credits: [],
          links: [],
        }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Tracks", to: "/tracks" },
          ...(id
            ? [
                {
                  label: track ? `${track.title} (${track.id})` : id,
                  to: `/tracks/${id}`,
                },
                { label: "Update" },
              ]
            : [{ label: "New" }]),
        ]}
      />
      <div className="max-w-2xl p-4">
        {error ? (
          <QueryError error={error} title="Can't load the track" />
        ) : !initial ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Form id={id} initial={initial} />
        )}
      </div>
    </>
  )
}

function Form({ id, initial }: { id?: string; initial: Values }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const set = (changes: Partial<Values>) =>
    setValues((v) => ({ ...v, ...changes }))
  const [create, created] = useMutation(CreateTrack)
  const [update, updated] = useMutation(UpdateTrack)
  const error = created.error ?? updated.error

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        if (!values.release || !values.file || values.trackNumber === "") return
        const input = {
          releaseId: values.release.id,
          fileId: values.file.id,
          cdNumber: values.cdNumber,
          trackNumber: values.trackNumber,
          title: values.title,
          artistIds: values.artists.map((a) => a.id),
          featureIds: values.features.map((a) => a.id),
          credits: values.credits.map((c) => ({
            roleId: c.role.id,
            artistId: c.artist.id,
          })),
          files: fileLinksInput(values.links),
        }
        try {
          const saved = id
            ? (await update({ variables: { id, input } })).data!.updateTrack
            : (await create({ variables: { input } })).data!.createTrack
          navigate(`/tracks/${saved.id}`)
        } catch {
          // The form shows the error
        }
      }}
    >
      <FieldGroup>
        {error && <QueryError error={error} title="Can't save" />}
        <Field>
          <FieldLabel htmlFor="release">Release</FieldLabel>
          <ReleasePicker
            id="release"
            value={values.release}
            onChange={(release) => set({ release })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="file">Audio file</FieldLabel>
          <FilePicker
            id="file"
            type="music"
            withoutTrack
            value={values.file}
            onChange={(file) => set({ file })}
          />
          <FieldDescription>
            A registered audio file that isn't a track yet. Its duration is read
            from it.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-[6rem_6rem_1fr] gap-4">
          <Field>
            <FieldLabel htmlFor="disc">Disc</FieldLabel>
            <Input
              id="disc"
              type="number"
              min={1}
              required
              value={values.cdNumber}
              onChange={(e) => set({ cdNumber: Number(e.target.value) })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="number">Number</FieldLabel>
            <Input
              id="number"
              type="number"
              min={1}
              required
              value={values.trackNumber}
              onChange={(e) =>
                set({
                  trackNumber:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              required
              value={values.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel>Artists</FieldLabel>
          <OrderedList
            items={values.artists}
            onChange={(artists) => set({ artists })}
            picker={(p) => <ArtistPicker {...p} />}
          />
          <FieldDescription>
            Who performs it. On a regular release, leave it empty and the
            release's artists perform it.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Features</FieldLabel>
          <OrderedList
            items={values.features}
            onChange={(features) => set({ features })}
            picker={(p) => <ArtistPicker {...p} />}
          />
        </Field>
        <Field>
          <FieldLabel>Credits</FieldLabel>
          <CreditsEditor
            credits={values.credits}
            onChange={(credits) => set({ credits })}
          />
        </Field>
        <Field>
          <FieldLabel>Linked files</FieldLabel>
          <FileLinksEditor
            links={values.links}
            onChange={(links) => set({ links })}
          />
        </Field>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={
              created.loading ||
              updated.loading ||
              !values.release ||
              !values.file
            }
          >
            Save
          </Button>
          <ButtonLink variant="outline" to={id ? `/tracks/${id}` : "/tracks"}>
            Cancel
          </ButtonLink>
        </div>
      </FieldGroup>
    </form>
  )
}
