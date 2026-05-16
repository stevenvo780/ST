import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['benchmarks/**/*.bench.ts'],
    exclude: ['node_modules', 'dist'],
    benchmark: {
      outputJson: 'benchmarks/results.json',
      // Each bench runs for enough iterations to get stable medians
      // without exceeding the 90s total budget.
      // vitest bench uses time-based iteration by default.
    },
  },
});
