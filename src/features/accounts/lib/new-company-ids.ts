import { listCompanies } from "@/api/generated/accounts/accounts"

const PAGE_SIZE = 100

/**
 * The import report has no created ids (backend accounts/schemas.py `CompanyImportReport`). The list is ordered
 * newest first and one import shares a transaction timestamp, so the newest `count` companies are the new ones.
 */
export async function newestCompanyIds(count: number) {
  const ids: string[] = []
  for (let page = 1; ids.length < count; page += 1) {
    const result = await listCompanies({ page, page_size: PAGE_SIZE })
    ids.push(...result.items.map((company) => company.id))
    if (page * PAGE_SIZE >= result.total) break
  }
  return ids.slice(0, count)
}
