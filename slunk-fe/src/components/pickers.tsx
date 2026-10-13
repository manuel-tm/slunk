// A picker for each kind of row, searching the backend as the user types.
// Each one owns its query, so it stays typed; they share the Picker view.
import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"

import { Picker, type PickerProps } from "@/components/picker"
import { graphql } from "@/gql"
import type { FileType, ListKind } from "@/gql/graphql"
import { useDebounced } from "@/hooks/use-debounced"

// Pickers return the first 20 matches (design §7.3)
const LIMIT = 20

const ArtistOptions = graphql(`
  query ArtistOptions($q: String, $perPage: Int!) {
    artists(q: $q, perPage: $perPage, sort: "name") {
      items {
        id
        name
      }
    }
  }
`)

const CreateArtistOption = graphql(`
  mutation CreateArtistOption($name: String!) {
    createArtist(input: { name: $name }) {
      id
      name
    }
  }
`)

export function ArtistPicker(props: PickerProps) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const { data } = useQuery(ArtistOptions, { variables: { q, perPage: LIMIT } })
  const [create] = useMutation(CreateArtistOption)
  return (
    <Picker
      {...props}
      noun="artist"
      query={query}
      onQuery={setQuery}
      options={data?.artists.items ?? []}
      onCreate={async (name) =>
        (await create({ variables: { name } })).data!.createArtist
      }
    />
  )
}

const LabelOptions = graphql(`
  query LabelOptions($q: String, $perPage: Int!) {
    labels(q: $q, perPage: $perPage, sort: "name") {
      items {
        id
        name
      }
    }
  }
`)

const CreateLabelOption = graphql(`
  mutation CreateLabelOption($name: String!) {
    createLabel(input: { name: $name }) {
      id
      name
    }
  }
`)

export function LabelPicker(props: PickerProps) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const { data } = useQuery(LabelOptions, { variables: { q, perPage: LIMIT } })
  const [create] = useMutation(CreateLabelOption)
  return (
    <Picker
      {...props}
      noun="label"
      query={query}
      onQuery={setQuery}
      options={data?.labels.items ?? []}
      onCreate={async (name) =>
        (await create({ variables: { name } })).data!.createLabel
      }
    />
  )
}

const ListItemOptions = graphql(`
  query ListItemOptions($kind: ListKind!, $q: String, $perPage: Int!) {
    listItems(kind: $kind, q: $q, perPage: $perPage, sort: "name") {
      items {
        id
        name
      }
    }
  }
`)

const CreateListItemOption = graphql(`
  mutation CreateListItemOption($kind: ListKind!, $name: String!) {
    createListItem(kind: $kind, name: $name) {
      id
      name
    }
  }
`)

export const LIST_NOUNS: Record<ListKind, string> = {
  release_formats: "format",
  release_media: "medium",
  credit_roles: "role",
}

/** A release format, release medium or credit role. */
export function ListItemPicker({
  kind,
  ...props
}: PickerProps & { kind: ListKind }) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const { data } = useQuery(ListItemOptions, {
    variables: { kind, q, perPage: LIMIT },
  })
  const [create] = useMutation(CreateListItemOption)
  return (
    <Picker
      {...props}
      noun={LIST_NOUNS[kind]}
      query={query}
      onQuery={setQuery}
      options={data?.listItems.items ?? []}
      onCreate={async (name) =>
        (await create({ variables: { kind, name } })).data!.createListItem
      }
    />
  )
}

const ReleaseOptions = graphql(`
  query ReleaseOptions($q: String, $perPage: Int!) {
    releases(q: $q, perPage: $perPage, sort: "title") {
      items {
        id
        name: title
      }
    }
  }
`)

export function ReleasePicker(props: PickerProps) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const { data } = useQuery(ReleaseOptions, {
    variables: { q, perPage: LIMIT },
  })
  return (
    <Picker
      {...props}
      noun="release"
      query={query}
      onQuery={setQuery}
      options={data?.releases.items ?? []}
    />
  )
}

const FileOptions = graphql(`
  query FileOptions(
    $q: String
    $perPage: Int!
    $type: FileType
    $withoutTrack: Boolean
  ) {
    files(
      q: $q
      perPage: $perPage
      type: $type
      withoutTrack: $withoutTrack
      sort: "path"
    ) {
      items {
        id
        name: path
      }
    }
  }
`)

/** A registered file, searched by path. Files can't be created here. */
export function FilePicker({
  type,
  withoutTrack,
  ...props
}: PickerProps & { type?: FileType; withoutTrack?: boolean }) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const { data } = useQuery(FileOptions, {
    variables: { q, perPage: LIMIT, type, withoutTrack },
  })
  return (
    <Picker
      {...props}
      noun={
        type === "image" ? "image" : type === "music" ? "audio file" : "file"
      }
      query={query}
      onQuery={setQuery}
      options={data?.files.items ?? []}
    />
  )
}
