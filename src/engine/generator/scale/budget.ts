/** Wall-clock ceiling per puzzle, in ms. Typical puzzles need a small fraction of it (see the CAD-4.24 task notes). */
export const DEFAULT_BUDGET_MS = 60_000

/** A wall-clock deadline that the expensive loops poll. */
export class Deadline {
  private readonly started: number
  private readonly now: () => number

  readonly budgetMs: number

  constructor(budgetMs: number, now: () => number = () => performance.now()) {
    this.budgetMs = budgetMs
    this.now = now
    this.started = now()
  }

  elapsedMs(): number {
    return this.now() - this.started
  }

  remainingMs(): number {
    return this.budgetMs - this.elapsedMs()
  }

  expired(): boolean {
    return this.elapsedMs() >= this.budgetMs
  }
}
