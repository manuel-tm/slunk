import type { ListQuery, Page, Paging } from "../paging.ts"

/** Each type has its own tables, so the same id exists once per type. */
export type TagType = "text" | "number" | "date"

export const TAG_TYPES: readonly TagType[] = ["text", "number", "date"]

export type Tag = {
  type: TagType
  id: number
  name: string
  /** Several values per release, or at most one (design §4.3) */
  multiple: boolean
}

export type TagValues = { name: string; multiple: boolean }

/** Text, a number, or a date as epoch seconds at midnight UTC. */
export type TagValue = string | number

/** One value of a tag on a release. */
export type ReleaseTagValue = { type: TagType; tagId: number; value: TagValue }

/** A text tag's value, and how many releases have it. */
export type ValueCount = { value: string; releases: number }

/**
 * A release list filter on one tag. Text matches `equals` or `contains`,
 * ignoring case. Numbers and dates match the range, both ends included.
 */
export type TagFilter = {
  type: TagType
  tagId: number
  equals?: string
  contains?: string
  min?: number
  max?: number
}

export interface TagsRepository {
  /** Every type's tags when `type` is left out */
  list(query: ListQuery<"name"> & { type?: TagType }): Promise<Page<Tag>>
  get(type: TagType, id: number): Promise<Tag | null>
  getMany(type: TagType, ids: readonly number[]): Promise<Tag[]>
  /** Tags of any type with exactly this name, ignoring case */
  findByName(name: string): Promise<Tag[]>
  insert(type: TagType, values: TagValues): Promise<Tag>
  update(type: TagType, id: number, values: TagValues): Promise<Tag | null>
  delete(type: TagType, id: number): Promise<void>
  /** How many releases have a value */
  releaseCount(type: TagType, id: number): Promise<number>
  /** A text tag's values, the most used first */
  values(
    id: number,
    query: Paging & { search?: string }
  ): Promise<Page<ValueCount>>
  /** Releases with several values, which keep a tag from being single-value */
  multiValueReleases(
    type: TagType,
    id: number,
    paging: Paging
  ): Promise<Page<number>>
  /** Values by release: by tag name, then in the order they were set */
  valuesOf(
    releaseIds: readonly number[]
  ): Promise<Map<number, ReleaseTagValue[]>>
  /** Replaces every tag value on a release, keeping their order */
  setValues(releaseId: number, values: ReleaseTagValue[]): Promise<void>
}

/** Every repository tagging needs, and a way to use them in one transaction. */
export interface TaggingStore {
  tags: TagsRepository
  transaction<T>(fn: (store: TaggingStore) => Promise<T>): Promise<T>
}
