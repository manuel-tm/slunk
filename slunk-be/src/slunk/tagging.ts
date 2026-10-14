// The tagging context: tag definitions, and their values on releases
// (design §4.3 Tags, §6).
import { formatDate, lastDay, parseDate } from "./dates.ts"
import { type ListArgs, pagingOf, searchOf, sortOf } from "./paging.ts"
import {
  type ReleaseTagValue,
  type Tag,
  type TagFilter,
  type TaggingStore,
  type TagType,
  type TagValue,
  TAG_TYPES,
} from "./tagging/repository.ts"

export type Tagging = ReturnType<typeof createTagging>

export type TagInput = { name: string; multiple: boolean }

/** A tag's values on a release, as the user typed them. */
export type ReleaseTagInput = { type: TagType; tagId: number; values: string[] }

/**
 * A release list filter as the list's URL has it. Text takes `equals` or
 * `contains`. Numbers and dates take `equals`, or a range from `min` to `max`.
 * A date is its whole year, month or day: `max: 2006` includes Dec 31, 2006.
 */
export type TagFilterInput = {
  type: TagType
  tagId: number
  equals?: string | null
  contains?: string | null
  min?: string | null
  max?: string | null
}

/** A release's values of one tag, in the order they were set. */
export type ReleaseTag = { type: TagType; tagId: number; values: TagValue[] }

export function createTagging({ store }: { store: TaggingStore }) {
  const notFound = (type: TagType, id: number) =>
    new Error(`There's no ${type} tag ${id}`)

  /**
   * Each type's names are unique in the database. Across types, only the
   * app can check it (design §4.3 Tags).
   */
  async function checkName(tx: TaggingStore, type: TagType, name: string) {
    const other = (await tx.tags.findByName(name)).find((t) => t.type !== type)
    if (other) {
      throw new Error(`There's already a ${other.type} tag named ${other.name}`)
    }
  }

  const releaseCount = (type: TagType, id: number) =>
    store.tags.releaseCount(type, id)

  return {
    listTags: (args: ListArgs & { type?: TagType | null }) =>
      store.tags.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["name"] as const, "Tags"),
        search: searchOf(args.q),
        type: args.type ?? undefined,
      }),
    getTag: (type: TagType, id: number) => store.tags.get(type, id),
    tagsByIds: (type: TagType, ids: readonly number[]) =>
      store.tags.getMany(type, ids),

    async createTag(type: TagType, input: TagInput) {
      const name = input.name.trim()
      return store.transaction(async (tx) => {
        await checkName(tx, type, name)
        return tx.tags.insert(type, { name, multiple: input.multiple })
      })
    },

    /** Renames a tag, or switches it between single and multiple values. */
    async updateTag(type: TagType, id: number, input: TagInput) {
      const name = input.name.trim()
      return store.transaction(async (tx) => {
        const current = await tx.tags.get(type, id)
        if (!current) throw notFound(type, id)
        await checkName(tx, type, name)
        // The database refuses it too. This says how many releases are why.
        if (current.multiple && !input.multiple) {
          const { total } = await tx.tags.multiValueReleases(type, id, {
            offset: 0,
            limit: 1,
          })
          if (total > 0) {
            throw new Error(
              `${count(total, "release")} ${total === 1 ? "has" : "have"} several values for this tag. Leave one value on each before making it single-value.`
            )
          }
        }
        const tag = await tx.tags.update(type, id, {
          name,
          multiple: input.multiple,
        })
        if (!tag) throw notFound(type, id)
        return tag
      })
    },

    tagReleaseCount: releaseCount,

    async tagBlockers(type: TagType, id: number) {
      const releases = await releaseCount(type, id)
      return releases ? [`Set on ${count(releases, "release")}`] : []
    },

    async deleteTag(type: TagType, id: number) {
      const releases = await releaseCount(type, id)
      if (releases > 0) {
        throw new Error(`The tag is set on ${count(releases, "release")}`)
      }
      await store.tags.delete(type, id)
    },

    /** A text tag's values, with how many releases have each. */
    tagValues: (id: number, args: ListArgs) =>
      store.tags.values(id, { ...pagingOf(args), search: searchOf(args.q) }),

    /** Releases with several values, which keep a tag from being single-value. */
    multiValueReleases: (type: TagType, id: number, args: ListArgs) =>
      store.tags.multiValueReleases(type, id, pagingOf(args)),

    /** Each release's tags, ordered by name, with their values in order. */
    async releaseTagsOf(
      releaseIds: readonly number[]
    ): Promise<Map<number, ReleaseTag[]>> {
      const byRelease = await store.tags.valuesOf(releaseIds)
      const result = new Map<number, ReleaseTag[]>()
      for (const [releaseId, values] of byRelease) {
        const tags: ReleaseTag[] = []
        for (const { type, tagId, value } of values) {
          const last = tags.at(-1)
          if (last?.type === type && last.tagId === tagId) {
            last.values.push(value)
          } else {
            tags.push({ type, tagId, values: [value] })
          }
        }
        result.set(releaseId, tags)
      }
      return result
    },

    /**
     * Replaces every tag value on a release. Blank values are left out, so a
     * tag with none is removed. Values that repeat, ignoring case, are kept
     * once.
     */
    async setReleaseTags(releaseId: number, input: ReleaseTagInput[]) {
      await store.transaction(async (tx) => {
        const tags = new Map<string, Tag>()
        for (const type of TAG_TYPES) {
          const ids = input.filter((i) => i.type === type).map((i) => i.tagId)
          for (const tag of await tx.tags.getMany(type, ids)) {
            tags.set(`${type}:${tag.id}`, tag)
          }
        }

        // Values by tag, each kept once
        const byTag = new Map<Tag, Map<string, TagValue>>()
        for (const { type, tagId, values } of input) {
          const tag = tags.get(`${type}:${tagId}`)
          if (!tag) throw notFound(type, tagId)
          const parsed = byTag.get(tag) ?? new Map<string, TagValue>()
          byTag.set(tag, parsed)
          for (const text of values) {
            if (!text.trim()) continue
            const value = parseValue(tag, text)
            if (!parsed.has(sameValueKey(value))) {
              parsed.set(sameValueKey(value), value)
            }
          }
        }

        const rows: ReleaseTagValue[] = []
        for (const [tag, values] of byTag) {
          if (!tag.multiple && values.size > 1) {
            throw new Error(`${tag.name} takes one value`)
          }
          for (const value of values.values()) {
            rows.push({ type: tag.type, tagId: tag.id, value })
          }
        }
        await tx.tags.setValues(releaseId, rows)
      })
    },

    releaseFilters: (inputs: TagFilterInput[]) => inputs.map(filterOf),

    /** A value as the API shows it: text, `8.5`, or `2006-01-10`. */
    formatValue(type: TagType, value: TagValue): string {
      if (type === "date") return formatDate(value as number, "day")
      return String(value)
    },
  }
}

