import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { healthResolvers } from "./health.ts"
import { mediaResolvers } from "./media.ts"

/** The SDL of every .graphql file in this folder. */
export const typeDefs = readdirSync(import.meta.dirname)
  .filter((file) => file.endsWith(".graphql"))
  .sort()
  .map((file) => readFileSync(join(import.meta.dirname, file), "utf8"))

export const resolvers = [healthResolvers, mediaResolvers]
