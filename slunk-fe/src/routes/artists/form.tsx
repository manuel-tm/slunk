import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { ButtonLink } from "@/components/button-link"
import {
  type FileLinkRow,
  FileLinksEditor,
  fileLinksInput,
} from "@/components/file-links-editor"
import { PageHeader } from "@/components/page-header"
import type { Option } from "@/components/picker"
import { FilePicker } from "@/components/pickers"
import { QueryError } from "@/components/query-error"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import { NotFound } from "@/routes/not-found"

const ArtistFormQuery = graphql(`
  query ArtistForm($id: ID!) {
    artist(id: $id) {
      id
      name
      picture {
        id
        path
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

const CreateArtist = graphql(`
  mutation CreateArtist($input: ArtistInput!) {
    createArtist(input: $input) {
      id
    }
  }
`)

const UpdateArtist = graphql(`
  mutation UpdateArtist($id: ID!, $input: ArtistInput!) {
    updateArtist(id: $id, input: $input) {
      id
      name
    }
  }
`)

/** `/artists/create` and `/artists/:id/update` (design §7.7). */
export function ArtistForm() {
  const { id } = useParams()
  const { data, error } = useQuery(ArtistFormQuery, {
    variables: { id: id ?? "" },
    skip: id === undefined,
  })

  if (data && !data.artist) return <NotFound />
  const artist = data?.artist

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Artists", to: "/artists" },
          ...(id
            ? [
                {
                  label: artist ? `${artist.name} (${artist.id})` : id,
                  to: `/artists/${id}`,
                },
                { label: "Update" },
              ]
            : [{ label: "New" }]),
        ]}
      />
      <div className="max-w-2xl p-4">
        {error ? (
          <QueryError error={error} title="Can't load the artist" />
        ) : id && !artist ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Form
            id={id}
            initialName={artist?.name ?? ""}
            initialPicture={
              artist?.picture
                ? { id: artist.picture.id, name: artist.picture.path }
                : null
            }
            initialLinks={(artist?.files ?? []).map((link) => ({
              file: { id: link.file.id, name: link.file.path },
              note: link.note ?? "",
            }))}
          />
        )}
      </div>
    </>
  )
}

function Form({
  id,
  initialName,
  initialPicture,
  initialLinks,
}: {
  id?: string
  initialName: string
  initialPicture: Option | null
  initialLinks: FileLinkRow[]
}) {
  const navigate = useNavigate()
  const [name, setName] = useState(initialName)
  const [picture, setPicture] = useState(initialPicture)
  const [links, setLinks] = useState(initialLinks)
  const [create, created] = useMutation(CreateArtist)
  const [update, updated] = useMutation(UpdateArtist)
  const error = created.error ?? updated.error

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        const input = {
          name,
          pictureId: picture?.id ?? null,
          files: fileLinksInput(links),
        }
        try {
          const saved = id
            ? (await update({ variables: { id, input } })).data!.updateArtist
            : (await create({ variables: { input } })).data!.createArtist
          navigate(`/artists/${saved.id}`)
        } catch {
          // The form shows the error
        }
      }}
    >
      <FieldGroup>
        {error && <QueryError error={error} title="Can't save" />}
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="picture">Picture</FieldLabel>
          <FilePicker
            id="picture"
            type="image"
            value={picture}
            onChange={setPicture}
          />
        </Field>
        <Field>
          <FieldLabel>Linked files</FieldLabel>
          <FileLinksEditor links={links} onChange={setLinks} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={created.loading || updated.loading}>
            Save
          </Button>
          <ButtonLink variant="outline" to={id ? `/artists/${id}` : "/artists"}>
            Cancel
          </ButtonLink>
        </div>
      </FieldGroup>
    </form>
  )
}
