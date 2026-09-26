/**
 * Mock columns at 1440 px: select, company, country, industry, employees, origin, sources, last analysed, plus the
 * row-actions column. Below 1400 px the fixed columns shrink so the company name keeps ~250 px at 1280.
 */
export const accountsGrid =
  "grid grid-cols-[40px_minmax(0,1fr)_64px_120px_96px_96px_120px_110px_44px] items-center px-4 min-[1400px]:grid-cols-[40px_minmax(0,1fr)_80px_150px_110px_110px_140px_150px_44px]"
