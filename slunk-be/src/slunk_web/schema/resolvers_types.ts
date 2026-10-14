import type { GraphQLResolveInfo } from 'graphql';
import type { FileRecord as FileRecordModel, FileLink as FileLinkModel } from '../../slunk/media/repository.ts';
import type { Artist as ArtistModel, Label as LabelModel, Release as ReleaseModel, Track as TrackModel, Credit as CreditModel, ListItem as ListItemModel, Appearance as AppearanceModel, ArtistCredit as ArtistCreditModel, FormatCount as FormatCountModel } from '../../slunk/catalog/repository.ts';
import type { Tag as TagModel } from '../../slunk/tagging/repository.ts';
import type { ReleaseTag as ReleaseTagModel } from '../../slunk/tagging.ts';
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

export type Appearance = {
  __typename?: 'Appearance';
  release: Release;
  /** The artist's tracks on it */
  tracks: Array<Track>;
};

export type Artist = {
  __typename?: 'Artist';
  /** Releases where the artist performs or is featured on tracks, without being a release artist. */
  appearances: Array<Appearance>;
  /** What keeps it from being deleted, in words. */
  blockers: Array<Scalars['String']['output']>;
  counts: ArtistCounts;
  credits: Array<ArtistCredit>;
  files: Array<FileLink>;
  /** How many of the artist's releases have each format. */
  formatCounts: Array<FormatCount>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  /** The primary image. Other images are file links. */
  picture?: Maybe<File>;
  updatedAt: Scalars['Float']['output'];
};

/** The artist page's tabs, counted. */
export type ArtistCounts = {
  __typename?: 'ArtistCounts';
  appearances: Scalars['Int']['output'];
  credits: Scalars['Int']['output'];
  /** The picture, and the linked files */
  files: Scalars['Int']['output'];
  releases: Scalars['Int']['output'];
};

export type ArtistCredit = {
  __typename?: 'ArtistCredit';
  release: Release;
  role: CreditRole;
  /** Null for a credit on the release itself */
  track?: Maybe<Track>;
};

export type ArtistInput = {
  files: Array<FileLinkInput>;
  name: Scalars['String']['input'];
  pictureId?: InputMaybe<Scalars['ID']['input']>;
};

export type ArtistPage = {
  __typename?: 'ArtistPage';
  items: Array<Artist>;
  total: Scalars['Int']['output'];
};

/** A name from the tags, and the artist with exactly that name, ignoring case, if there's one. */
export type ArtistSuggestion = {
  __typename?: 'ArtistSuggestion';
  artist?: Maybe<Artist>;
  name: Scalars['String']['output'];
};

export type CatalogTotals = {
  __typename?: 'CatalogTotals';
  artists: Scalars['Int']['output'];
  /** Every track's duration, added up */
  durationMs: Scalars['Float']['output'];
  labels: Scalars['Int']['output'];
  releases: Scalars['Int']['output'];
  tracks: Scalars['Int']['output'];
};

/** An artist's role on a release or track. It has no id: release and track credits live in different tables, so their ids would collide. */
export type Credit = {
  __typename?: 'Credit';
  artist: Artist;
  role: CreditRole;
};

export type CreditInput = {
  artistId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
};

export type CreditRole = ListItem & {
  __typename?: 'CreditRole';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: ListKind;
  name: Scalars['String']['output'];
  uses: Scalars['Int']['output'];
};

export type DateTag = Tag & {
  __typename?: 'DateTag';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  multiValueReleases: ReleasePage;
  multiple: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  releaseCount: Scalars['Int']['output'];
  type: TagType;
};


export type DateTagMultiValueReleasesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
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

export type FileLink = {
  __typename?: 'FileLink';
  file: File;
  note?: Maybe<Scalars['String']['output']>;
};

export type FileLinkInput = {
  fileId?: InputMaybe<Scalars['ID']['input']>;
  note?: InputMaybe<Scalars['String']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
};

export type FilePage = {
  __typename?: 'FilePage';
  items: Array<File>;
  total: Scalars['Int']['output'];
};

