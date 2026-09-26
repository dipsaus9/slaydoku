/** Deterministic random numbers for the scene generator: same seed, same sequence, on any machine. */
export type Random = () => number

/** Mix any number of integers into one 32-bit seed (so attempt 3 of seed 7 differs from attempt 4). */
export function mixSeed(...parts: number[]): number {
  let h = 0x811c9dc5
  for (const part of parts) {
    h ^= Math.floor(part) >>> 0
    h = Math.imul(h, 0x01000193)
    h ^= h >>> 15
    h = Math.imul(h, 0x2c1b3c6d)
    h ^= h >>> 12
  }
  return h >>> 0
}

/** mulberry32. */
export function createRandom(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(random: Random, below: number): number {
  return Math.floor(random() * below)
}

export function pick<T>(random: Random, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick from an empty list')
  return items[randomInt(random, items.length)] as T
}

export function shuffle<T>(random: Random, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1)
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

/** Pick one item with chance proportional to its weight; items with weight <= 0 never win. */
export function pickWeighted<T>(
  random: Random,
  items: readonly T[],
  weight: (item: T) => number,
): T | undefined {
  let total = 0
  for (const item of items) total += Math.max(0, weight(item))
  if (total <= 0) return undefined
  let roll = random() * total
  for (const item of items) {
    const w = Math.max(0, weight(item))
    if (w <= 0) continue
    roll -= w
    if (roll < 0) return item
  }
  return [...items].reverse().find((item) => weight(item) > 0)
}

/** Standard normal via Box-Muller. */
export function gaussian(random: Random): number {
  const u = Math.max(random(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random())
}
