export function linkedinSearchUrl(title: string, company: string) {
  const keywords = `${title} ${company}`
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`
}
