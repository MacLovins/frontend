import { useCallback, useEffect, useRef } from "react"
import { useBlocker } from "react-router"

/**
 * Blocks in-app navigation (another page, another service, another `?rule=`) while a form is dirty.
 * `release()` lets the next navigation through, e.g. closing an editor right after a successful save.
 */
export function useDiscardGuard(dirty: boolean) {
  const guarded = useRef(dirty)
  useEffect(() => {
    guarded.current = dirty
  }, [dirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      guarded.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search)
  )
  const release = useCallback(() => {
    guarded.current = false
  }, [])

  return { blocker, release }
}
