import { useQuery } from "@apollo/client/react"
import { FolderIcon, FolderUpIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { FILE_TYPE_LABELS, FileTypeIcon } from "@/components/file-type"
import { QueryError } from "@/components/query-error"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { graphql } from "@/gql"
import { formatSize } from "@/lib/format"

const FolderQuery = graphql(`
  query Folder($path: String!) {
    folder(path: $path) {
      path
      absolutePath
      parent
      folders {
        name
        path
        hasRegisteredFiles
      }
      files {
        name
        path
        type
        sizeBytes
        file {
          id
        }
      }
    }
  }
`)

/**
 * Browses the disk from the folder that holds slunk.db: a folder's
 * subfolders, `..` to go up, and the files directly inside. Folders that
 * hold registered files are marked. It only reads.
 */
export function FolderBrowser({
  path,
  linkTo,
  actions,
}: {
  /** The folder, relative to the database's folder */
  path: string
  /** Where a folder's link goes */
  linkTo: (path: string) => string
  /** Buttons for the folder, like "Choose this folder" */
  actions?: ReactNode
}) {
  const { data, error } = useQuery(FolderQuery, { variables: { path } })

  if (error) return <QueryError error={error} title="Can't open the folder" />
  if (!data) return <Skeleton className="h-48 w-full" />
  const { folder } = data

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs break-all">{folder.absolutePath}</p>
        {actions}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {folder.parent !== null && (
            <TableRow>
              <TableCell colSpan={4}>
                <Link
                  to={linkTo(folder.parent)}
                  className="flex items-center gap-2 hover:underline [&_svg]:size-4"
                >
                  <FolderUpIcon />
                  ..
                </Link>
              </TableCell>
            </TableRow>
          )}
          {folder.folders.map((sub) => (
            <TableRow key={sub.path}>
              <TableCell colSpan={3}>
                <Link
                  to={linkTo(sub.path)}
                  className="flex items-center gap-2 hover:underline [&_svg]:size-4"
                >
                  <FolderIcon />
                  {sub.name}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {sub.hasRegisteredFiles && (
                  <Badge variant="secondary">Has registered files</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
          {folder.files.map((file) => (
            <TableRow key={file.path}>
              <TableCell>
                <span className="flex items-center gap-2 text-muted-foreground [&_svg]:size-4">
                  <FileTypeIcon type={file.type} />
                  <span className="text-foreground">{file.name}</span>
                </span>
              </TableCell>
              <TableCell>{FILE_TYPE_LABELS[file.type]}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatSize(file.sizeBytes)}
              </TableCell>
              <TableCell className="text-right">
                {file.file && (
                  <Badge
                    variant="secondary"
                    render={<Link to={`/files/${file.file.id}`} />}
                  >
                    Registered
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
          {folder.folders.length === 0 && folder.files.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                This folder is empty.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
