import type { ListKind } from "@/gql/graphql"

/** The three lists the user manages, which share their pages (design §7.8). */
export const LISTS: Record<
  ListKind,
  {
    kind: ListKind
    path: string
    title: string
    one: string
    /** The release list's filter for it, or null for credit roles */
    releaseFilter: "format" | "medium" | null
  }
> = {
  release_formats: {
    kind: "release_formats",
    path: "/release-formats",
    title: "Release formats",
    one: "format",
    releaseFilter: "format",
  },
  release_media: {
    kind: "release_media",
    path: "/release-media",
    title: "Release media",
    one: "medium",
    releaseFilter: "medium",
  },
  credit_roles: {
    kind: "credit_roles",
    path: "/credit-roles",
    title: "Credit roles",
    one: "credit role",
    releaseFilter: null,
  },
}
