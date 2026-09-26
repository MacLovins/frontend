import { useEffect, useState } from "react"

/** True once `limitMs` has passed since `since` (ISO); re-renders exactly at the deadline. */
export function useOverdue(since: string | null, limitMs: number) {
  const [now, setNow] = useState(() => Date.now())
  const deadline = since ? Date.parse(since) + limitMs : null

  useEffect(() => {
    if (deadline === null) return
    // A deadline already behind the clock still needs one tick: `now` may predate it.
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, deadline - Date.now())
    )
    return () => window.clearTimeout(timer)
  }, [deadline])

  return deadline !== null && now >= deadline
}
