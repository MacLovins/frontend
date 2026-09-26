import {
  createContext,
  createElement,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { readStorage, storageKeys, writeStorage } from "@/lib/storage"

export type Theme = "light" | "dark"

type ThemeValue = { theme: Theme; toggleTheme: () => void }

const ThemeContext = createContext<ThemeValue | null>(null)

export function readTheme(): Theme {
  return readStorage(storageKeys.theme) === "dark" ? "dark" : "light"
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

/** Apply the saved theme before React paints, so the first frame is not stuck on light. */
export function applyStoredTheme() {
  applyTheme(readTheme())
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return value
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    applyTheme(next)
    writeStorage(storageKeys.theme, next)
  }

  return createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme } },
    children
  )
}