/** A file by id, or a path to register first. */
export type FileRefInput = {
  fileId?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
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

export type FormatCount = {
  __typename?: 'FormatCount';
  count: Scalars['Int']['output'];
  format: ReleaseFormat;
};

/** The backend's state, shown on the dashboard. */
export type Health = {
  __typename?: 'Health';
  /** The database file in use (SLUNK_DB), as an absolute path. */
  database: Scalars['String']['output'];
  /** The latest applied migration, or null before the first one. */
  migration?: Maybe<Scalars['String']['output']>;
};

export type Label = {
  __typename?: 'Label';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  /** The logo */
  picture?: Maybe<File>;
  releaseCount: Scalars['Int']['output'];
  updatedAt: Scalars['Float']['output'];
};

export type LabelInput = {
  name: Scalars['String']['input'];
  pictureId?: InputMaybe<Scalars['ID']['input']>;
};

export type LabelPage = {
  __typename?: 'LabelPage';
  items: Array<Label>;
  total: Scalars['Int']['output'];
};

/** A row of a list the user manages: a release format, release medium or credit role. */
export type ListItem = {
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: ListKind;
  name: Scalars['String']['output'];
  /** Releases with the format or medium, or credits with the role. */
  uses: Scalars['Int']['output'];
};

export type ListItemPage = {
  __typename?: 'ListItemPage';
  items: Array<ListItem>;
  total: Scalars['Int']['output'];
};

export type ListKind =
  | 'credit_roles'
  | 'release_formats'
  | 'release_media';

export type Mutation = {
  __typename?: 'Mutation';
  createArtist: Artist;
  createLabel: Label;
  createListItem: ListItem;
  createRelease: Release;
  /** Tag names are unique across types, ignoring case. */
  createTag: Tag;
  /** Creates a track from a registered audio file, reading its duration. */
  createTrack: Track;
  /** Fails while the artist is a release or track artist, or credited. */
  deleteArtist: Scalars['ID']['output'];
  /** Deletes a file's record. The file on disk isn't touched. Fails while anything uses the file. */
  deleteFile: Scalars['ID']['output'];
  /** Fails while the label is on a release. */
  deleteLabel: Scalars['ID']['output'];
  /** Fails while anything uses it. */
  deleteListItem: Scalars['ID']['output'];
  /** Fails while the release has tracks. */
  deleteRelease: Scalars['ID']['output'];
  /** Fails while any release has a value. */
  deleteTag: Scalars['ID']['output'];
  /** Deletes a track, its artists, credits and file links. Its audio file stays registered. */
  deleteTrack: Scalars['ID']['output'];
  /** Registers files on disk: reads their size, mtime and hash, and types them by extension. Paths already registered are returned as they are. */
  registerFiles: Array<File>;
  renameListItem: ListItem;
  /** Replaces the release's credits and its tracks' credits. */
  setReleaseCredits: Release;
  /** Sets the cover and replaces the file links. Files given by path are registered first. */
  setReleaseFiles: Release;
  /** Replaces every tag value on the release. A tag left out, or with only blank values, is removed. */
  setReleaseTags: Release;
  /** Saves the whole track list: rows with an id are updated, the others create tracks, and tracks left out are deleted. Their files stay registered. */
  setReleaseTracks: Release;
  updateArtist: Artist;
  /** Changes a file's type, or its path to relink a file that moved, in which case its size, mtime and hash are read again. */
  updateFile: File;
  updateLabel: Label;
  /** The details: title, date, artists, labels, formats, media, catalog number. */
  updateRelease: Release;
  /** The type can't change. Switching to single-value fails while a release has several values. */
  updateTag: Tag;
  updateTrack: Track;
};


export type MutationCreateArtistArgs = {
  input: ArtistInput;
};


export type MutationCreateLabelArgs = {
  input: LabelInput;
};


export type MutationCreateListItemArgs = {
  kind: ListKind;
  name: Scalars['String']['input'];
};


export type MutationCreateReleaseArgs = {
  input: ReleaseInput;
};


export type MutationCreateTagArgs = {
  input: TagInput;
  type: TagType;
};


export type MutationCreateTrackArgs = {
  input: TrackInput;
};


export type MutationDeleteArtistArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLabelArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteListItemArgs = {
  id: Scalars['ID']['input'];
  kind: ListKind;
};


export type MutationDeleteReleaseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTagArgs = {
  id: Scalars['ID']['input'];
  type: TagType;
};


export type MutationDeleteTrackArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegisterFilesArgs = {
  paths: Array<Scalars['String']['input']>;
};


export type MutationRenameListItemArgs = {
  id: Scalars['ID']['input'];
  kind: ListKind;
  name: Scalars['String']['input'];
};


export type MutationSetReleaseCreditsArgs = {
  id: Scalars['ID']['input'];
  input: ReleaseCreditsInput;
};


export type MutationSetReleaseFilesArgs = {
  id: Scalars['ID']['input'];
  input: ReleaseFilesInput;
};


export type MutationSetReleaseTagsArgs = {
  id: Scalars['ID']['input'];
  tags: Array<ReleaseTagInput>;
};


export type MutationSetReleaseTracksArgs = {
  id: Scalars['ID']['input'];
  tracks: Array<ReleaseTrackInput>;
};


export type MutationUpdateArtistArgs = {
  id: Scalars['ID']['input'];
  input: ArtistInput;
};


export type MutationUpdateFileArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFileInput;
};


export type MutationUpdateLabelArgs = {
  id: Scalars['ID']['input'];
  input: LabelInput;
};


export type MutationUpdateReleaseArgs = {
  id: Scalars['ID']['input'];
  input: ReleaseInput;
};


export type MutationUpdateTagArgs = {
  id: Scalars['ID']['input'];
  input: TagInput;
  type: TagType;
};


export type MutationUpdateTrackArgs = {
  id: Scalars['ID']['input'];
  input: TrackInput;
};

export type NumberTag = Tag & {
  __typename?: 'NumberTag';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  multiValueReleases: ReleasePage;
  multiple: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  releaseCount: Scalars['Int']['output'];
  type: TagType;
};


export type NumberTagMultiValueReleasesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  artist?: Maybe<Artist>;
  artists: ArtistPage;
  catalogTotals: CatalogTotals;
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
  label?: Maybe<Label>;
  labels: LabelPage;
  listItem?: Maybe<ListItem>;
  /** Release formats, release media or credit roles. */
  listItems: ListItemPage;
  release?: Maybe<Release>;
  /** What a folder suggests for a new release, from its files' embedded tags, or else its name. */
  releaseSuggestion: ReleaseSuggestion;
  /** Releases. The filters combine: `format` and `medium` give "EPs on vinyl". */
  releases: ReleasePage;
  /** Releases with this title, ignoring case: an import checks it so a release isn't imported twice. */
  releasesTitled: Array<Release>;
  tag?: Maybe<Tag>;
  /** Tag definitions of one type, or of every type when `type` is left out. */
  tags: TagPage;
  /** These tags, in the same order, leaving out any that don't exist. The release list names its tag filters with it. */
  tagsByRef: Array<Tag>;
  track?: Maybe<Track>;
  /** A row for each audio file in a folder and its subfolders: from embedded tags, or else the file's name (`CD2/03 Title.flac` is disc 2, track 3). */
  trackSuggestions: Array<TrackSuggestion>;
  tracks: TrackPage;
};


export type QueryArtistArgs = {
  id: Scalars['ID']['input'];
};


