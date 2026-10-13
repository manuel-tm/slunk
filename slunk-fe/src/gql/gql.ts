/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Folder($path: String!) {\n    folder(path: $path) {\n      path\n      absolutePath\n      parent\n      folders {\n        name\n        path\n        hasRegisteredFiles\n      }\n      files {\n        name\n        path\n        type\n        sizeBytes\n        file {\n          id\n        }\n      }\n    }\n  }\n": typeof types.FolderDocument,
    "\n  query Dashboard {\n    health {\n      database\n      migration\n    }\n    fileCounts {\n      total\n      unused\n    }\n  }\n": typeof types.DashboardDocument,
    "\n  query FolderFiles($path: String!) {\n    folderFiles(path: $path) {\n      path\n      type\n      sizeBytes\n      file {\n        id\n      }\n    }\n  }\n": typeof types.FolderFilesDocument,
    "\n  mutation RegisterFiles($paths: [String!]!) {\n    registerFiles(paths: $paths) {\n      id\n      path\n    }\n  }\n": typeof types.RegisterFilesDocument,
    "\n  query Files(\n    $page: Int!\n    $perPage: Int!\n    $sort: String\n    $q: String\n    $type: FileType\n    $unused: Boolean\n  ) {\n    files(\n      page: $page\n      perPage: $perPage\n      sort: $sort\n      q: $q\n      type: $type\n      unused: $unused\n    ) {\n      total\n      items {\n        id\n        path\n        type\n        sizeBytes\n        mtime\n        sha256\n        insertedAt\n        updatedAt\n        track {\n          id\n          title\n        }\n      }\n    }\n  }\n": typeof types.FilesDocument,
    "\n  query File($id: ID!) {\n    file(id: $id) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      insertedAt\n      updatedAt\n      onDisk\n      uses {\n        kind\n        entityId\n        name\n        note\n      }\n    }\n  }\n": typeof types.FileDocument,
    "\n  mutation DeleteFile($id: ID!) {\n    deleteFile(id: $id)\n  }\n": typeof types.DeleteFileDocument,
    "\n  query FileUpdate($id: ID!) {\n    file(id: $id) {\n      id\n      name\n      path\n      type\n    }\n  }\n": typeof types.FileUpdateDocument,
    "\n  mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {\n    updateFile(id: $id, input: $input) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      updatedAt\n      onDisk\n    }\n  }\n": typeof types.UpdateFileDocument,
};
const documents: Documents = {
    "\n  query Folder($path: String!) {\n    folder(path: $path) {\n      path\n      absolutePath\n      parent\n      folders {\n        name\n        path\n        hasRegisteredFiles\n      }\n      files {\n        name\n        path\n        type\n        sizeBytes\n        file {\n          id\n        }\n      }\n    }\n  }\n": types.FolderDocument,
    "\n  query Dashboard {\n    health {\n      database\n      migration\n    }\n    fileCounts {\n      total\n      unused\n    }\n  }\n": types.DashboardDocument,
    "\n  query FolderFiles($path: String!) {\n    folderFiles(path: $path) {\n      path\n      type\n      sizeBytes\n      file {\n        id\n      }\n    }\n  }\n": types.FolderFilesDocument,
    "\n  mutation RegisterFiles($paths: [String!]!) {\n    registerFiles(paths: $paths) {\n      id\n      path\n    }\n  }\n": types.RegisterFilesDocument,
    "\n  query Files(\n    $page: Int!\n    $perPage: Int!\n    $sort: String\n    $q: String\n    $type: FileType\n    $unused: Boolean\n  ) {\n    files(\n      page: $page\n      perPage: $perPage\n      sort: $sort\n      q: $q\n      type: $type\n      unused: $unused\n    ) {\n      total\n      items {\n        id\n        path\n        type\n        sizeBytes\n        mtime\n        sha256\n        insertedAt\n        updatedAt\n        track {\n          id\n          title\n        }\n      }\n    }\n  }\n": types.FilesDocument,
    "\n  query File($id: ID!) {\n    file(id: $id) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      insertedAt\n      updatedAt\n      onDisk\n      uses {\n        kind\n        entityId\n        name\n        note\n      }\n    }\n  }\n": types.FileDocument,
    "\n  mutation DeleteFile($id: ID!) {\n    deleteFile(id: $id)\n  }\n": types.DeleteFileDocument,
    "\n  query FileUpdate($id: ID!) {\n    file(id: $id) {\n      id\n      name\n      path\n      type\n    }\n  }\n": types.FileUpdateDocument,
    "\n  mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {\n    updateFile(id: $id, input: $input) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      updatedAt\n      onDisk\n    }\n  }\n": types.UpdateFileDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Folder($path: String!) {\n    folder(path: $path) {\n      path\n      absolutePath\n      parent\n      folders {\n        name\n        path\n        hasRegisteredFiles\n      }\n      files {\n        name\n        path\n        type\n        sizeBytes\n        file {\n          id\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Folder($path: String!) {\n    folder(path: $path) {\n      path\n      absolutePath\n      parent\n      folders {\n        name\n        path\n        hasRegisteredFiles\n      }\n      files {\n        name\n        path\n        type\n        sizeBytes\n        file {\n          id\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Dashboard {\n    health {\n      database\n      migration\n    }\n    fileCounts {\n      total\n      unused\n    }\n  }\n"): (typeof documents)["\n  query Dashboard {\n    health {\n      database\n      migration\n    }\n    fileCounts {\n      total\n      unused\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FolderFiles($path: String!) {\n    folderFiles(path: $path) {\n      path\n      type\n      sizeBytes\n      file {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query FolderFiles($path: String!) {\n    folderFiles(path: $path) {\n      path\n      type\n      sizeBytes\n      file {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RegisterFiles($paths: [String!]!) {\n    registerFiles(paths: $paths) {\n      id\n      path\n    }\n  }\n"): (typeof documents)["\n  mutation RegisterFiles($paths: [String!]!) {\n    registerFiles(paths: $paths) {\n      id\n      path\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Files(\n    $page: Int!\n    $perPage: Int!\n    $sort: String\n    $q: String\n    $type: FileType\n    $unused: Boolean\n  ) {\n    files(\n      page: $page\n      perPage: $perPage\n      sort: $sort\n      q: $q\n      type: $type\n      unused: $unused\n    ) {\n      total\n      items {\n        id\n        path\n        type\n        sizeBytes\n        mtime\n        sha256\n        insertedAt\n        updatedAt\n        track {\n          id\n          title\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Files(\n    $page: Int!\n    $perPage: Int!\n    $sort: String\n    $q: String\n    $type: FileType\n    $unused: Boolean\n  ) {\n    files(\n      page: $page\n      perPage: $perPage\n      sort: $sort\n      q: $q\n      type: $type\n      unused: $unused\n    ) {\n      total\n      items {\n        id\n        path\n        type\n        sizeBytes\n        mtime\n        sha256\n        insertedAt\n        updatedAt\n        track {\n          id\n          title\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query File($id: ID!) {\n    file(id: $id) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      insertedAt\n      updatedAt\n      onDisk\n      uses {\n        kind\n        entityId\n        name\n        note\n      }\n    }\n  }\n"): (typeof documents)["\n  query File($id: ID!) {\n    file(id: $id) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      insertedAt\n      updatedAt\n      onDisk\n      uses {\n        kind\n        entityId\n        name\n        note\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteFile($id: ID!) {\n    deleteFile(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteFile($id: ID!) {\n    deleteFile(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FileUpdate($id: ID!) {\n    file(id: $id) {\n      id\n      name\n      path\n      type\n    }\n  }\n"): (typeof documents)["\n  query FileUpdate($id: ID!) {\n    file(id: $id) {\n      id\n      name\n      path\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {\n    updateFile(id: $id, input: $input) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      updatedAt\n      onDisk\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateFile($id: ID!, $input: UpdateFileInput!) {\n    updateFile(id: $id, input: $input) {\n      id\n      path\n      name\n      type\n      sizeBytes\n      mtime\n      sha256\n      updatedAt\n      onDisk\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;