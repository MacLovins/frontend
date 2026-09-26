import { Navigate, useLocation } from "react-router"

/** `/` opens Prospects and keeps `?service=`. */
export function ToProspects() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: "/prospects", search }} replace />
}
