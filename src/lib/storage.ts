// localStorage holds per-viewer conveniences only; it can be missing or throw (private mode, blocked site data).

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Not persisted; the app works without it.
  }
}

export const storageKeys = {
  service: "lr:service",
  todaySeen: (userId: string) => `lr:today-seen:${userId}`,
}
