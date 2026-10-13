import type { GraphQLResolveInfo } from 'graphql';
import type { FileRecord } from '../../slunk/media/repository.ts';
import type { Context } from './context.ts';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string | number; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** A file the user registered. Slunk only reads it. */
export type File = {
  __typename?: 'File';
  id: Scalars['ID']['output'];
  /** Epoch seconds */
  insertedAt: Scalars['Float']['output'];
  /** When the file was last modified, in epoch seconds, as read when it was registered or relinked. */
  mtime: Scalars['Float']['output'];
  /** The last part of the path. */
  name: Scalars['String']['output'];
  /** Whether there's still a file at the path. */
  onDisk: Scalars['Boolean']['output'];
  /** Relative to the database's folder. */
  path: Scalars['String']['output'];
  sha256: Scalars['String']['output'];
  sizeBytes: Scalars['Float']['output'];
  /** The track this file is the audio of. */
  track?: Maybe<Track>;
  type: FileType;
  /** Epoch seconds */
  updatedAt: Scalars['Float']['output'];
  /** Everything that uses the file. While anything does, it can't be deleted. */
  uses: Array<FileUse>;
};

export type FileCounts = {
  __typename?: 'FileCounts';
  total: Scalars['Int']['output'];
  /** Files nothing uses yet */
  unused: Scalars['Int']['output'];
};

export type FilePage = {
  __typename?: 'FilePage';
  items: Array<File>;
  total: Scalars['Int']['output'];
};

export type FileType =
  | 'image'
  | 'music'
  | 'other';

/** Something that uses a file. It has no id of its own. */
export type FileUse = {
  __typename?: 'FileUse';
  /** The id of the track, release, artist or label that uses the file. */
  entityId: Scalars['ID']['output'];
  kind: FileUseKind;
  /** Its title or name */
  name: Scalars['String']['output'];
  /** A file link's note. */
  note?: Maybe<Scalars['String']['output']>;
};

export type FileUseKind =
  | 'artist_link'
  | 'artist_picture'
  | 'label_picture'
  | 'release_cover'
  | 'release_link'
  | 'track_audio'
  | 'track_link';

export type Folder = {
  __typename?: 'Folder';
  absolutePath: Scalars['String']['output'];
  files: Array<FolderFile>;
  folders: Array<Subfolder>;
  /** The folder above, or null at the top of the disk. */
  parent?: Maybe<Scalars['String']['output']>;
  /** Relative to the database's folder: `""` is that folder, and `..` goes up. */
  path: Scalars['String']['output'];
};

/** A file on disk, registered or not. */
export type FolderFile = {
  __typename?: 'FolderFile';
  /** The file's registration, if it's registered. */
  file?: Maybe<File>;
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  sizeBytes: Scalars['Float']['output'];
  /** From the extension */
  type: FileType;
};

/** The backend's state, shown on the dashboard. */
export type Health = {
  __typename?: 'Health';
  /** The database file in use (SLUNK_DB), as an absolute path. */
  database: Scalars['String']['output'];
  /** The latest applied migration, or null before the first one. */
  migration?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Deletes a file's record. The file on disk isn't touched. Fails while anything uses the file. */
  deleteFile: Scalars['ID']['output'];
  /** Registers files on disk: reads their size, mtime and hash, and types them by extension. Paths already registered are returned as they are. */
  registerFiles: Array<File>;
  /** Changes a file's type, or its path to relink a file that moved, in which case its size, mtime and hash are read again. */
  updateFile: File;
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegisterFilesArgs = {
  paths: Array<Scalars['String']['input']>;
};


export type MutationUpdateFileArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFileInput;
};

