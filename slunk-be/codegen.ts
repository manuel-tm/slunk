import type { CodegenConfig } from "@graphql-codegen/cli"

// Resolver types from the SDL: `npm run codegen` after changing a .graphql file
const config: CodegenConfig = {
  schema: "src/slunk_web/schema/*.graphql",
  generates: {
    "src/slunk_web/schema/resolvers_types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.ts#Context",
        // Resolvers can return the database's numeric ids
        scalars: { ID: { input: "string", output: "string | number" } },
        // What resolvers return for these types, before their field resolvers
        mappers: { File: "../../slunk/media/repository.ts#FileRecord" },
        useTypeImports: true,
        enumsAsTypes: true,
      },
    },
  },
}

export default config
