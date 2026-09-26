export type ApiFetchError = {
  status: number
  data: unknown
}

export const apiFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login")
  }

  if (!response.ok) {
    let data: unknown = null
    try {
      data = await response.json()
    } catch {
      data = null
    }
    const error: ApiFetchError = { status: response.status, data }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