/** A value as the user typed it, stored by its tag's type. */
function parseValue(tag: Tag, text: string): TagValue {
  try {
    if (tag.type === "text") return text.trim()
    if (tag.type === "number") return parseNumber(text)
    return parseDate(text).epoch
  } catch (error) {
    throw new Error(`${tag.name}: ${(error as Error).message}`, {
      cause: error,
    })
  }
}

function parseNumber(text: string): number {
  const trimmed = text.trim()
  const number = Number(trimmed)
  if (
    !/^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(trimmed) ||
    !Number.isFinite(number)
  ) {
    throw new Error(`Not a number: ${text}`)
  }
  return number
}

/** Text compares ignoring ASCII case, like SQLite's NOCASE. */
function sameValueKey(value: TagValue): string {
  return typeof value === "string"
    ? value.replace(/[A-Z]/g, (c) => c.toLowerCase())
    : String(value)
}

function filterOf(input: TagFilterInput): TagFilter {
  const { type, tagId } = input
  const given = (text: string | null | undefined) =>
    text?.trim() ? text.trim() : undefined
  const equals = given(input.equals)
  const contains = given(input.contains)
  const min = given(input.min)
  const max = given(input.max)

  if (type === "text") {
    if (min !== undefined || max !== undefined || !equals === !contains) {
      throw new Error("A text tag filter takes a value, or part of one")
    }
    return { type, tagId, equals, contains }
  }
  if (
    contains !== undefined ||
    (equals !== undefined) === (min !== undefined || max !== undefined)
  ) {
    throw new Error(`A ${type} tag filter takes a value, or a range`)
  }
  if (type === "number") {
    if (equals !== undefined) {
      const number = parseNumber(equals)
      return { type, tagId, min: number, max: number }
    }
    return {
      type,
      tagId,
      min: min === undefined ? undefined : parseNumber(min),
      max: max === undefined ? undefined : parseNumber(max),
    }
  }
  // A date covers its whole year, month or day
  if (equals !== undefined) {
    const date = parseDate(equals)
    return { type, tagId, min: date.epoch, max: lastDay(date) }
  }
  return {
    type,
    tagId,
    min: min === undefined ? undefined : parseDate(min).epoch,
    max: max === undefined ? undefined : lastDay(parseDate(max)),
  }
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`
}
