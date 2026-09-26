import {
  ApiError,
  http,
  unwrap,
  type CompanyCreate,
  type CompanyUpdate,
  type DiscoveryAcceptIn,
  type DiscoverySearchIn,
  type DisqualificationRuleCreate,
  type FeedbackIn,
  type ICPProfileIn,
  type LoginIn,
  type RunCreate,
  type ScoringProfileIn,
  type SignalQuestionCreate,
  type SignalQuestionUpdate,
  type UserCreate,
  type UserOut,
} from "@/api/http"

export { ApiError }
export type { UserOut }

export const api = {
  me: async (): Promise<UserOut | null> => {
    try {
      return await unwrap(http.GET("/api/v1/auth/me"))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null
      }
      throw error
    }
  },
  login: async (body: LoginIn) => {
    const data = await unwrap(http.POST("/api/v1/auth/login", { body }))
    return data.user
  },
  logout: () => unwrap(http.POST("/api/v1/auth/logout")),
  services: () => unwrap(http.GET("/api/v1/services")),
  countries: () => unwrap(http.GET("/api/v1/meta/countries")),
  industries: () => unwrap(http.GET("/api/v1/meta/industries")),
  labels: () => unwrap(http.GET("/api/v1/meta/labels")),
  leads: (query: {
    serviceId: string
    q: string
    country: string
    industry: string
    tier: string
    onlyNew: boolean
    minPriority: number
  }) =>
    unwrap(
      http.GET("/api/v1/leads", {
        params: {
          query: {
            service_id: query.serviceId,
            q: query.q || undefined,
            country: query.country || undefined,
            industry: query.industry || undefined,
            tier: query.tier || undefined,
            min_priority: query.minPriority > 0 ? query.minPriority : undefined,
            has_new: query.onlyNew ? true : undefined,
            sort: "priority",
            page: 1,
            page_size: 50,
          },
        },
      }),
    ),
  lead: (companyId: string, serviceId: string) =>
    unwrap(
      http.GET("/api/v1/leads/{company_id}", {
        params: { path: { company_id: companyId }, query: { service_id: serviceId || undefined } },
      }),
    ),
  company: (id: string) => unwrap(http.GET("/api/v1/companies/{id}", { params: { path: { id } } })),
  feedback: (signalId: string, body: FeedbackIn) =>
    unwrap(http.POST("/api/v1/signals/{id}/feedback", { params: { path: { id: signalId } }, body })),
  notes: (companyId: string, body: CompanyUpdate) =>
    unwrap(http.PATCH("/api/v1/companies/{id}", { params: { path: { id: companyId } }, body })),
  companies: () => unwrap(http.GET("/api/v1/companies")),
  addCompany: (body: CompanyCreate) => unwrap(http.POST("/api/v1/companies", { body })),
  deleteCompany: (id: string) => unwrap(http.DELETE("/api/v1/companies/{id}", { params: { path: { id } } })),
  importCsv: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return unwrap(
      http.POST("/api/v1/companies/import", {
        body: { file: file.name },
        bodySerializer: () => form,
      }),
    )
  },
  discover: (body: DiscoverySearchIn) => unwrap(http.POST("/api/v1/discovery/search", { body })),
  acceptDiscovery: (body: DiscoveryAcceptIn) => unwrap(http.POST("/api/v1/discovery/accept", { body })),
  questions: (serviceId: string) =>
    unwrap(http.GET("/api/v1/services/{id}/questions", { params: { path: { id: serviceId } } })),
  createQuestion: (serviceId: string, body: SignalQuestionCreate) =>
    unwrap(http.POST("/api/v1/services/{id}/questions", { params: { path: { id: serviceId } }, body })),
  updateQuestion: (id: string, body: SignalQuestionUpdate) =>
    unwrap(http.PATCH("/api/v1/questions/{id}", { params: { path: { id } }, body })),
  icp: (serviceId: string) => unwrap(http.GET("/api/v1/services/{id}/icp", { params: { path: { id: serviceId } } })),
  saveIcp: (serviceId: string, body: ICPProfileIn) =>
    unwrap(http.PUT("/api/v1/services/{id}/icp", { params: { path: { id: serviceId } }, body })),
  rules: (serviceId: string) =>
    unwrap(http.GET("/api/v1/services/{id}/rules", { params: { path: { id: serviceId } } })),
  saveRule: (serviceId: string, body: DisqualificationRuleCreate) =>
    unwrap(http.POST("/api/v1/services/{id}/rules", { params: { path: { id: serviceId } }, body })),
  scoring: (serviceId: string) =>
    unwrap(http.GET("/api/v1/services/{id}/scoring-profile", { params: { path: { id: serviceId } } })),
  saveScoring: (serviceId: string, body: ScoringProfileIn) =>
    unwrap(http.PUT("/api/v1/services/{id}/scoring-profile", { params: { path: { id: serviceId } }, body })),
  runs: () => unwrap(http.GET("/api/v1/runs")),
  run: (id: string) => unwrap(http.GET("/api/v1/runs/{id}", { params: { path: { id } } })),
  startRun: (body: RunCreate) => unwrap(http.POST("/api/v1/runs", { body })),
  retryFailed: (id: string) => unwrap(http.POST("/api/v1/runs/{id}/retry-failed", { params: { path: { id } } })),
  users: () => unwrap(http.GET("/api/v1/auth/users")),
  createUser: (body: UserCreate) => unwrap(http.POST("/api/v1/auth/users", { body })),
}
