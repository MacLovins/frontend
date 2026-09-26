import { useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { useImportCompaniesCsv } from "@/api/generated/accounts/accounts"
import type {
  CompanyImportReport,
  ImportCompaniesCsvMapping,
} from "@/api/generated/model"
import { errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  DialogBar,
  DialogBody,
  ErrorBox,
} from "@/features/accounts/components/dialog-parts"
import {
  CustomColumns,
  MatchedColumns,
} from "@/features/accounts/components/import/column-preview"
import { FilePicker } from "@/features/accounts/components/import/file-picker"
import { FormatTiles } from "@/features/accounts/components/import/format-tiles"
import { ImportReport } from "@/features/accounts/components/import/import-report"
import { copy } from "@/features/accounts/copy"
import { useAnalyzeNew } from "@/features/accounts/hooks/use-analyze-new"
import { invalidateCompanyLists } from "@/features/accounts/lib/cache"
import {
  downloadText,
  errorRowsCsv,
  errorsFilename,
  readCsv,
  type CsvFile,
} from "@/features/accounts/lib/csv"
import {
  customDefaults,
  matchColumns,
  missingRequired,
  type ColumnMap,
} from "@/features/accounts/lib/csv-mapping"

type Result = { report: CompanyImportReport; runId: string | null }

type StepProps = {
  busy: boolean
  onBusyChange: (busy: boolean) => void
  onClose: () => void
}

function ReportStep({
  csv,
  result,
  busy,
  onBusyChange,
  onClose,
}: StepProps & { csv: CsvFile; result: Result }) {
  const navigate = useNavigate()
  const { analyzeNew, runPath } = useAnalyzeNew()
  const { report, runId } = result

  const analyze = async () => {
    onBusyChange(true)
    const id = await analyzeNew(report.created).finally(() =>
      onBusyChange(false)
    )
    if (!id) return
    onClose()
    void navigate(runPath(id))
  }

  return (
    <>
      <DialogBody>
        <ImportReport report={report} />
      </DialogBody>
      <DialogFooter>
        {report.errors.length > 0 ? (
          <Button
            variant="link"
            className="mr-auto text-[13px]"
            onClick={() =>
              downloadText(
                errorRowsCsv(csv, report.errors),
                errorsFilename(csv.file.name)
              )
            }
          >
            {copy.import.downloadErrors(report.errors.length)}
          </Button>
        ) : null}
        <Button variant="outline" disabled={busy} onClick={onClose}>
          {copy.import.done}
        </Button>
        {runId ? (
          <Button
            nativeButton={false}
            render={<Link to={runPath(runId)} />}
            onClick={onClose}
          >
            {copy.import.openRun}
          </Button>
        ) : report.created > 0 ? (
          <Button disabled={busy} onClick={() => void analyze()}>
            {busy ? <Spinner /> : null}
            {busy
              ? copy.import.starting
              : copy.import.analyzeNew(report.created)}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  )
}

function CsvImport({ busy, onBusyChange, onClose }: StepProps) {
  const queryClient = useQueryClient()
  const [mapping, setMapping] = useState<ImportCompaniesCsvMapping>("default")
  const [csv, setCsv] = useState<CsvFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [customColumns, setCustomColumns] = useState<ColumnMap>({})
  const [analyze, setAnalyze] = useState(true)
  const [result, setResult] = useState<Result | null>(null)
  const latestFile = useRef<File | null>(null)
  const importCsv = useImportCompaniesCsv({
    mutation: { meta: { errorToast: false } },
  })
  const { analyzeNew } = useAnalyzeNew()

  if (csv && result) {
    return (
      <ReportStep
        csv={csv}
        result={result}
        busy={busy}
        onBusyChange={onBusyChange}
        onClose={onClose}
      />
    )
  }

  const columns = !csv
    ? {}
    : mapping === "custom"
      ? customColumns
      : matchColumns(csv.headers, mapping)
  const ready = csv !== null && missingRequired(columns).length === 0

  const chooseFile = async (file: File) => {
    latestFile.current = file
    importCsv.reset()
    const read = await readCsv(file)
    // A slower read of an earlier pick must not replace the newer file.
    if (latestFile.current !== file) return
    if (typeof read === "string") {
      setCsv(null)
      setFileError(copy.import[read])
      return
    }
    setCsv(read)
    setFileError(null)
    setCustomColumns(customDefaults(read.headers))
  }

  const submit = async () => {
    if (!csv || !ready) return
    onBusyChange(true)
    try {
      const report = await importCsv
        .mutateAsync({
          data: {
            file: csv.file,
            ...(mapping === "custom"
              ? { column_map: JSON.stringify(customColumns) }
              : {}),
          },
          params: { mapping, on_duplicate: "merge" },
        })
        .catch(() => null)
      if (!report) return
      void invalidateCompanyLists(queryClient)
      toast.success(copy.import.imported(report.created, report.updated))
      const runId =
        analyze && report.created > 0 ? await analyzeNew(report.created) : null
      setResult({ report, runId })
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <>
      <DialogBody>
        <FormatTiles
          value={mapping}
          onChange={(next) => {
            importCsv.reset()
            setMapping(next)
          }}
          disabled={busy}
        />
        <FilePicker
          csv={csv}
          error={fileError}
          disabled={busy}
          onFile={(file) => void chooseFile(file)}
        />
        {csv && mapping === "custom" ? (
          <CustomColumns
            headers={csv.headers}
            columns={customColumns}
            onChange={(next) => {
              importCsv.reset()
              setCustomColumns(next)
            }}
            disabled={busy}
          />
        ) : null}
        {csv && mapping !== "custom" ? (
          <MatchedColumns columns={columns} />
        ) : null}
        <Label className="gap-2.5 text-sm text-black">
          <Checkbox
            checked={analyze}
            onCheckedChange={setAnalyze}
            disabled={busy}
            className="size-[18px]"
          />
          {copy.import.analyze}
        </Label>
        {importCsv.error ? (
          <ErrorBox>{errorMessage(importCsv.error)}</ErrorBox>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>
          {copy.import.cancel}
        </Button>
        <Button disabled={!ready || busy} onClick={() => void submit()}>
          {busy ? <Spinner /> : null}
          {busy
            ? copy.import.importing
            : csv
              ? copy.import.submit(csv.rows.length)
              : copy.import.submitNoFile}
        </Button>
      </DialogFooter>
    </>
  )
}

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent showCloseButton={false}>
        <DialogBar title={copy.import.title} closeDisabled={busy} />
        <CsvImport
          busy={busy}
          onBusyChange={setBusy}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
