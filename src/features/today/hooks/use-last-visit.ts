import { useEffect, useState } from "react"

import { readStorage, storageKeys, writeStorage } from "@/lib/storage"

/**
 * The previous visit to Today (ms), or null on the first visit or when storage is unavailable. Opening the page
 * records "now", which resets the sidebar badge.
 */
export function useLastVisit(userId: string) {
  const [lastVisit] = useState(
    () => Number(readStorage(storageKeys.todaySeen(userId))) || null
  )
  useEffect(() => {
    writeStorage(storageKeys.todaySeen(userId), String(Date.now()))
  }, [userId])
  return lastVisit
}
