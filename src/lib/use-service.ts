import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router"

import { api } from "@/api/client"

export function useServiceId() {
  const [params] = useSearchParams()
  const fromUrl = params.get("service")
  const services = useQuery({ queryKey: ["services"], queryFn: api.services, staleTime: 30_000 })
  return fromUrl || services.data?.[0]?.id || ""
}
