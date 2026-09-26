import * as mock from "@/api/mock"
import type {
  Account,
  Candidate,
  Company,
  Feedback,
  Icp,
  Me,
  Prospect,
  ProspectQuery,
  Question,
  Rule,
  Run,
  Scoring,
  Service,
  Weight,
} from "@/api/types"

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1"
export const mockEnabled = import.meta.env.VITE_MOCK === "true"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  if (response.status === 401) {
    throw new ApiError(401, "unauthorized")
  }
  if (!response.ok) {
    throw new ApiError(response.status, "request_failed")
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const api = {
  me: () => (mockEnabled ? mock.mockMe() : request<Me | null>("/auth/me")),
  login: (email: string, password: string) =>
    mockEnabled
      ? mock.mockLogin(email, password)
      : request<Me>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => (mockEnabled ? mock.mockLogout() : request<void>("/auth/logout", { method: "POST" })),
  services: () => (mockEnabled ? mock.mockServices() : request<Service[]>("/services")),
  prospects: (query: ProspectQuery) =>
    mockEnabled ? mock.mockProspects(query) : request<Prospect[]>(`/leads?${prospectParams(query)}`),
  company: (id: string) => (mockEnabled ? mock.mockCompany(id) : request<Company>(`/companies/${id}`)),
  feedback: (companyId: string, serviceId: string, signalId: string, feedback: Feedback) =>
    mockEnabled
      ? mock.mockFeedback(companyId, serviceId, signalId, feedback)
      : request<Company>(`/companies/${companyId}/signals/${signalId}/feedback`, {
          method: "POST",
          body: JSON.stringify({ feedback, serviceId }),
        }),
  notes: (companyId: string, notes: string) =>
    mockEnabled
      ? mock.mockNotes(companyId, notes)
      : request<Company>(`/companies/${companyId}/notes`, {
          method: "PUT",
          body: JSON.stringify({ notes }),
        }),
  accounts: () => (mockEnabled ? mock.mockAccounts() : request<Account[]>("/accounts")),
  addAccount: (input: Omit<Account, "id">) =>
    mockEnabled
      ? mock.mockAddAccount(input)
      : request<Account>("/accounts", { method: "POST", body: JSON.stringify(input) }),
  deleteAccount: (id: string) =>
    mockEnabled ? mock.mockDeleteAccount(id) : request<void>(`/accounts/${id}`, { method: "DELETE" }),
  importCsv: (text: string) =>
    mockEnabled
      ? mock.mockImportCsv(text)
      : request<{ added: number; skipped: number }>("/accounts/import", {
          method: "POST",
          body: JSON.stringify({ csv: text }),
        }),
  discover: (country: string) =>
    mockEnabled ? mock.mockDiscover(country) : request<Candidate[]>(`/discovery?country=${encodeURIComponent(country)}`),
  questions: (serviceId: string) =>
    mockEnabled ? mock.mockQuestions(serviceId) : request<Question[]>(`/services/${serviceId}/questions`),
  saveQuestion: (question: Question) =>
    mockEnabled
      ? mock.mockSaveQuestion(question)
      : request<Question>(`/services/${question.serviceId}/questions/${question.id}`, {
          method: "PUT",
          body: JSON.stringify(question),
        }),
  setWeight: (id: string, weight: Weight) =>
    mockEnabled
      ? mock.mockSetWeight(id, weight)
      : request<{ message: string }>(`/questions/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ weight }),
        }),
  icp: () => (mockEnabled ? mock.mockIcp() : request<Icp>("/icp")),
  saveIcp: (icp: Icp) =>
    mockEnabled ? mock.mockSaveIcp(icp) : request<Icp>("/icp", { method: "PUT", body: JSON.stringify(icp) }),
  rules: (serviceId: string) =>
    mockEnabled ? mock.mockRules(serviceId) : request<Rule[]>(`/services/${serviceId}/rules`),
  saveRule: (rule: Rule) =>
    mockEnabled
      ? mock.mockSaveRule(rule)
      : request<Rule>(`/services/${rule.serviceId}/rules`, { method: "POST", body: JSON.stringify(rule) }),
  scoring: () => (mockEnabled ? mock.mockScoring() : request<Scoring>("/scoring")),
  saveScoring: (scoring: Scoring) =>
    mockEnabled
      ? mock.mockSaveScoring(scoring)
      : request<{ message: string }>("/scoring", { method: "PUT", body: JSON.stringify(scoring) }),
  runs: () => (mockEnabled ? mock.mockRuns() : request<Run[]>("/runs")),
  run: (id: string) => (mockEnabled ? mock.mockRun(id) : request<Run>(`/runs/${id}`)),
  startRun: (serviceId: string, companyIds: string[]) =>
    mockEnabled
      ? mock.mockStartRun(serviceId, companyIds)
      : request<Run>("/runs", { method: "POST", body: JSON.stringify({ serviceId, companyIds }) }),
  retryFailed: (id: string) =>
    mockEnabled ? mock.mockRetryFailed(id) : request<Run>(`/runs/${id}/retry`, { method: "POST" }),
}

function prospectParams(query: ProspectQuery) {
  const params = new URLSearchParams({
    service: query.serviceId,
    q: query.q,
    country: query.country,
    industry: query.industry,
    tier: query.tier,
    minPriority: String(query.minPriority),
  })
  if (query.onlyNew) {
    params.set("new", "1")
  }
  return params
}
