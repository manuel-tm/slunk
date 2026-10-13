import { useMutation, useQuery } from "@apollo/client/react"
import { CircleAlertIcon, ExternalLinkIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { ButtonLink } from "@/components/button-link"
import { FILE_TYPE_LABELS } from "@/components/file-type"
import { PageHeader } from "@/components/page-header"
import { QueryError } from "@/components/query-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { graphql } from "@/gql"
import type { FileQuery, FileUseKind } from "@/gql/graphql"
import { formatDateTime, formatSize } from "@/lib/format"
import { cn } from "@/lib/utils"
import { NotFound } from "@/routes/not-found"

const FileQueryDocument = graphql(`
  query File($id: ID!) {
    file(id: $id) {
      id
      path
      name
      type
      sizeBytes
      mtime
      sha256
      insertedAt
      updatedAt
      onDisk
      uses {
        kind
        entityId
        name
        note
      }
    }
  }
`)

const DeleteFileMutation = graphql(`
  mutation DeleteFile($id: ID!) {
    deleteFile(id: $id)
  }
`)

const USE_LABELS: Record<FileUseKind, string> = {
  track_audio: "Audio of track",
  release_cover: "Cover of release",
  artist_picture: "Picture of artist",
  label_picture: "Logo of label",
  release_link: "Linked to release",
  artist_link: "Linked to artist",
  track_link: "Linked to track",
}

type File = NonNullable<FileQuery["file"]>

/** `/files/:id` (design §7.8) */
export function FileRead() {
  const { id = "" } = useParams()
  const { data, error } = useQuery(FileQueryDocument, { variables: { id } })

  if (data && !data.file) return <NotFound />
  const file = data?.file

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Files", to: "/files" },
          { label: file ? `${file.name} (${file.id})` : id },
        ]}
      >
        {file && (
          <>
            <ButtonLink variant="outline" to={`/files/${file.id}/update`}>
              Edit
            </ButtonLink>
            <DeleteFile file={file} />
          </>
        )}
      </PageHeader>
      <div className="flex flex-col gap-4 p-4">
        {error ? (
          <QueryError error={error} title="Can't load the file" />
        ) : !file ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {!file.onDisk && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>The file is missing on disk</AlertTitle>
                <AlertDescription>
                  Nothing is at its path anymore. If it moved, relink it from
                  Edit.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Preview file={file} />
              <Details file={file} />
            </div>
            <Uses file={file} />
          </>
        )}
      </div>
    </>
  )
}

/** The image, an audio player, or a link that opens the file. */
function Preview({ file }: { file: File }) {
  const src = `/raw/files/${file.id}`
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3">
        {file.type === "image" && file.onDisk && (
          <img
            src={src}
            alt={file.name}
            className="max-h-96 max-w-full object-contain"
          />
        )}
        {file.type === "music" && file.onDisk && (
          <audio controls preload="metadata" src={src} className="w-full" />
        )}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          Open the file
        </a>
      </CardContent>
    </Card>
  )
}

function Details({ file }: { file: File }) {
  const rows: [string, string][] = [
    ["Path", file.path],
    ["Type", FILE_TYPE_LABELS[file.type]],
    ["Size", `${formatSize(file.sizeBytes)} (${file.sizeBytes} bytes)`],
    ["Modified", formatDateTime(file.mtime)],
    ["SHA-256", file.sha256],
    ["Added", formatDateTime(file.insertedAt)],
    ["Updated", formatDateTime(file.updatedAt)],
  ]
  return (
    <dl className="grid h-fit grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd
            className={
              label === "Path" || label === "SHA-256"
                ? "font-mono break-all"
                : undefined
            }
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Everything that uses the file. Those uses are what block a delete. */
function Uses({ file }: { file: File }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Used by</CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        {file.uses.length === 0 ? (
          <p className="text-muted-foreground">Nothing uses this file yet.</p>
        ) : (
          <UseList uses={file.uses} />
        )}
        {file.type === "music" &&
          !file.uses.some((use) => use.kind === "track_audio") && (
            <ButtonLink
              variant="outline"
              size="sm"
              className="mt-3"
              to={`/tracks/create?file=${file.id}`}
            >
              Create track
            </ButtonLink>
          )}
      </CardContent>
    </Card>
  )
}

const USE_URLS: Record<FileUseKind, string> = {
  track_audio: "/tracks",
  release_cover: "/releases",
  artist_picture: "/artists",
  label_picture: "/labels",
  release_link: "/releases",
  artist_link: "/artists",
  track_link: "/tracks",
}

function UseList({ uses }: { uses: File["uses"] }) {
  return (
    <ul className="flex flex-col gap-1">
      {uses.map((use) => (
        <li key={`${use.kind}-${use.entityId}`}>
          <span className="text-muted-foreground">{USE_LABELS[use.kind]}</span>{" "}
          <Link
            to={`${USE_URLS[use.kind]}/${use.entityId}`}
            className="hover:underline"
          >
            {use.name}
          </Link>
          {use.note && (
            <span className="text-muted-foreground"> ({use.note})</span>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Deletes the record, after a confirmation. While anything uses the file,
 * the dialog says what instead (design §7.2).
 */
function DeleteFile({ file }: { file: File }) {
  const navigate = useNavigate()
  const [deleteFile, { loading, error }] = useMutation(DeleteFileMutation, {
    variables: { id: file.id },
    update: (cache) => {
      cache.evict({ id: cache.identify({ __typename: "File", id: file.id }) })
      cache.gc()
    },
  })
  const used = file.uses.length > 0

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {used ? "This file is in use" : "Delete this file's record?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {used
              ? "It can't be deleted while these use it:"
              : `Slunk forgets ${file.name}. The file on disk isn't touched.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {used && (
          <div className="text-xs">
            <UseList uses={file.uses} />
          </div>
        )}
        {error && <QueryError error={error} title="Can't delete it" />}
        <AlertDialogFooter>
          <AlertDialogCancel>{used ? "Close" : "Cancel"}</AlertDialogCancel>
          {!used && (
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={async () => {
                try {
                  await deleteFile()
                } catch {
                  return // The dialog shows the error
                }
                toast.success(`Deleted the record of ${file.name}`)
                navigate("/files")
              }}
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