export type QueryArtistsArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFilesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<FileType>;
  unused?: InputMaybe<Scalars['Boolean']['input']>;
  withoutTrack?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryFolderArgs = {
  path: Scalars['String']['input'];
};


export type QueryFolderFilesArgs = {
  path: Scalars['String']['input'];
};


export type QueryLabelArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLabelsArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListItemArgs = {
  id: Scalars['ID']['input'];
  kind: ListKind;
};


export type QueryListItemsArgs = {
  kind: ListKind;
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReleaseArgs = {
  id: Scalars['ID']['input'];
};


export type QueryReleaseSuggestionArgs = {
  folder: Scalars['String']['input'];
};


export type QueryReleasesArgs = {
  artist?: InputMaybe<Scalars['ID']['input']>;
  format?: InputMaybe<Scalars['ID']['input']>;
  label?: InputMaybe<Scalars['ID']['input']>;
  medium?: InputMaybe<Scalars['ID']['input']>;
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  tags: Array<TagFilterInput>;
};


export type QueryReleasesTitledArgs = {
  title: Scalars['String']['input'];
};


export type QueryTagArgs = {
  id: Scalars['ID']['input'];
  type: TagType;
};


export type QueryTagsArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<TagType>;
};


export type QueryTagsByRefArgs = {
  refs: Array<TagRefInput>;
};


export type QueryTrackArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTrackSuggestionsArgs = {
  folder: Scalars['String']['input'];
};


export type QueryTracksArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
  release?: InputMaybe<Scalars['ID']['input']>;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type Release = {
  __typename?: 'Release';
  /** Who the release is by, in display order. */
  artists: Array<Artist>;
  blockers: Array<Scalars['String']['output']>;
  catalogNumber?: Maybe<Scalars['String']['output']>;
  cover?: Maybe<File>;
  credits: Array<Credit>;
  /** The tracks' total playing time, or null with no durations. */
  durationMs?: Maybe<Scalars['Float']['output']>;
  /** The cover and the linked files. */
  fileCount: Scalars['Int']['output'];
  files: Array<FileLink>;
  formats: Array<ReleaseFormat>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Float']['output'];
  labels: Array<Label>;
  media: Array<ReleaseMedium>;
  /** With only its known parts: `2006`, `2006-01` or `2006-01-10`. */
  released?: Maybe<Scalars['String']['output']>;
  /** By tag name. */
  tags: Array<ReleaseTag>;
  title: Scalars['String']['output'];
  /** In order: disc, then number. */
  tracks: Array<Track>;
  updatedAt: Scalars['Float']['output'];
  /** Each track names its own performers: compilations, soundtracks, cast recordings. */
  variousArtists: Scalars['Boolean']['output'];
};

export type ReleaseCreditsInput = {
  credits: Array<CreditInput>;
  tracks: Array<TrackCreditsInput>;
};

export type ReleaseFilesInput = {
  cover?: InputMaybe<FileRefInput>;
  files: Array<FileLinkInput>;
};

export type ReleaseFormat = ListItem & {
  __typename?: 'ReleaseFormat';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: ListKind;
  name: Scalars['String']['output'];
  uses: Scalars['Int']['output'];
};

export type ReleaseInput = {
  /** In display order, like the other lists */
  artistIds: Array<Scalars['ID']['input']>;
  catalogNumber?: InputMaybe<Scalars['String']['input']>;
  formatIds: Array<Scalars['ID']['input']>;
  labelIds: Array<Scalars['ID']['input']>;
  mediumIds: Array<Scalars['ID']['input']>;
  /** `2006`, `2006-01` or `2006-01-10`, which also sets the precision */
  released?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  variousArtists: Scalars['Boolean']['input'];
};

export type ReleaseMedium = ListItem & {
  __typename?: 'ReleaseMedium';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: ListKind;
  name: Scalars['String']['output'];
  uses: Scalars['Int']['output'];
};

export type ReleasePage = {
  __typename?: 'ReleasePage';
  items: Array<Release>;
  total: Scalars['Int']['output'];
};

export type ReleaseSuggestion = {
  __typename?: 'ReleaseSuggestion';
  /** The album artist tags, or the artist tags */
  artists: Array<ArtistSuggestion>;
  images: Scalars['Int']['output'];
  music: Scalars['Int']['output'];
  others: Scalars['Int']['output'];
  released?: Maybe<Scalars['String']['output']>;
  /** Releases with that title already, so the folder isn't imported twice */
  sameTitle: Array<Release>;
  /** The album tag, or else the folder's name */
  title: Scalars['String']['output'];
};

/** A tag set on a release, with its values: one for a single-value tag. */
export type ReleaseTag = {
  __typename?: 'ReleaseTag';
  tag: Tag;
  /** As text: `Rock`, `8.5`, or a date as `2006-01-10`. In the order they were set. */
  values: Array<Scalars['String']['output']>;
};

export type ReleaseTagInput = {
  tagId: Scalars['ID']['input'];
  type: TagType;
  /** As typed: a number like `8.5`, a date as `2006`, `2006-01` or `2006-01-10`. Blank values are left out. */
  values: Array<Scalars['String']['input']>;
};

/** A track of the release: `id` for one it has, else `fileId` or `path` for a new one. */
export type ReleaseTrackInput = {
  artistIds: Array<Scalars['ID']['input']>;
  cdNumber: Scalars['Int']['input'];
  featureIds: Array<Scalars['ID']['input']>;
  fileId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  trackNumber: Scalars['Int']['input'];
};

export type Subfolder = {
  __typename?: 'Subfolder';
  /** Whether it, or a folder inside it, holds registered files. */
  hasRegisteredFiles: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
};

/** A tag definition, like Genre or Score. */
export type Tag = {
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Releases with several values, which keep the tag from being single-value. */
  multiValueReleases: ReleasePage;
  /** Several values per release, or at most one. */
  multiple: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** How many releases have a value. */
  releaseCount: Scalars['Int']['output'];
  type: TagType;
};


