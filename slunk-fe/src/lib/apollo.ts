import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

/** The backend's GraphQL API. In development, Vite proxies /graphql to it. */
export const apollo = new ApolloClient({
  link: new HttpLink({ uri: "/graphql" }),
  cache: new InMemoryCache(),
  // A page shows what's cached at once, and asks the backend again, so it
  // never shows a list from before a change
  defaultOptions: { watchQuery: { fetchPolicy: "cache-and-network" } },
})
