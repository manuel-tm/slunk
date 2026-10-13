import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { ButtonLink } from "@/components/button-link"
import { PageHeader } from "@/components/page-header"
import type { Option } from "@/components/picker"
import { FilePicker } from "@/components/pickers"
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

const LabelFormQuery = graphql(`
  query LabelForm($id: ID!) {
    label(id: $id) {
      id
      name
      picture {
        id
        path
      }
    }
  }
`)

const CreateLabel = graphql(`
  mutation CreateLabel($input: LabelInput!) {
    createLabel(input: $input) {
      id
    }
  }
`)

const UpdateLabel = graphql(`
  mutation UpdateLabel($id: ID!, $input: LabelInput!) {
    updateLabel(id: $id, input: $input) {
      id
      name
      picture {
        id
      }
    }
  }
`)

/** `/labels/create` and `/labels/:id/update`: name and logo. */
export function LabelForm() {
  const { id } = useParams()
  const { data, error } = useQuery(LabelFormQuery, {
    variables: { id: id ?? "" },
    skip: id === undefined,
  })

  if (data && !data.label) return <NotFound />
  const label = data?.label

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Labels", to: "/labels" },
          ...(id
            ? [
                {
                  label: label ? `${label.name} (${label.id})` : id,
                  to: `/labels/${id}`,
                },
                { label: "Update" },
              ]
            : [{ label: "New" }]),
        ]}
      />
      <div className="max-w-xl p-4">
        {error ? (
          <QueryError error={error} title="Can't load the label" />
        ) : id && !label ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Form
            id={id}
            initialName={label?.name ?? ""}
            initialPicture={
              label?.picture
                ? { id: label.picture.id, name: label.picture.path }
                : null
            }
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
}: {
  id?: string
  initialName: string
  initialPicture: Option | null
}) {
  const navigate = useNavigate()
  const [name, setName] = useState(initialName)
  const [picture, setPicture] = useState(initialPicture)
  const [create, created] = useMutation(CreateLabel)
  const [update, updated] = useMutation(UpdateLabel)
  const error = created.error ?? updated.error

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        const input = { name, pictureId: picture?.id ?? null }
        try {
          const saved = id
            ? (await update({ variables: { id, input } })).data!.updateLabel
            : (await create({ variables: { input } })).data!.createLabel
          navigate(`/labels/${saved.id}`)
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
          <FieldDescription>
            As printed on the sleeve. Two labels can share a name.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="logo">Logo</FieldLabel>
          <FilePicker
            id="logo"
            type="image"
            value={picture}
            onChange={setPicture}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={created.loading || updated.loading}>
            Save
          </Button>
          <ButtonLink variant="outline" to={id ? `/labels/${id}` : "/labels"}>
            Cancel
          </ButtonLink>
        </div>
      </FieldGroup>
    </form>
  )
}