/** A tag definition, like Genre or Score. */
export type TagMultiValueReleasesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
};

/** A release list filter on one tag. Text takes `equals` or `contains`; numbers and dates take `equals`, or `min` and `max`. */
export type TagFilterInput = {
  /** Text only: part of the value, ignoring case. */
  contains?: InputMaybe<Scalars['String']['input']>;
  /** The value, ignoring case for text. A date covers its whole year, month or day (`2006`, `2006-01`, `2006-01-10`). */
  equals?: InputMaybe<Scalars['String']['input']>;
  /** Number or date, included. A date runs to its last day: `2006` includes Dec 31, 2006. */
  max?: InputMaybe<Scalars['String']['input']>;
  /** Number or date, included. A date starts on its first day. */
  min?: InputMaybe<Scalars['String']['input']>;
  tagId: Scalars['ID']['input'];
  type: TagType;
};

export type TagInput = {
  multiple: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
};

export type TagPage = {
  __typename?: 'TagPage';
  items: Array<Tag>;
  total: Scalars['Int']['output'];
};

export type TagRefInput = {
  id: Scalars['ID']['input'];
  type: TagType;
};

/** Each type has its own tables, so the same id exists once per type. */
export type TagType =
  /** A day, without a time */
  | 'date'
  /** A real number */
  | 'number'
  | 'text';

export type TagValueCount = {
  __typename?: 'TagValueCount';
  releases: Scalars['Int']['output'];
  value: Scalars['String']['output'];
};

export type TagValuePage = {
  __typename?: 'TagValuePage';
  items: Array<TagValueCount>;
  total: Scalars['Int']['output'];
};

export type TextTag = Tag & {
  __typename?: 'TextTag';
  blockers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  multiValueReleases: ReleasePage;
  multiple: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  releaseCount: Scalars['Int']['output'];
  type: TagType;
  /** The values, with how many releases have each, the most used first. Values that differ only in case count as one. */
  values: TagValuePage;
};


export type TextTagMultiValueReleasesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
};


export type TextTagValuesArgs = {
  page: Scalars['Int']['input'];
  perPage: Scalars['Int']['input'];
  q?: InputMaybe<Scalars['String']['input']>;
};

export type Track = {
  __typename?: 'Track';
  /** The track's own performers, without features. */
  artists: Array<Artist>;
  cdNumber: Scalars['Int']['output'];
  credits: Array<Credit>;
  /** Read from the audio file. Null when it can't be read. */
  durationMs?: Maybe<Scalars['Float']['output']>;
  /** Guests, shown as "(feat. …)". */
  features: Array<Artist>;
  /** The audio file */
  file: File;
  files: Array<FileLink>;
  id: Scalars['ID']['output'];
  insertedAt: Scalars['Float']['output'];
  /** Who performs it (design §4.3): its own artists. On a regular release with none, the release's artists; on a various-artists release, nobody. */
  performers: Array<Artist>;
  release: Release;
  title: Scalars['String']['output'];
  trackNumber: Scalars['Int']['output'];
  updatedAt: Scalars['Float']['output'];
};

export type TrackCreditsInput = {
  credits: Array<CreditInput>;
  trackId: Scalars['ID']['input'];
};

export type TrackInput = {
  artistIds: Array<Scalars['ID']['input']>;
  cdNumber: Scalars['Int']['input'];
  credits: Array<CreditInput>;
  featureIds: Array<Scalars['ID']['input']>;
  fileId: Scalars['ID']['input'];
  files: Array<FileLinkInput>;
  releaseId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  trackNumber: Scalars['Int']['input'];
};

export type TrackPage = {
  __typename?: 'TrackPage';
  items: Array<Track>;
  total: Scalars['Int']['output'];
};

