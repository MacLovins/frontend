/** Plot geometry of the Fit × Signals scatter, in px inside the 740 × 640 plot (design E3). */
const PLOT_WIDTH = 740

/** Buying signals (intent) 0..100 → x. */
export const plotX = (value: number) => 60 + (value / 100) * 680
/** ICP fit 0..100 → y; the x axis sits 24 px below fit 0. */
export const plotY = (value: number) => 56 + (1 - value / 100) * 520

type LabelInput = {
  id: string
  text: string
  x: number
  y: number
  bold: boolean
}
type PlacedLabel = {
  id: string
  text: string
  top: number
  bold: boolean
} & ({ left: number; right?: undefined } | { right: number; left?: undefined })

type Box = { left: number; top: number; right: number; bottom: number }

const LABEL_HEIGHT = 16
const RIGHT_EDGE = 620
// Geist 12 px averages ~6.6 px per character (7 px bold); only used to keep labels from overlapping.
const textWidth = (text: string, bold: boolean) =>
  Math.ceil(text.length * (bold ? 7 : 6.6)) + 2

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/**
 * Labels beside their dots: right of the dot, or left of it near the right edge. On a collision with a label
 * already placed, try below, then above; otherwise skip it (the dot keeps its tooltip and aria-label).
 */
export function placeLabels(inputs: LabelInput[]): PlacedLabel[] {
  const boxes: Box[] = []
  const placed: PlacedLabel[] = []
  for (const input of inputs) {
    const width = textWidth(input.text, input.bold)
    const alignRight = input.x > RIGHT_EDGE
    const left = alignRight ? input.x - 12 - width : input.x + 12
    for (const top of [input.y - 8, input.y + 10, input.y - 26]) {
      const box = { left, top, right: left + width, bottom: top + LABEL_HEIGHT }
      if (boxes.some((other) => overlaps(other, box))) continue
      boxes.push(box)
      placed.push(
        alignRight
          ? {
              id: input.id,
              text: input.text,
              bold: input.bold,
              top,
              right: PLOT_WIDTH - (input.x - 12),
            }
          : { id: input.id, text: input.text, bold: input.bold, top, left }
      )
      break
    }
  }
  return placed
}
