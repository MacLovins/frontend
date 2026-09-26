import { describe, expect, it } from "vitest"

import { errorRowsCsv, readCsv } from "@/features/accounts/lib/csv"
import {
  customDefaults,
  matchColumns,
  missingRequired,
} from "@/features/accounts/lib/csv-mapping"

const file = (content: BlobPart, name = "accounts.csv") =>
  new File([content], name, { type: "text/csv" })

describe("readCsv", () => {
  it("counts data rows like the server: quoted newlines kept, blank lines skipped, BOM dropped", async () => {
    const csv = await readCsv(
      file(
        '﻿Name;Website\r\n"Acme; Inc";acme.com\r\n\r\n"Multi\nline";multi.io\r\n'
      )
    )
    if (typeof csv === "string") throw new Error(csv)
    expect(csv.delimiter).toBe(";")
    expect(csv.headers).toEqual(["Name", "Website"])
    expect(csv.rows).toEqual([
      ["Acme; Inc", "acme.com"],
      ["Multi\nline", "multi.io"],
    ])
  })

  it("rejects files the server would reject", async () => {
    expect(await readCsv(file(""))).toBe("emptyFile")
    expect(await readCsv(file("name,domain\n"))).toBe("noRows")
    expect(await readCsv(file(new Uint8Array([0x6e, 0xff, 0xfe, 0x0a])))).toBe(
      "notUtf8"
    )
  })
})

describe("errorRowsCsv", () => {
  it("keeps the rejected rows with the reason in an extra column", async () => {
    const csv = await readCsv(
      file('name,domain\nAcme,acme.com\nNo Domain,\n"Q, Co",q\n')
    )
    if (typeof csv === "string") throw new Error(csv)
    expect(
      errorRowsCsv(csv, [
        "Row 2: missing domain",
        "Row 3: invalid domain 'q'",
      ]).split("\r\n")
    ).toEqual([
      "name,domain,error",
      "No Domain,,missing domain",
      "\"Q, Co\",q,invalid domain 'q'",
    ])
  })
})

describe("column matching", () => {
  it("mirrors the backend aliases, case- and punctuation-insensitively", () => {
    expect(
      matchColumns(["Company_Name", "WEBSITE", "Size"], "default")
    ).toEqual({
      name: "Company_Name",
      domain: "WEBSITE",
      employees: "Size",
    })
    const crunchbase = matchColumns(
      ["Organization Name", "Website", "Headquarters Location"],
      "crunchbase"
    )
    expect(crunchbase.country).toBe("Headquarters Location")
    expect(crunchbase.hq_city).toBe("Headquarters Location")
  })

  it("reports missing required columns and pre-fills custom columns", () => {
    expect(
      missingRequired(matchColumns(["Firma", "Webseite"], "default"))
    ).toEqual(["name", "domain"])
    expect(customDefaults(["name", "domain", "homepage url"])).toEqual({
      name: "name",
      domain: "domain",
    })
  })
})
