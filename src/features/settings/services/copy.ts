export const copy = {
  title: "Services",
  // The mock names the org here; /auth/me has no org name, so the copy stays neutral.
  subtitle: "What you sell. Each service has its own questions, ICP, rules and scoring.",
  newService: "New service",
  empty: "No services yet. Start from a preset or describe what you sell.",
  loadError: "Could not load services.",
  card: {
    active: "Active",
    draft: "Draft",
    scored: "scored",
    hot: "hot",
    fromPreset: "from preset",
    edited: "edited",
    reviewSuggestions: "Review suggestions →",
    notScored: "Not scored yet · no analysis runs until activated",
    icpMissing: "ICP not set",
    anyMarket: "Any market",
    defaultScoring: "Default scoring",
    scoringProfile: (version: number) => `Scoring profile v${version}`,
    unavailable: "Unavailable",
  },
  details: {
    title: (name: string) => `${name} · details`,
    createTitle: "New service",
    active: "Active",
    name: "Name",
    description: "What the service is",
    descriptionHelp: "The AI reads this to judge relevance. Write it the way you'd explain it to a new hire.",
    valueProposition: "Value proposition",
    valuePropositionHelp: "Used in outreach drafts and suggested angles.",
    decisionMakers: "Decision makers to validate",
    addRole: "+ role",
    newRole: "New role",
    exportYaml: "Export as YAML",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving…",
    create: "Create service",
    creating: "Creating…",
  },
  presets: {
    title: "Start from a preset",
    applied: "Applied",
    apply: "Apply",
    subline: (questions: number, types: number) =>
      `${questions} ${questions === 1 ? "question" : "questions"} · ${types} signal ${types === 1 ? "type" : "types"}`,
    loadError: "Could not load presets.",
  },
  describe: {
    title: "Or describe a new service",
    name: "Service name",
    description: "Two sentences are enough",
    placeholder:
      "We migrate legacy data warehouses to modern cloud data platforms and set up data governance. Typical buyers are CDOs at mid-size and large companies in regulated industries.",
    submit: "Suggest questions, blockers and rules",
    submitting: "Creating…",
    note: "You review every suggestion before it is saved. Nothing is analysed until you activate the service.",
  },
  discard: {
    title: "Discard unsaved changes?",
    body: "Your edits to this service have not been saved.",
    keep: "Keep editing",
    discard: "Discard",
  },
  validation: {
    name: "Enter a name (up to 255 characters)",
    describeName: "Enter a service name",
    describeText: "Write at least 20 characters so the AI has something to work with",
  },
  toast: {
    saved: "Service saved",
    created: "Service created",
    activated: "Service activated",
    deactivated: "Service deactivated",
    presetApplied: (name: string, questions: number) =>
      `${name} added with ${questions} ${questions === 1 ? "question" : "questions"}. Search terms are generating.`,
    saveFailed: "Could not save. Try again.",
  },
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
