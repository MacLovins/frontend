import { useCallback, useMemo, useState } from "react"

import type { ScoringParams } from "@/api/generated/model"
import {
  HALF_LIFE_KEYS,
  type HalfLifeKey,
  parseHalfLife,
  round1,
  sameParams,
} from "@/features/settings/scoring/lib/params"

type HalfLifeText = Record<HalfLifeKey, string>

const halfLifeText = (params: ScoringParams) =>
  Object.fromEntries(
    HALF_LIFE_KEYS.map((key) => [key, String(params.half_life_days[key] ?? "")])
  ) as HalfLifeText

/** The editable copy of the saved profile. Remount (key by version) to start over from a new saved profile. */
export function useScoringDraft(saved: ScoringParams) {
  const [draft, setDraft] = useState(saved)
  const savedText = useMemo(() => halfLifeText(saved), [saved])
  const [text, setText] = useState(savedText)

  // An untouched empty field is a stored null (no decay), which stays as it is.
  const invalidHalfLives = useMemo(
    () =>
      HALF_LIFE_KEYS.filter(
        (key) =>
          text[key] !== savedText[key] && parseHalfLife(text[key]) === null
      ),
    [text, savedText]
  )
  const dirty = invalidHalfLives.length > 0 || !sameParams(draft, saved)

  const setWeight = useCallback(
    (level: keyof ScoringParams["weights"], value: number) =>
      setDraft((current) => ({
        ...current,
        weights: { ...current.weights, [level]: value },
      })),
    []
  )

  const setFitShare = useCallback(
    (share: number) =>
      setDraft((current) => ({
        ...current,
        fit_exponent: share,
        intent_exponent: round1(1 - share),
      })),
    []
  )

  const setNumber = useCallback(
    (key: "risk_penalty" | "tau_intent" | "min_confidence", value: number) =>
      setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  // Coupled exactly like the mock; the backend only requires hot >= warm (ai/contracts.py:206).
  const setTier = useCallback(
    (tier: "hot" | "warm", value: number) =>
      setDraft((current) => {
        const { hot, warm } = current.tiers
        const tiers =
          tier === "hot"
            ? { hot: value, warm: value <= warm ? value - 5 : warm }
            : { warm: value, hot: value >= hot ? value + 5 : hot }
        return { ...current, tiers }
      }),
    []
  )

  const setHalfLife = useCallback(
    (key: HalfLifeKey, value: string) => {
      setText((current) => ({ ...current, [key]: value }))
      const restored = value === savedText[key]
      const days = restored
        ? (saved.half_life_days[key] ?? null)
        : parseHalfLife(value)
      if (days !== null || restored) {
        setDraft((current) => ({
          ...current,
          half_life_days: { ...current.half_life_days, [key]: days },
        }))
      }
    },
    [saved, savedText]
  )

  /** Blur or Enter: a valid entry is shown the way it is stored ("045" → "45"). */
  const commitHalfLife = useCallback((key: HalfLifeKey) => {
    setText((current) => {
      const days = parseHalfLife(current[key])
      return days === null ? current : { ...current, [key]: String(days) }
    })
  }, [])

  const reset = useCallback(() => {
    setDraft(saved)
    setText(savedText)
  }, [saved, savedText])

  const halfLivesDirty = HALF_LIFE_KEYS.some(
    (key) =>
      invalidHalfLives.includes(key) ||
      draft.half_life_days[key] !== saved.half_life_days[key]
  )

  return {
    draft,
    halfLifeText: text,
    invalidHalfLives,
    dirty,
    halfLivesDirty,
    confidenceDirty: draft.min_confidence !== saved.min_confidence,
    setWeight,
    setFitShare,
    setNumber,
    setTier,
    setHalfLife,
    commitHalfLife,
    reset,
  }
}

export type ScoringDraft = ReturnType<typeof useScoringDraft>