export type TrackSuggestion = {
  __typename?: 'TrackSuggestion';
  artists: Array<ArtistSuggestion>;
  cdNumber: Scalars['Int']['output'];
  durationMs?: Maybe<Scalars['Float']['output']>;
  /** The file's registration, if it's registered */
  file?: Maybe<File>;
  path: Scalars['String']['output'];
  title: Scalars['String']['output'];
  /** The track the file is already the audio of, on any release */
  track?: Maybe<Track>;
  trackNumber: Scalars['Int']['output'];
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
  Appearance: ResolverTypeWrapper<AppearanceModel>;
  Artist: ResolverTypeWrapper<ArtistModel>;
  ArtistCounts: ResolverTypeWrapper<ArtistCounts>;
  ArtistCredit: ResolverTypeWrapper<ArtistCreditModel>;
  ArtistInput: ArtistInput;
  ArtistPage: ResolverTypeWrapper<Omit<ArtistPage, 'items'> & { items: Array<ResolversTypes['Artist']> }>;
  ArtistSuggestion: ResolverTypeWrapper<Omit<ArtistSuggestion, 'artist'> & { artist?: Maybe<ResolversTypes['Artist']> }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CatalogTotals: ResolverTypeWrapper<CatalogTotals>;
  Credit: ResolverTypeWrapper<CreditModel>;
  CreditInput: CreditInput;
  CreditRole: ResolverTypeWrapper<ListItemModel>;
  DateTag: ResolverTypeWrapper<TagModel>;
  File: ResolverTypeWrapper<FileRecordModel>;
  FileCounts: ResolverTypeWrapper<FileCounts>;
  FileLink: ResolverTypeWrapper<FileLinkModel>;
  FileLinkInput: FileLinkInput;
  FilePage: ResolverTypeWrapper<Omit<FilePage, 'items'> & { items: Array<ResolversTypes['File']> }>;
  FileRefInput: FileRefInput;
  FileType: FileType;
  FileUse: ResolverTypeWrapper<FileUse>;
  FileUseKind: FileUseKind;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Folder: ResolverTypeWrapper<Omit<Folder, 'files'> & { files: Array<ResolversTypes['FolderFile']> }>;
  FolderFile: ResolverTypeWrapper<Omit<FolderFile, 'file'> & { file?: Maybe<ResolversTypes['File']> }>;
  FormatCount: ResolverTypeWrapper<FormatCountModel>;
  Health: ResolverTypeWrapper<Health>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Label: ResolverTypeWrapper<LabelModel>;
  LabelInput: LabelInput;
  LabelPage: ResolverTypeWrapper<Omit<LabelPage, 'items'> & { items: Array<ResolversTypes['Label']> }>;
  ListItem: ResolverTypeWrapper<ListItemModel>;
  ListItemPage: ResolverTypeWrapper<Omit<ListItemPage, 'items'> & { items: Array<ResolversTypes['ListItem']> }>;
  ListKind: ListKind;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NumberTag: ResolverTypeWrapper<TagModel>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Release: ResolverTypeWrapper<ReleaseModel>;
  ReleaseCreditsInput: ReleaseCreditsInput;
  ReleaseFilesInput: ReleaseFilesInput;
  ReleaseFormat: ResolverTypeWrapper<ListItemModel>;
  ReleaseInput: ReleaseInput;
  ReleaseMedium: ResolverTypeWrapper<ListItemModel>;
  ReleasePage: ResolverTypeWrapper<Omit<ReleasePage, 'items'> & { items: Array<ResolversTypes['Release']> }>;
  ReleaseSuggestion: ResolverTypeWrapper<Omit<ReleaseSuggestion, 'artists' | 'sameTitle'> & { artists: Array<ResolversTypes['ArtistSuggestion']>, sameTitle: Array<ResolversTypes['Release']> }>;
  ReleaseTag: ResolverTypeWrapper<ReleaseTagModel>;
  ReleaseTagInput: ReleaseTagInput;
  ReleaseTrackInput: ReleaseTrackInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subfolder: ResolverTypeWrapper<Subfolder>;
  Tag: ResolverTypeWrapper<TagModel>;
  TagFilterInput: TagFilterInput;
  TagInput: TagInput;
  TagPage: ResolverTypeWrapper<Omit<TagPage, 'items'> & { items: Array<ResolversTypes['Tag']> }>;
  TagRefInput: TagRefInput;
  TagType: TagType;
  TagValueCount: ResolverTypeWrapper<TagValueCount>;
  TagValuePage: ResolverTypeWrapper<TagValuePage>;
  TextTag: ResolverTypeWrapper<TagModel>;
  Track: ResolverTypeWrapper<TrackModel>;
  TrackCreditsInput: TrackCreditsInput;
  TrackInput: TrackInput;
  TrackPage: ResolverTypeWrapper<Omit<TrackPage, 'items'> & { items: Array<ResolversTypes['Track']> }>;
  TrackSuggestion: ResolverTypeWrapper<Omit<TrackSuggestion, 'artists' | 'file' | 'track'> & { artists: Array<ResolversTypes['ArtistSuggestion']>, file?: Maybe<ResolversTypes['File']>, track?: Maybe<ResolversTypes['Track']> }>;
  UpdateFileInput: UpdateFileInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Appearance: AppearanceModel;
  Artist: ArtistModel;
  ArtistCounts: ArtistCounts;
  ArtistCredit: ArtistCreditModel;
  ArtistInput: ArtistInput;
  ArtistPage: Omit<ArtistPage, 'items'> & { items: Array<ResolversParentTypes['Artist']> };
  ArtistSuggestion: Omit<ArtistSuggestion, 'artist'> & { artist?: Maybe<ResolversParentTypes['Artist']> };
  Boolean: Scalars['Boolean']['output'];
  CatalogTotals: CatalogTotals;
  Credit: CreditModel;
  CreditInput: CreditInput;
  CreditRole: ListItemModel;
  DateTag: TagModel;
  File: FileRecordModel;
  FileCounts: FileCounts;
  FileLink: FileLinkModel;
  FileLinkInput: FileLinkInput;
  FilePage: Omit<FilePage, 'items'> & { items: Array<ResolversParentTypes['File']> };
  FileRefInput: FileRefInput;
  FileUse: FileUse;
  Float: Scalars['Float']['output'];
  Folder: Omit<Folder, 'files'> & { files: Array<ResolversParentTypes['FolderFile']> };
  FolderFile: Omit<FolderFile, 'file'> & { file?: Maybe<ResolversParentTypes['File']> };
  FormatCount: FormatCountModel;
  Health: Health;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Label: LabelModel;
  LabelInput: LabelInput;
  LabelPage: Omit<LabelPage, 'items'> & { items: Array<ResolversParentTypes['Label']> };
  ListItem: ListItemModel;
  ListItemPage: Omit<ListItemPage, 'items'> & { items: Array<ResolversParentTypes['ListItem']> };
  Mutation: Record<PropertyKey, never>;
  NumberTag: TagModel;
  Query: Record<PropertyKey, never>;
  Release: ReleaseModel;
  ReleaseCreditsInput: ReleaseCreditsInput;
  ReleaseFilesInput: ReleaseFilesInput;
  ReleaseFormat: ListItemModel;
  ReleaseInput: ReleaseInput;
  ReleaseMedium: ListItemModel;
  ReleasePage: Omit<ReleasePage, 'items'> & { items: Array<ResolversParentTypes['Release']> };
  ReleaseSuggestion: Omit<ReleaseSuggestion, 'artists' | 'sameTitle'> & { artists: Array<ResolversParentTypes['ArtistSuggestion']>, sameTitle: Array<ResolversParentTypes['Release']> };
  ReleaseTag: ReleaseTagModel;
  ReleaseTagInput: ReleaseTagInput;
  ReleaseTrackInput: ReleaseTrackInput;
  String: Scalars['String']['output'];
  Subfolder: Subfolder;
  Tag: TagModel;
  TagFilterInput: TagFilterInput;
  TagInput: TagInput;
  TagPage: Omit<TagPage, 'items'> & { items: Array<ResolversParentTypes['Tag']> };
  TagRefInput: TagRefInput;
  TagValueCount: TagValueCount;
  TagValuePage: TagValuePage;
  TextTag: TagModel;
  Track: TrackModel;
  TrackCreditsInput: TrackCreditsInput;
  TrackInput: TrackInput;
  TrackPage: Omit<TrackPage, 'items'> & { items: Array<ResolversParentTypes['Track']> };
  TrackSuggestion: Omit<TrackSuggestion, 'artists' | 'file' | 'track'> & { artists: Array<ResolversParentTypes['ArtistSuggestion']>, file?: Maybe<ResolversParentTypes['File']>, track?: Maybe<ResolversParentTypes['Track']> };
  UpdateFileInput: UpdateFileInput;
};

