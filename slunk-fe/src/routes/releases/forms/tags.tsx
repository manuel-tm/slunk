import { useMutation, useQuery } from "@apollo/client/react"
import { XIcon } from "lucide-react"
import { useState } from "react"

import { ChipList } from "@/components/chip-list"
import type { PickerProps } from "@/components/picker"
import {
  type TagOption,
  TagPicker,
  TagValuePicker,
  tagOption,
} from "@/components/pickers"
import { QueryError } from "@/components/query-error"
import { TagValueInput } from "@/components/tag-value-input"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import type { TagType } from "@/gql/graphql"
import { TAG_PLACEHOLDERS, TAG_TYPE_LABELS, tagValueKey } from "@/lib/tags"
import { NotFound } from "@/routes/not-found"

const ReleaseTagsFormQuery = graphql(`
  query ReleaseTagsForm($id: ID!) {
    release(id: $id) {
      id
      tags {
        tag {
          id
          type
          name
          multiple
        }
        values
      }
    }
  }
`)

const SetReleaseTags = graphql(`
  mutation SetReleaseTags($id: ID!, $tags: [ReleaseTagInput!]!) {
    setReleaseTags(id: $id, tags: $tags) {
      id
      tags {
        tag {
          id
          type
          name
          multiple
        }
        values
      }
    }
  }
`)

type Row = { tag: TagOption; values: string[] }

/**
 * The tags set on a release, and a picker to add one (design §7.6). A
 * single-value tag is one input, and a multi-value tag is a list.
 */
export function ReleaseTagsForm({
  releaseId,
  submitLabel = "Save",
  onSaved,
}: {
  releaseId: string
  submitLabel?: string
  onSaved: () => void
}) {
  const { data, error } = useQuery(ReleaseTagsFormQuery, {
    variables: { id: releaseId },
    fetchPolicy: "network-only",
  })

  if (error) return <QueryError error={error} title="Can't load the tags" />
  if (!data) return <Skeleton className="h-64 w-full max-w-2xl" />
  if (!data.release) return <NotFound />
  return (
    <Form
      releaseId={releaseId}
      initial={data.release.tags.map(({ tag, values }) => ({
        tag: tagOption(tag),
        values,
      }))}
      submitLabel={submitLabel}
      onSaved={onSaved}
    />
  )
}

function Form({
  releaseId,
  initial,
  submitLabel,
  onSaved,
}: {
  releaseId: string
  initial: Row[]
  submitLabel: string
  onSaved: () => void
}) {
  const [rows, setRows] = useState(initial)
  // A new key clears the picker after each pick
  const [pickerKey, setPickerKey] = useState(0)
  const [save, { loading, error }] = useMutation(SetReleaseTags)
  const setValues = (index: number, values: string[]) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, values } : row))
    )

  return (
    <form
      className="flex max-w-2xl flex-col gap-6"
      onSubmit={async (event) => {
        event.preventDefault()
        try {
          await save({
            variables: {
              id: releaseId,
              tags: rows.map(({ tag, values }) => ({
                type: tag.type,
                tagId: tag.tagId,
                values,
              })),
            },
          })
          onSaved()
        } catch {
          // The form shows the error
        }
      }}
    >
      {error && <QueryError error={error} title="Can't save the tags" />}
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tags yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const id = `tag-${row.tag.type}-${row.tag.tagId}`
            return (
              <div
                key={row.tag.id}
                className="grid grid-cols-[10rem_1fr_auto] items-start gap-3"
              >
                <div className="flex flex-col pt-1.5">
                  <Label htmlFor={id}>{row.tag.name}</Label>
                  <span className="text-xs text-muted-foreground">
                    {TAG_TYPE_LABELS[row.tag.type]}
                    {row.tag.multiple && ", several values"}
                  </span>
                </div>
                {row.tag.multiple ? (
                  <ChipList
                    items={row.values.map((value) => ({
                      id: tagValueKey(value),
                      name: value,
                    }))}
                    onChange={(items) =>
                      setValues(
                        index,
                        items.map((item) => item.name)
                      )
                    }
                    picker={(props) =>
                      row.tag.type === "text" ? (
                        <TagValuePicker
                          {...props}
                          id={id}
                          tagId={row.tag.tagId}
                        />
                      ) : (
                        <ValueAdder {...props} id={id} type={row.tag.type} />
                      )
                    }
                  />
                ) : (
                  <div>
                    <TagValueInput
                      id={id}
                      type={row.tag.type}
                      tagId={row.tag.tagId}
                      value={row.values[0] ?? ""}
                      onValueChange={(value) => setValues(index, [value])}
                    />
                  </div>
                )}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="mt-1"
                  aria-label={`Remove ${row.tag.name}`}
                  onClick={() =>
                    setRows((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <XIcon />
                </Button>
              </div>
            )
          })}
        </div>
      )}
      <Field className="max-w-xs">
        <FieldLabel htmlFor="add-tag">Add a tag</FieldLabel>
        <div key={pickerKey}>
          <TagPicker
            id="add-tag"
            creatable
            value={null}
            exclude={rows.map((row) => row.tag.id)}
            onChange={(tag) => {
              if (!tag) return
              setRows((current) => [...current, { tag, values: [] }])
              setPickerKey((key) => key + 1)
            }}
          />
        </div>
      </Field>
      <div>
        <Button type="submit" disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Adds a number or date to a multi-value tag's list. */
function ValueAdder({ id, type, onChange }: PickerProps & { type: TagType }) {
  const [text, setText] = useState("")
  const add = () => {
    const value = text.trim()
    if (value) onChange({ id: tagValueKey(value), name: value })
  }
  return (
    <div className="flex gap-1">
      <Input
        id={id}
        inputMode={type === "number" ? "decimal" : undefined}
        placeholder={TAG_PLACEHOLDERS[type]}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter adds the value instead of saving the form
          if (e.key === "Enter") {
            e.preventDefault()
            add()
          }
        }}
      />
      <Button type="button" variant="outline" onClick={add}>
        Add
      </Button>
    </div>
  )
}
