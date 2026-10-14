import type { Tagging } from "../../slunk/tagging.ts"
import type { Tag } from "../../slunk/tagging/repository.ts"
import type { Context } from "./context.ts"
import { loadAll, loadRequired } from "./loaders.ts"
import type { Resolvers } from "./resolvers_types.ts"

const TAG_TYPES = {
  text: "TextTag",
  number: "NumberTag",
  date: "DateTag",
} as const

/** A GraphQL id, as the database's number. */
const n = (id: string | number) => Number(id)

/** The fields every tag type resolves the same way. */
const tagFields = {
  releaseCount: (tag: Tag, _args: unknown, { tagging }: Context) =>
    tagging.tagReleaseCount(tag.type, tag.id),
  blockers: (tag: Tag, _args: unknown, { tagging }: Context) =>
    tagging.tagBlockers(tag.type, tag.id),
  multiValueReleases: async (
    tag: Tag,
    args: { page: number; perPage: number },
    { tagging, loaders }: Context
  ) => {
    const { items, total } = await tagging.multiValueReleases(
      tag.type,
      tag.id,
      args
    )
    return { items: await loadAll(loaders.release, items), total }
  },
}

/** Release list filters, from the API's input. */
export function tagFilters(
  tagging: Tagging,
  inputs: {
    type: Tag["type"]
    tagId: string
    equals?: string | null
    contains?: string | null
    min?: string | null
    max?: string | null
  }[]
) {
  return tagging.releaseFilters(
    inputs.map((input) => ({ ...input, tagId: n(input.tagId) }))
  )
}

export const taggingResolvers: Resolvers = {
  Query: {
    tags: (_parent, args, { tagging }) => tagging.listTags(args),
    tag: (_parent, { type, id }, { tagging }) => tagging.getTag(type, n(id)),
    tagsByRef: async (_parent, { refs }, { loaders }) => {
      const tags = await Promise.all(
        refs.map((ref) => loaders.tag[ref.type].load(n(ref.id)))
      )
      return tags.filter((tag) => tag !== null)
    },
  },

  Mutation: {
    createTag: (_parent, { type, input }, { tagging }) =>
      tagging.createTag(type, input),
    updateTag: (_parent, { type, id, input }, { tagging }) =>
      tagging.updateTag(type, n(id), input),
    deleteTag: async (_parent, { type, id }, { tagging }) => {
      await tagging.deleteTag(type, n(id))
      return id
    },
    setReleaseTags: async (_parent, { id, tags }, { catalog, tagging }) => {
      const release = await catalog.getRelease(n(id))
      if (!release) throw new Error(`There's no release ${id}`)
      await tagging.setReleaseTags(
        release.id,
        tags.map((tag) => ({
          type: tag.type,
          tagId: n(tag.tagId),
          values: tag.values,
        }))
      )
      return release
    },
  },

  Tag: {
    __resolveType: (tag) => TAG_TYPES[tag.type],
  },
  TextTag: {
    ...tagFields,
    values: (tag, args, { tagging }) => tagging.tagValues(tag.id, args),
  },
  NumberTag: tagFields,
  DateTag: tagFields,

  ReleaseTag: {
    tag: (releaseTag, _args, { loaders }) =>
      loadRequired(loaders.tag[releaseTag.type], releaseTag.tagId),
    values: (releaseTag, _args, { tagging }) =>
      releaseTag.values.map((value) =>
        tagging.formatValue(releaseTag.type, value)
      ),
  },

  Release: {
    tags: (release, _args, { loaders }) => loaders.releaseTags.load(release.id),
  },
}