export type AppearanceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Appearance'] = ResolversParentTypes['Appearance']> = {
  release?: Resolver<ResolversTypes['Release'], ParentType, ContextType>;
  tracks?: Resolver<Array<ResolversTypes['Track']>, ParentType, ContextType>;
};

export type ArtistResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Artist'] = ResolversParentTypes['Artist']> = {
  appearances?: Resolver<Array<ResolversTypes['Appearance']>, ParentType, ContextType>;
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  counts?: Resolver<ResolversTypes['ArtistCounts'], ParentType, ContextType>;
  credits?: Resolver<Array<ResolversTypes['ArtistCredit']>, ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['FileLink']>, ParentType, ContextType>;
  formatCounts?: Resolver<Array<ResolversTypes['FormatCount']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insertedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type ArtistCountsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArtistCounts'] = ResolversParentTypes['ArtistCounts']> = {
  appearances?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  credits?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  files?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  releases?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ArtistCreditResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArtistCredit'] = ResolversParentTypes['ArtistCredit']> = {
  release?: Resolver<ResolversTypes['Release'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['CreditRole'], ParentType, ContextType>;
  track?: Resolver<Maybe<ResolversTypes['Track']>, ParentType, ContextType>;
};

export type ArtistPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArtistPage'] = ResolversParentTypes['ArtistPage']> = {
  items?: Resolver<Array<ResolversTypes['Artist']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ArtistSuggestionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ArtistSuggestion'] = ResolversParentTypes['ArtistSuggestion']> = {
  artist?: Resolver<Maybe<ResolversTypes['Artist']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CatalogTotalsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogTotals'] = ResolversParentTypes['CatalogTotals']> = {
  artists?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  durationMs?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  labels?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  releases?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tracks?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type CreditResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Credit'] = ResolversParentTypes['Credit']> = {
  artist?: Resolver<ResolversTypes['Artist'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['CreditRole'], ParentType, ContextType>;
};

export type CreditRoleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CreditRole'] = ResolversParentTypes['CreditRole']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['ListKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DateTagResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DateTag'] = ResolversParentTypes['DateTag']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  multiValueReleases?: Resolver<ResolversTypes['ReleasePage'], ParentType, ContextType, RequireFields<DateTagMultiValueReleasesArgs, 'page' | 'perPage'>>;
  multiple?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  releaseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TagType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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

export type FileLinkResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FileLink'] = ResolversParentTypes['FileLink']> = {
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type FormatCountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FormatCount'] = ResolversParentTypes['FormatCount']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  format?: Resolver<ResolversTypes['ReleaseFormat'], ParentType, ContextType>;
};

export type HealthResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Health'] = ResolversParentTypes['Health']> = {
  database?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  migration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LabelResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Label'] = ResolversParentTypes['Label']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insertedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  releaseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type LabelPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LabelPage'] = ResolversParentTypes['LabelPage']> = {
  items?: Resolver<Array<ResolversTypes['Label']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ListItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ListItem'] = ResolversParentTypes['ListItem']> = {
  __resolveType: TypeResolveFn<'CreditRole' | 'ReleaseFormat' | 'ReleaseMedium', ParentType, ContextType>;
};

