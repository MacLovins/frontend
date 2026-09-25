const E164 = /^\+373[67]\d{7}$/
const NATIONAL = /^0[67]\d{7}$/

export function normalizeMdPhone(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, "")

  if (E164.test(compact)) {
    return compact
  }

  if (NATIONAL.test(compact)) {
    return `+373${compact.slice(1)}`
  }

  return null
}
