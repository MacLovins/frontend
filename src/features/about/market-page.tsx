import { Link } from "react-router"

import {
  LandscapeSection,
  MarketHero,
  PositionCards,
  PresentationsSection,
} from "./components/market-sections"
import { PublicPage } from "./components/public-page"
import { PublicTopBar } from "./components/public-top-bar"

export function MarketPage() {
  return (
    <PublicPage
      title="Market landscape"
      className="gap-10"
      topBar={<PublicTopBar />}
    >
      <div className="flex flex-col gap-2">
        <Link
          to="/about"
          className="self-start text-[13px] font-semibold text-black no-underline hover:text-link-hover"
        >
          ← Product brief
        </Link>
        <MarketHero />
      </div>
      <LandscapeSection />
      <PositionCards />
      <PresentationsSection />
    </PublicPage>
  )
}