export type Query = {
  __typename?: 'Query';
  file?: Maybe<File>;
  fileCounts: FileCounts;
  /** A page of registered files. */
  files: FilePage;
  /** A folder's subfolders and the files directly in it, for browsing. Hidden files are left out. */
  folder: Folder;
  /** Every file in a folder and its subfolders, by path. */
  folderFiles: Array<FolderFile>;
  /** Whether the backend is up, and which database it serves. */
  health: Health;
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFilesArgs = {
  page?: Scalars['Int']['input'];
  perPage?: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<FileType>;
  unused?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryFolderArgs = {
  path?: Scalars['String']['input'];
};


export type QueryFolderFilesArgs = {
  path: Scalars['String']['input'];
};

export type Subfolder = {
  __typename?: 'Subfolder';
  /** Whether it, or a folder inside it, holds registered files. */
  hasRegisteredFiles: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
};

/** A track, for now just what the files pages show of it. */
export type Track = {
  __typename?: 'Track';
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export type UpdateFileInput = {
  path?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<FileType>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  File: ResolverTypeWrapper<FileRecord>;
  FileCounts: ResolverTypeWrapper<FileCounts>;
  FilePage: ResolverTypeWrapper<Omit<FilePage, 'items'> & { items: Array<ResolversTypes['File']> }>;
  FileType: FileType;
  FileUse: ResolverTypeWrapper<FileUse>;
  FileUseKind: FileUseKind;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Folder: ResolverTypeWrapper<Omit<Folder, 'files'> & { files: Array<ResolversTypes['FolderFile']> }>;
  FolderFile: ResolverTypeWrapper<Omit<FolderFile, 'file'> & { file?: Maybe<ResolversTypes['File']> }>;
  Health: ResolverTypeWrapper<Health>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subfolder: ResolverTypeWrapper<Subfolder>;
  Track: ResolverTypeWrapper<Track>;
  UpdateFileInput: UpdateFileInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  File: FileRecord;
  FileCounts: FileCounts;
  FilePage: Omit<FilePage, 'items'> & { items: Array<ResolversParentTypes['File']> };
  FileUse: FileUse;
  Float: Scalars['Float']['output'];
  Folder: Omit<Folder, 'files'> & { files: Array<ResolversParentTypes['FolderFile']> };
  FolderFile: Omit<FolderFile, 'file'> & { file?: Maybe<ResolversParentTypes['File']> };
  Health: Health;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
  Subfolder: Subfolder;
  Track: Track;
  UpdateFileInput: UpdateFileInput;
};

export type FileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insertedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  mtime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  onDisk?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sha256?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  track?: Resolver<Maybe<ResolversTypes['Track']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['FileType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  uses?: Resolver<Array<ResolversTypes['FileUse']>, ParentType, ContextType>;
};

export type FileCountsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FileCounts'] = ResolversParentTypes['FileCounts']> = {
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unused?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type FilePageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FilePage'] = ResolversParentTypes['FilePage']> = {
  items?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type FileUseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FileUse'] = ResolversParentTypes['FileUse']> = {
  entityId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['FileUseKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type FolderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Folder'] = ResolversParentTypes['Folder']> = {
  absolutePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['FolderFile']>, ParentType, ContextType>;
  folders?: Resolver<Array<ResolversTypes['Subfolder']>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FolderFileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FolderFile'] = ResolversParentTypes['FolderFile']> = {
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['FileType'], ParentType, ContextType>;
};

export type HealthResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Health'] = ResolversParentTypes['Health']> = {
  database?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  migration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  deleteFile?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  registerFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<MutationRegisterFilesArgs, 'paths'>>;
  updateFile?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<MutationUpdateFileArgs, 'id' | 'input'>>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileCounts?: Resolver<ResolversTypes['FileCounts'], ParentType, ContextType>;
  files?: Resolver<ResolversTypes['FilePage'], ParentType, ContextType, RequireFields<QueryFilesArgs, 'page' | 'perPage'>>;
  folder?: Resolver<ResolversTypes['Folder'], ParentType, ContextType, RequireFields<QueryFolderArgs, 'path'>>;
  folderFiles?: Resolver<Array<ResolversTypes['FolderFile']>, ParentType, ContextType, RequireFields<QueryFolderFilesArgs, 'path'>>;
  health?: Resolver<ResolversTypes['Health'], ParentType, ContextType>;
};

export type SubfolderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subfolder'] = ResolversParentTypes['Subfolder']> = {
  hasRegisteredFiles?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TrackResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Track'] = ResolversParentTypes['Track']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  File?: FileResolvers<ContextType>;
  FileCounts?: FileCountsResolvers<ContextType>;
  FilePage?: FilePageResolvers<ContextType>;
  FileUse?: FileUseResolvers<ContextType>;
  Folder?: FolderResolvers<ContextType>;
  FolderFile?: FolderFileResolvers<ContextType>;
  Health?: HealthResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subfolder?: SubfolderResolvers<ContextType>;
  Track?: TrackResolvers<ContextType>;
};