export type ListItemPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ListItemPage'] = ResolversParentTypes['ListItemPage']> = {
  items?: Resolver<Array<ResolversTypes['ListItem']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createArtist?: Resolver<ResolversTypes['Artist'], ParentType, ContextType, RequireFields<MutationCreateArtistArgs, 'input'>>;
  createLabel?: Resolver<ResolversTypes['Label'], ParentType, ContextType, RequireFields<MutationCreateLabelArgs, 'input'>>;
  createListItem?: Resolver<ResolversTypes['ListItem'], ParentType, ContextType, RequireFields<MutationCreateListItemArgs, 'kind' | 'name'>>;
  createRelease?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationCreateReleaseArgs, 'input'>>;
  createTag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType, RequireFields<MutationCreateTagArgs, 'input' | 'type'>>;
  createTrack?: Resolver<ResolversTypes['Track'], ParentType, ContextType, RequireFields<MutationCreateTrackArgs, 'input'>>;
  deleteArtist?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteArtistArgs, 'id'>>;
  deleteFile?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteFileArgs, 'id'>>;
  deleteLabel?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteLabelArgs, 'id'>>;
  deleteListItem?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteListItemArgs, 'id' | 'kind'>>;
  deleteRelease?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteReleaseArgs, 'id'>>;
  deleteTag?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteTagArgs, 'id' | 'type'>>;
  deleteTrack?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteTrackArgs, 'id'>>;
  registerFiles?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType, RequireFields<MutationRegisterFilesArgs, 'paths'>>;
  renameListItem?: Resolver<ResolversTypes['ListItem'], ParentType, ContextType, RequireFields<MutationRenameListItemArgs, 'id' | 'kind' | 'name'>>;
  setReleaseCredits?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationSetReleaseCreditsArgs, 'id' | 'input'>>;
  setReleaseFiles?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationSetReleaseFilesArgs, 'id' | 'input'>>;
  setReleaseTags?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationSetReleaseTagsArgs, 'id' | 'tags'>>;
  setReleaseTracks?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationSetReleaseTracksArgs, 'id' | 'tracks'>>;
  updateArtist?: Resolver<ResolversTypes['Artist'], ParentType, ContextType, RequireFields<MutationUpdateArtistArgs, 'id' | 'input'>>;
  updateFile?: Resolver<ResolversTypes['File'], ParentType, ContextType, RequireFields<MutationUpdateFileArgs, 'id' | 'input'>>;
  updateLabel?: Resolver<ResolversTypes['Label'], ParentType, ContextType, RequireFields<MutationUpdateLabelArgs, 'id' | 'input'>>;
  updateRelease?: Resolver<ResolversTypes['Release'], ParentType, ContextType, RequireFields<MutationUpdateReleaseArgs, 'id' | 'input'>>;
  updateTag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType, RequireFields<MutationUpdateTagArgs, 'id' | 'input' | 'type'>>;
  updateTrack?: Resolver<ResolversTypes['Track'], ParentType, ContextType, RequireFields<MutationUpdateTrackArgs, 'id' | 'input'>>;
};

export type NumberTagResolvers<ContextType = Context, ParentType extends ResolversParentTypes['NumberTag'] = ResolversParentTypes['NumberTag']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  multiValueReleases?: Resolver<ResolversTypes['ReleasePage'], ParentType, ContextType, RequireFields<NumberTagMultiValueReleasesArgs, 'page' | 'perPage'>>;
  multiple?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  releaseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TagType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  artist?: Resolver<Maybe<ResolversTypes['Artist']>, ParentType, ContextType, RequireFields<QueryArtistArgs, 'id'>>;
  artists?: Resolver<ResolversTypes['ArtistPage'], ParentType, ContextType, RequireFields<QueryArtistsArgs, 'page' | 'perPage'>>;
  catalogTotals?: Resolver<ResolversTypes['CatalogTotals'], ParentType, ContextType>;
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  fileCounts?: Resolver<ResolversTypes['FileCounts'], ParentType, ContextType>;
  files?: Resolver<ResolversTypes['FilePage'], ParentType, ContextType, RequireFields<QueryFilesArgs, 'page' | 'perPage'>>;
  folder?: Resolver<ResolversTypes['Folder'], ParentType, ContextType, RequireFields<QueryFolderArgs, 'path'>>;
  folderFiles?: Resolver<Array<ResolversTypes['FolderFile']>, ParentType, ContextType, RequireFields<QueryFolderFilesArgs, 'path'>>;
  health?: Resolver<ResolversTypes['Health'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['Label']>, ParentType, ContextType, RequireFields<QueryLabelArgs, 'id'>>;
  labels?: Resolver<ResolversTypes['LabelPage'], ParentType, ContextType, RequireFields<QueryLabelsArgs, 'page' | 'perPage'>>;
  listItem?: Resolver<Maybe<ResolversTypes['ListItem']>, ParentType, ContextType, RequireFields<QueryListItemArgs, 'id' | 'kind'>>;
  listItems?: Resolver<ResolversTypes['ListItemPage'], ParentType, ContextType, RequireFields<QueryListItemsArgs, 'kind' | 'page' | 'perPage'>>;
  release?: Resolver<Maybe<ResolversTypes['Release']>, ParentType, ContextType, RequireFields<QueryReleaseArgs, 'id'>>;
  releaseSuggestion?: Resolver<ResolversTypes['ReleaseSuggestion'], ParentType, ContextType, RequireFields<QueryReleaseSuggestionArgs, 'folder'>>;
  releases?: Resolver<ResolversTypes['ReleasePage'], ParentType, ContextType, RequireFields<QueryReleasesArgs, 'page' | 'perPage' | 'tags'>>;
  releasesTitled?: Resolver<Array<ResolversTypes['Release']>, ParentType, ContextType, RequireFields<QueryReleasesTitledArgs, 'title'>>;
  tag?: Resolver<Maybe<ResolversTypes['Tag']>, ParentType, ContextType, RequireFields<QueryTagArgs, 'id' | 'type'>>;
  tags?: Resolver<ResolversTypes['TagPage'], ParentType, ContextType, RequireFields<QueryTagsArgs, 'page' | 'perPage'>>;
  tagsByRef?: Resolver<Array<ResolversTypes['Tag']>, ParentType, ContextType, RequireFields<QueryTagsByRefArgs, 'refs'>>;
  track?: Resolver<Maybe<ResolversTypes['Track']>, ParentType, ContextType, RequireFields<QueryTrackArgs, 'id'>>;
  trackSuggestions?: Resolver<Array<ResolversTypes['TrackSuggestion']>, ParentType, ContextType, RequireFields<QueryTrackSuggestionsArgs, 'folder'>>;
  tracks?: Resolver<ResolversTypes['TrackPage'], ParentType, ContextType, RequireFields<QueryTracksArgs, 'page' | 'perPage'>>;
};

