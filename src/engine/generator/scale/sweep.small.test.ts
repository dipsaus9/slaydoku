import { describeSweep } from './sweep.fixture.ts'

// CAD-8.6: on some tiny random scenes no expert puzzle exists inside the budget any more (whole-object direction cards); those seeds are skipped.
const SKIP_EXPERT: Record<number, readonly number[]> = { 6: [1, 3, 10], 7: [9], 8: [], 9: [] }

for (const size of [6, 7, 8, 9]) describeSweep(size, ['very-easy', 'easy', 'easy-medium', 'medium', 'hard', 'expert'], { expert: SKIP_EXPERT[size] })
