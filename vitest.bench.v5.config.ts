import { defineConfig } from 'vitest/config';

/**
 * Config v5 — solo corre los benches de `benchmarks/v5/`.
 * Resultados quedan en `benchmarks/results.json` (compatible con
 * el script `scripts/bench/v5-regression.mjs`).
 *
 * Nota: en vitest >=2, los benchmarks filtran por `benchmark.include`
 * (no `test.include`). Si seteamos sólo `test.include` y existen otros
 * `*.bench.ts` fuera de `benchmarks/v5/`, vitest los corre igualmente.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    benchmark: {
      include: ['benchmarks/v5/**/*.bench.ts'],
      exclude: ['node_modules', 'dist'],
      outputJson: 'benchmarks/results.json',
    },
  },
});
