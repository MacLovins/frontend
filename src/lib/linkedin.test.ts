import { describe, expect, it } from "vitest"

import { linkedinSearchUrl } from "@/lib/linkedin"

describe("linkedinSearchUrl", () => {
  it("builds a people search link without calling LinkedIn", () => {
    const url = linkedinSearchUrl("Head of Automation", "DHL Group")
    expect(url.startsWith("https://www.linkedin.com/search/results/people/?keywords=")).toBe(true)
    expect(url).toContain("Head%20of%20Automation%20DHL%20Group")
  })
})
