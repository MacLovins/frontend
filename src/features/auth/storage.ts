const REFRESH_KEY = "refresh_token"

export function readRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function writeRefresh(refresh: string) {
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearRefresh() {
  localStorage.removeItem(REFRESH_KEY)
}
