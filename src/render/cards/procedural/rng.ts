/** Small seeded random source: same seed, same numbers, on every device. */

/** FNV-1a hash of a seed (string or number) into an unsigned 32-bit integer. */
export function hashSeed(seed: string | number): number {
  const text = String(seed)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [0, n). */
  int(n: number): number
  /** One entry of a non-empty list. */
  pick<T>(items: readonly T[]): T
}

/** mulberry32 generator seeded from any string or number. */
export function createRng(seed: string | number): Rng {
  let a = hashSeed(seed)
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n) => Math.floor(next() * n),
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)] as T,
  }
}

/** Fisher-Yates shuffle into a new array, driven by `rng`. */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}
