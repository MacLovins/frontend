const MAX_IMPORT_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_ROWS = 5000

export type CsvFile = {
  file: File
  delimiter: string
  headers: string[]
  /** Data rows without blank lines, so `rows[n - 1]` is the server's "Row n". */
  rows: string[][]
}

type CsvReadError =
  "tooLarge" | "emptyFile" | "noRows" | "tooManyRows" | "notUtf8" | "unreadable"

/** The server picks the most frequent of `,` `;` tab in the header line (backend importer.py `parse_csv`). */
function detectDelimiter(text: string) {
  const headerLine = text.split(/\r\n|\r|\n/, 1)[0] ?? ""
  const candidates = [",", ";", "\t"]
  const count = (delimiter: string) => headerLine.split(delimiter).length - 1
  return candidates.reduce((best, candidate) =>
    count(candidate) > count(best) ? candidate : best
  )
}

/** RFC 4180 records (quoted fields may hold delimiters, quotes and newlines). Blank lines are skipped like Python's csv reader. */
function parseRecords(text: string, delimiter: string) {
  const records: string[][] = []
  let record: string[] = []
  let field = ""
  let started = false
  let quoted = false

  const endRecord = () => {
    if (started) records.push([...record, field])
    record = []
    field = ""
    started = false
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field === "") {
      quoted = true
      started = true
    } else if (char === delimiter) {
      record.push(field)
      field = ""
      started = true
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index += 1
      endRecord()
    } else {
      field += char
      started = true
    }
  }
  endRecord()
  return records
}

export async function readCsv(file: File): Promise<CsvFile | CsvReadError> {
  if (file.size > MAX_IMPORT_BYTES) return "tooLarge"
  if (file.size === 0) return "emptyFile"

  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer()
    )
  } catch (error) {
    return error instanceof TypeError ? "notUtf8" : "unreadable"
  }
  text = text.replace(/^\uFEFF/, "")
  if (!text.trim()) return "emptyFile"

  const delimiter = detectDelimiter(text)
  const [headers = [], ...rows] = parseRecords(text, delimiter)
  if (rows.length === 0) return "noRows"
  if (rows.length > MAX_IMPORT_ROWS) return "tooManyRows"
  return {
    file,
    delimiter,
    headers: headers.map((header) => header.trim()),
    rows,
  }
}

function escapeField(value: string, delimiter: string) {
  return /["\r\n]/.test(value) || value.includes(delimiter)
    ? `"${value.replace(/"/g, '""')}"`
    : value
}

/** The rows the server rejected ("Row 3: missing domain"), with the reason in an extra "error" column. */
export function errorRowsCsv(csv: CsvFile, errors: string[]) {
  const lines = [[...csv.headers, "error"]]
  for (const message of errors) {
    const match = /^Row (\d+): (.*)$/.exec(message)
    const row = match ? csv.rows[Number(match[1]) - 1] : undefined
    if (match && row) lines.push([...row, match[2]])
  }
  return lines
    .map((line) =>
      line.map((value) => escapeField(value, csv.delimiter)).join(csv.delimiter)
    )
    .join("\r\n")
}

export function downloadText(content: string, filename: string) {
  // The BOM makes Excel open the file as UTF-8; the importer strips it.
  const url = URL.createObjectURL(
    new Blob(["﻿", content], { type: "text/csv;charset=utf-8" })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function errorsFilename(original: string) {
  return `${original.replace(/\.csv$/i, "")}-errors.csv`
}
