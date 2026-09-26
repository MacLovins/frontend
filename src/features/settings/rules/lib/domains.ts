const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

/** "https://www.DHL.com/de/" → "dhl.com". The engine compares lower-cased, www-stripped domains (ai/scoring/rules.py). */
export function normalizeDomain(raw: string) {
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#:]/)[0]
}

/** Every token that looks like a domain (pasted lines, CSV cells), normalized and de-duplicated. */
export function parseDomains(text: string) {
  const domains = new Set<string>()
  for (const token of text.split(/[\s,;]+/)) {
    const domain = normalizeDomain(token)
    if (DOMAIN.test(domain)) domains.add(domain)
  }
  return [...domains]
}