export type ReleaseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Release'] = ResolversParentTypes['Release']> = {
  artists?: Resolver<Array<ResolversTypes['Artist']>, ParentType, ContextType>;
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  catalogNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cover?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  credits?: Resolver<Array<ResolversTypes['Credit']>, ParentType, ContextType>;
  durationMs?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  fileCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['FileLink']>, ParentType, ContextType>;
  formats?: Resolver<Array<ResolversTypes['ReleaseFormat']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insertedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['Label']>, ParentType, ContextType>;
  media?: Resolver<Array<ResolversTypes['ReleaseMedium']>, ParentType, ContextType>;
  released?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['ReleaseTag']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tracks?: Resolver<Array<ResolversTypes['Track']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  variousArtists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type ReleaseFormatResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ReleaseFormat'] = ResolversParentTypes['ReleaseFormat']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['ListKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ReleaseMediumResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ReleaseMedium'] = ResolversParentTypes['ReleaseMedium']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['ListKind'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ReleasePageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ReleasePage'] = ResolversParentTypes['ReleasePage']> = {
  items?: Resolver<Array<ResolversTypes['Release']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ReleaseSuggestionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ReleaseSuggestion'] = ResolversParentTypes['ReleaseSuggestion']> = {
  artists?: Resolver<Array<ResolversTypes['ArtistSuggestion']>, ParentType, ContextType>;
  images?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  music?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  others?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  released?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sameTitle?: Resolver<Array<ResolversTypes['Release']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ReleaseTagResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ReleaseTag'] = ResolversParentTypes['ReleaseTag']> = {
  tag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType>;
  values?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type SubfolderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subfolder'] = ResolversParentTypes['Subfolder']> = {
  hasRegisteredFiles?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TagResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Tag'] = ResolversParentTypes['Tag']> = {
  __resolveType: TypeResolveFn<'DateTag' | 'NumberTag' | 'TextTag', ParentType, ContextType>;
};

export type TagPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TagPage'] = ResolversParentTypes['TagPage']> = {
  items?: Resolver<Array<ResolversTypes['Tag']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type TagValueCountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TagValueCount'] = ResolversParentTypes['TagValueCount']> = {
  releases?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TagValuePageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TagValuePage'] = ResolversParentTypes['TagValuePage']> = {
  items?: Resolver<Array<ResolversTypes['TagValueCount']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type TextTagResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TextTag'] = ResolversParentTypes['TextTag']> = {
  blockers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  multiValueReleases?: Resolver<ResolversTypes['ReleasePage'], ParentType, ContextType, RequireFields<TextTagMultiValueReleasesArgs, 'page' | 'perPage'>>;
  multiple?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  releaseCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TagType'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['TagValuePage'], ParentType, ContextType, RequireFields<TextTagValuesArgs, 'page' | 'perPage'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrackResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Track'] = ResolversParentTypes['Track']> = {
  artists?: Resolver<Array<ResolversTypes['Artist']>, ParentType, ContextType>;
  cdNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  credits?: Resolver<Array<ResolversTypes['Credit']>, ParentType, ContextType>;
  durationMs?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  features?: Resolver<Array<ResolversTypes['Artist']>, ParentType, ContextType>;
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['FileLink']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insertedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  performers?: Resolver<Array<ResolversTypes['Artist']>, ParentType, ContextType>;
  release?: Resolver<ResolversTypes['Release'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  trackNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type TrackPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TrackPage'] = ResolversParentTypes['TrackPage']> = {
  items?: Resolver<Array<ResolversTypes['Track']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type TrackSuggestionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TrackSuggestion'] = ResolversParentTypes['TrackSuggestion']> = {
  artists?: Resolver<Array<ResolversTypes['ArtistSuggestion']>, ParentType, ContextType>;
  cdNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  durationMs?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  track?: Resolver<Maybe<ResolversTypes['Track']>, ParentType, ContextType>;
  trackNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Appearance?: AppearanceResolvers<ContextType>;
  Artist?: ArtistResolvers<ContextType>;
  ArtistCounts?: ArtistCountsResolvers<ContextType>;
  ArtistCredit?: ArtistCreditResolvers<ContextType>;
  ArtistPage?: ArtistPageResolvers<ContextType>;
  ArtistSuggestion?: ArtistSuggestionResolvers<ContextType>;
  CatalogTotals?: CatalogTotalsResolvers<ContextType>;
  Credit?: CreditResolvers<ContextType>;
  CreditRole?: CreditRoleResolvers<ContextType>;
  DateTag?: DateTagResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FileCounts?: FileCountsResolvers<ContextType>;
  FileLink?: FileLinkResolvers<ContextType>;
  FilePage?: FilePageResolvers<ContextType>;
  FileUse?: FileUseResolvers<ContextType>;
  Folder?: FolderResolvers<ContextType>;
  FolderFile?: FolderFileResolvers<ContextType>;
  FormatCount?: FormatCountResolvers<ContextType>;
  Health?: HealthResolvers<ContextType>;
  Label?: LabelResolvers<ContextType>;
  LabelPage?: LabelPageResolvers<ContextType>;
  ListItem?: ListItemResolvers<ContextType>;
  ListItemPage?: ListItemPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NumberTag?: NumberTagResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Release?: ReleaseResolvers<ContextType>;
  ReleaseFormat?: ReleaseFormatResolvers<ContextType>;
  ReleaseMedium?: ReleaseMediumResolvers<ContextType>;
  ReleasePage?: ReleasePageResolvers<ContextType>;
  ReleaseSuggestion?: ReleaseSuggestionResolvers<ContextType>;
  ReleaseTag?: ReleaseTagResolvers<ContextType>;
  Subfolder?: SubfolderResolvers<ContextType>;
  Tag?: TagResolvers<ContextType>;
  TagPage?: TagPageResolvers<ContextType>;
  TagValueCount?: TagValueCountResolvers<ContextType>;
  TagValuePage?: TagValuePageResolvers<ContextType>;
  TextTag?: TextTagResolvers<ContextType>;
  Track?: TrackResolvers<ContextType>;
  TrackPage?: TrackPageResolvers<ContextType>;
  TrackSuggestion?: TrackSuggestionResolvers<ContextType>;
};

