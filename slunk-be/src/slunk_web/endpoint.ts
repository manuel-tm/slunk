import type { Server } from "node:http"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@as-integrations/express5"
import express from "express"
import type { Context } from "./schema/context.ts"
import { resolvers, typeDefs } from "./schema/index.ts"

/**
 * Starts Express with Apollo at /graphql. It listens on 127.0.0.1 only:
 * Slunk is local, and nothing else on the network should reach it.
 */
export async function startEndpoint(
  context: Context,
  port: number
): Promise<Server> {
  const apollo = new ApolloServer<Context>({ typeDefs, resolvers })
  await apollo.start()

  const app = express()
  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apollo, { context: async () => context })
  )

  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", (error) =>
      error ? reject(error) : resolve(server)
    )
  })
}
