import { describe, expect, it } from "vitest"

import type { Reason } from "@/api/generated/model"
import { compactAge } from "@/lib/format"
import { pickReasons, reasonSource } from "@/lib/reasons"

const reason = (
  polarity: Reason["polarity"],
  text: string,
  extra: Partial<Reason> = {}
): Reason => ({
  text,
  polarity,
  signal_id: null,
  source_name: null,
  url: null,
  date: null,
  ...extra,
})

describe("pickReasons", () => {
  it("keeps a blocker even when there are three positives", () => {
    const picked = pickReasons([
      reason("positive", "a"),
      reason("positive", "b"),
      reason("positive", "c"),
      reason("negative", "blocker"),
    ])
    expect(picked.map((item) => item.text)).toEqual(["a", "b", "blocker"])
  })

  it("fills the remaining slots with fit and data-gap notes", () => {
    const picked = pickReasons([
      reason("positive", "a"),
      reason("fit", "Outside ICP"),
      reason("data_gap", "Unknown size"),
    ])
    expect(picked.map((item) => item.text)).toEqual([
      "a",
      "Outside ICP",
      "Unknown size",
    ])
  })
})

describe("reasonSource", () => {
  it("joins the source and a compact age, and omits what is missing", () => {
    const now = new Date()
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    expect(reasonSource({ source_name: "dhl.com", date: sixDaysAgo })).toBe(
      "dhl.com · 6 d"
    )
    expect(reasonSource({ source_name: null, date: null })).toBe("")
  })
})

describe("compactAge", () => {
  const now = new Date("2026-09-26T12:00:00Z")
  it.each([
    ["2026-09-20", "6 d"],
    ["2026-09-12", "2 w"],
    ["2026-06-26", "3 mo"],
    ["2024-01-01", "2 y"],
  ])("%s → %s", (date, expected) => {
    expect(compactAge(date, now)).toBe(expected)
  })
})
