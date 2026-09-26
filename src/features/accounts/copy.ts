import type {
  CompanyOrigin,
  ImportCompaniesCsvMapping,
} from "@/api/generated/model"
import { formatNumber } from "@/lib/format"

/** "1 company", "58 companies". */
function plural(count: number, one: string, many = `${one}s`) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`
}

export const MAX_RUN_COMPANIES = 500

export const copy = {
  title: "Accounts",
  close: "Close",
  subtitle: (total: number, tracked: number) =>
    `${plural(total, "company", "companies")} · ${formatNumber(tracked)} monitored`,
  addCompany: "Add company",
  importCsv: "Import CSV",
  discover: "Discover by ICP",

  searchPlaceholder: "Search name or domain",
  searchLabel: "Search accounts",
  monitoringLabel: "Monitoring",
  monitoringValue: (option: string) => `Monitoring: ${option.toLowerCase()}`,
  selected: (count: number) => `${formatNumber(count)} selected`,
  analyzeSelected: "Analyze selected",
  runLimit: "Up to 500 companies per run",
  analysisStarted: (count: number) =>
    `Analysis started for ${plural(count, "company", "companies")}`,

  columns: {
    select: "Select all companies on this page",
    company: "Company",
    country: "Country",
    industry: "Industry",
    employees: "Employees",
    origin: "Origin",
    sources: "Sources found",
    lastAnalysed: "Last analysed",
    actions: "Actions",
  },
  sourcesHelp:
    "Documents collected for this company: news, site pages, job ads and reports. The bar is full at 100.",
  never: "Never",
  notMonitored: "Not monitored",
  selectRow: (name: string) => `Select ${name}`,
  rowActions: (name: string) => `Actions for ${name}`,

  empty: {
    title: "No accounts yet",
    body: "Import a CSV, add a company or discover companies that match your ICP.",
    noMatch: (q: string) => `No companies match “${q}”.`,
    clearSearch: "Clear search",
    // Only the monitoring filter is active (the spec covers the search case only).
    noFilterMatch: "No companies match this filter.",
    clearFilter: "Show all companies",
  },
  loadError: "Could not load accounts.",
  pagination: "Pagination",
  range: (from: number, to: number, total: number) =>
    `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`,
  previous: "Previous",
  next: "Next",

  actions: {
    open: "Open company",
    stopMonitoring: "Stop monitoring",
    resumeMonitoring: "Resume monitoring",
    stopped: (name: string) => `Stopped monitoring ${name}`,
    resumed: (name: string) => `Resumed monitoring ${name}`,
    delete: "Delete…",
    deleteTitle: (name: string) => `Delete ${name}?`,
    deleteBody:
      "Its documents, signals and scores are deleted too. This cannot be undone.",
    cancel: "Cancel",
    confirmDelete: "Delete",
    deleting: "Deleting…",
    deleted: (name: string) => `${name} deleted`,
  },

  add: {
    title: "Add company",
    name: "Company name",
    domain: "Website or domain",
    domainPlaceholder: "dhl.com",
    country: "Country",
    industry: "Industry",
    employees: "Employees",
    notSet: "Not set",
    analyze: "Analyze it right away",
    cancel: "Cancel",
    submit: "Add company",
    submitting: "Adding…",
    nameRequired: "Enter the company name.",
    domainRequired: "Enter the website or domain.",
    invalidDomain: "Enter a website such as dhl.com.",
    duplicateDomain: "This domain is already in your accounts.",
    wholeNumber: "Enter a whole number.",
    added: (name: string) => `${name} added`,
    addedAndStarted: (name: string) => `${name} added · analysis started`,
    viewRun: "View run",
  },

  import: {
    title: "Import accounts from CSV",
    format: "File format",
    dropHere: "Drop a CSV file here or",
    chooseFile: "choose a file",
    fileHelp: "UTF-8, up to 5 MB and 5,000 rows.",
    fileMeta: (rows: number, kb: number) =>
      `${plural(rows, "row")} · ${formatNumber(kb)} KB`,
    replaceFile: "Replace file",
    matched: "Columns matched automatically",
    custom: "Match columns",
    notImported: "Not imported",
    missingColumn: (field: "Name" | "Domain") =>
      `No column for ${field} — pick another format or use Custom columns.`,
    analyze:
      "Analyze the new companies right away, as one run with live progress",
    cancel: "Cancel",
    submit: (rows: number) => `Import ${plural(rows, "row")}`,
    submitNoFile: "Import",
    importing: "Importing…",
    tooLarge: "The file is larger than 5 MB.",
    emptyFile: "The file is empty.",
    noRows: "The file has a header but no data rows.",
    tooManyRows: "The file has more than 5,000 rows.",
    notUtf8:
      "The file is not UTF-8 encoded. Save it as “CSV UTF-8” and try again.",
    unreadable: "The file could not be read.",

    stats: {
      created: "new",
      updated: "updated · empty fields filled",
      skipped: "skipped · duplicate or no new data",
      errors: "errors",
    },
    warnings: (count: number) => plural(count, "warning"),
    downloadErrors: (count: number) =>
      `Download the ${plural(count, "row")} with errors`,
    done: "Done",
    openRun: "Open run",
    analyzeNew: (count: number) =>
      `Analyze ${plural(count, "new company", "new companies")}`,
    starting: "Starting…",
    imported: (created: number, updated: number) =>
      `Imported: ${formatNumber(created)} new, ${formatNumber(updated)} updated`,
    partialRun: (created: number) =>
      `Started analysis for 500 of ${formatNumber(created)} new companies`,
  },
}

export const originLabels: Record<CompanyOrigin, string> = {
  discovery: "Discovery",
  csv: "CSV",
  manual: "Manual",
}

export const formatLabels: Record<ImportCompaniesCsvMapping, string> = {
  default: "LeadRadar template",
  crunchbase: "Crunchbase export",
  custom: "Custom columns",
}

export const monitoringOptions = {
  all: "All",
  yes: "Monitored",
  no: "Not monitored",
} as const

export type Monitoring = keyof typeof monitoringOptions
