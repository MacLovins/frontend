import { FileMagnifyingGlassIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import type {
  DocumentOut,
  PaginatedResponseDocumentOut,
} from "@/api/generated/model"
import { ErrorState } from "@/components/common/states"
import { InfoTip } from "@/components/common/info-tip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"

import { collectorLabel, sourceTypeSingular } from "../lib/copy"
import {
  documentUsage,
  type DocumentUsage,
  type SignalTallies,
} from "../lib/document-usage"
import { hostname, plural } from "../lib/text"
import type { Analysis } from "./company-header"
import { ExternalLink } from "./external-link"
import { IconEmptyState } from "./icon-empty-state"

const GRID =
  "grid grid-cols-[minmax(0,1fr)_150px_96px_48px_120px] items-center px-4"
const TITLE_MAX = 60

function documentTitle(document: DocumentOut) {
  if (document.title) return document.title
  let path = ""
  try {
    path = new URL(document.url).pathname.replace(/\/$/, "")
  } catch {
    // A malformed URL still has a host-ish label below.
  }
  const text = `${hostname(document.url)}${path}`
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1)}…` : text
}

const usageStyles: Record<DocumentUsage["kind"], string> = {
  signals: "font-bold text-positive-strong",
  rejected: "font-bold text-negative-strong",
  irrelevant: "text-muted-foreground",
  firmographics: "text-muted-foreground",
  none: "text-muted-foreground",
}

function usageText(usage: DocumentUsage) {
  if (usage.kind === "signals") return plural(usage.count, "signal")
  if (usage.kind === "irrelevant") return "not relevant"
  if (usage.kind === "none") return "—"
  return usage.kind
}

function DocumentRow({
  document,
  usage,
}: {
  document: DocumentOut
  usage: DocumentUsage
}) {
  return (
    <div
      role="row"
      className={cn(
        GRID,
        "min-h-[52px] border-b border-subtle py-1.5 text-[13px] last:border-b-0"
      )}
    >
      <div role="cell" className="flex min-w-0 flex-col gap-0.5 pr-3">
        <ExternalLink
          href={document.url}
          className="line-clamp-2 text-sm font-semibold no-underline"
        >
          {documentTitle(document)} ↗
        </ExternalLink>
        <span className="text-xs text-muted-foreground">
          {sourceTypeSingular[document.source_type]}
        </span>
      </div>
      <div role="cell" className="truncate pr-2 text-text-secondary">
        {collectorLabel(document.source_name, document.url)}
      </div>
      <div role="cell" className="font-mono text-xs">
        {document.published_at ? formatDate(document.published_at) : "—"}
      </div>
      <div role="cell" className="text-xs text-muted-foreground">
        {document.language ? document.language.slice(0, 2).toUpperCase() : "—"}
      </div>
      <div role="cell" className={cn("text-xs", usageStyles[usage.kind])}>
        {usageText(usage)}
      </div>
    </div>
  )
}

export function DocumentsTable({
  documents,
  isLoading,
  isPlaceholder,
  error,
  onRetry,
  tallies,
  serviceName,
  collectedCount,
  pageSize,
  onPage,
  analysis,
}: {
  documents: PaginatedResponseDocumentOut | undefined
  isLoading: boolean
  isPlaceholder: boolean
  error: unknown
  onRetry: () => void
  tallies: SignalTallies
  serviceName: string | undefined
  collectedCount: number
  pageSize: number
  onPage: (page: number) => void
  analysis: Analysis
}) {
  const header = (
    <div
      role="row"
      className={cn(
        GRID,
        "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
      )}
    >
      <span role="columnheader">Document</span>
      <span role="columnheader">Source</span>
      <span role="columnheader">Published</span>
      <span role="columnheader">Lang</span>
      <span role="columnheader" className="flex items-center gap-1.5">
        Used
        {serviceName ? (
          <InfoTip label="Used">
            Signals for {serviceName} that quote this document
          </InfoTip>
        ) : null}
      </span>
    </div>
  )

  // Rows go inside the ARIA table; loading, empty and error blocks are not rows, so they sit below it.
  let rows = null
  let state = null
  if (error && !documents) {
    state = (
      <ErrorState
        title="Couldn't load documents"
        error={error}
        onRetry={onRetry}
      />
    )
  } else if (isLoading || !documents) {
    state = (
      <div aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className={cn(GRID, "h-[52px] gap-3 border-b border-subtle")}
          >
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    )
  } else if (!documents.items.length) {
    state =
      collectedCount === 0 ? (
        <IconEmptyState
          icon={
            <FileMagnifyingGlassIcon
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
          }
          title="Nothing collected yet"
          actions={
            <Button onClick={analysis.start} disabled={analysis.busy}>
              {analysis.busy ? analysis.label : "Analyze now"}
            </Button>
          }
        >
          Run an analysis to collect job postings, news, website pages and
          reports.
        </IconEmptyState>
      ) : (
        <p className="m-0 px-4 py-10 text-center text-[13px] text-muted-foreground">
          No documents of this type.
        </p>
      )
  } else {
    rows = documents.items.map((document) => (
      <DocumentRow
        key={document.id}
        document={document}
        usage={documentUsage(document, tallies)}
      />
    ))
  }

  const total = documents?.total ?? 0
  const page = documents?.page ?? 1
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        role="table"
        aria-label="Documents"
        aria-busy={isPlaceholder || undefined}
        className={cn(isPlaceholder && "opacity-60")}
      >
        {header}
        {rows}
      </div>
      {state}
      {total > pageSize ? (
        <div className="flex h-12 items-center justify-between border-t border-subtle px-4 text-[13px] text-muted-foreground">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={to >= total}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
