import {
  BriefFooter,
  BriefHero,
  CriteriaSection,
  PainCards,
  PrincipleCards,
  ProcessSection,
} from "./components/brief-sections"
import { PublicPage } from "./components/public-page"
import { PublicTopBar } from "./components/public-top-bar"

export function BriefPage() {
  return (
    <PublicPage
      title="LeadRadar product brief"
      className="gap-12"
      topBar={
        <PublicTopBar tagline>
          <span className="rounded border border-black px-2.5 py-1.5 font-semibold">
            Deeptech GigaHack · AI/ML Challenge
          </span>
          <span className="rounded bg-muted px-2.5 py-1.5 text-muted-foreground">
            Illustrative demo data
          </span>
        </PublicTopBar>
      }
    >
      <BriefHero />
      <PainCards />
      <ProcessSection />
      <PrincipleCards />
      <CriteriaSection />
      <BriefFooter />
    </PublicPage>
  )
}
