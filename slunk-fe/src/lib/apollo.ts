import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

/** The backend's GraphQL API. In development, Vite proxies /graphql to it. */
export const apollo = new ApolloClient({
  link: new HttpLink({ uri: "/graphql" }),
  cache: new InMemoryCache(),
})
