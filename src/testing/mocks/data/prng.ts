/** Tiny deterministic generators (no Math.random anywhere in the mock). */

/** FNV-1a 32-bit hash of a string. */
export function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: a seeded generator returning floats in [0, 1). */
export function prng(seed: number | string): () => number {
  let a = typeof seed === "string" ? hash(seed) : seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]
}

export function between(rand: () => number, min: number, max: number): number {
  return Math.round(min + rand() * (max - min))
}
