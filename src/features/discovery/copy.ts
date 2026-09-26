/** "1 company", "3 companies". */
function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export const copy = {
  title: "Discover companies",
  subtitle: "Find companies that match the ICP but aren't in your accounts yet",

  panel: {
    title: "Search, pre-filled from the ICP",
    service: "Service",
    countries: "Countries",
    industries: "Industries",
    employees: "Employees, at least",
    employeesPlaceholder: "No minimum",
    sources: "Sources",
    // parser.discover queries Wikidata only; GLEIF and Crunchbase enrich companies later, during analysis.
    sourcesText:
      "Wikidata, the public company registry. All public, no LinkedIn.",
    search: "Search",
    searching: "Searching…",
    incomplete: "Pick at least one country and one industry.",
    noIcp: "This service has no ICP yet.",
    setUpIcp: "Set up the ICP",
    askAdmin: "Ask an admin to set it up.",
  },

  picker: {
    countries: {
      search: "Search countries",
      empty: "No country found.",
      pick: "Pick countries",
      edit: "Edit countries",
    },
    industries: {
      search: "Search industries",
      empty: "No industry found.",
      pick: "Pick industries",
      edit: "Edit industries",
    },
    more: (count: number) => `+ ${count} more`,
    moreFromIcp: (count: number) => `+ ${count} more from ICP`,
    reset: "Reset to ICP",
  },

  results: {
    intro: {
      title: "Search to see companies that match the ICP",
      body: "The search reads public registries and can take up to a minute.",
    },
    searching: "Searching public registries…",
    candidates: (total: number) => plural(total, "candidate"),
    sorted: (tracked: number) =>
      tracked > 0
        ? `sorted by ICP fit, then size · ${tracked} already in your accounts`
        : "sorted by ICP fit, then size",
    empty: {
      title: "No companies found",
      body: "Widen the countries or industries, or lower the employee minimum.",
    },
    columns: {
      company: "Company",
      country: "Country",
      industry: "Industry",
      employees: "Employees",
      fit: "ICP fit",
      why: "Why it fits",
    },
    selectAll: "Select all companies that are not in your accounts",
    inList: "In list",
    alreadyTracked: "Already in your accounts",
    tryAgain: "Try again",
  },

  errors: {
    timeout:
      "The registry search took longer than 60 s. Narrow the countries or industries and try again.",
    unavailable:
      "The company registry is unavailable right now. Try again in a minute.",
    incomplete: "Pick at least one country and one industry.",
  },

  selection: {
    selected: "selected",
    note: (services: string) =>
      `They are added as accounts with origin "Discovery" and analysed for ${services}.`,
    add: "Add and analyze",
    adding: (done: number, total: number) => `Adding ${done}/${total}…`,
    added: (count: number) =>
      `Added ${plural(count, "company", "companies")} · analysis started`,
    failed: (names: string[]) =>
      `Could not add ${plural(names.length, "company", "companies")}: ${names.join(", ")}`,
  },

  noService: {
    title: "No active service",
    body: "Discovery searches by a service's ICP. Activate a service in Settings first.",
  },
}

/** "both services" with two active services, the service name with one, "all active services" otherwise. */
export function analysedFor(serviceNames: string[]) {
  if (serviceNames.length === 1) return serviceNames[0]
  if (serviceNames.length === 2) return "both services"
  return "all active services"
}
