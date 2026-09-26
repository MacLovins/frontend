import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

import { searchDiscovery } from "@/api/generated/discovery/discovery"
import type { DiscoverySearchIn } from "@/api/generated/model"

/**
 * `POST /discovery/search` runs synchronously for up to 60 s (backend APP_DISCOVERY_TIMEOUT_S), so the request is
 * aborted when the page unmounts or the service changes. The results column shows the errors itself.
 */
export function useDiscoverySearch() {
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  return useMutation({
    mutationFn: (data: DiscoverySearchIn) => {
      controller.current?.abort()
      controller.current = new AbortController()
      return searchDiscovery(data, { signal: controller.current.signal })
    },
    meta: { errorToast: false },
  })
}
