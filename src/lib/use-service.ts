import { useSearchParams } from "react-router"

export function useServiceId() {
  const [params] = useSearchParams()
  return params.get("service") ?? "ia"
}
