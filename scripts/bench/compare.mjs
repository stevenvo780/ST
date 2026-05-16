#!/usr/bin/env node
/**
 * bench/compare.mjs
 * -----------------
 * Compara benchmarks/results.json contra benchmarks/baselines.json.
 *
 * Signature:
 *   node scripts/bench/compare.mjs [--warn <pct>] [--fail <pct>] [--json]
 *
 * Opciones:
 *   --warn <pct>   Umbral de warning (default: 10)  — % de regresión
 *   --fail <pct>   Umbral de fallo  (default: 25)  — % de regresión
 *   --json         Emitir reporte en JSON (además de texto)
 *
 * Exit codes:
 *   0  Sin regresiones
 *   1  Hay al menos 1 bench con regresión severa (>= fail threshold)
 *   2  Error de I/O (archivos no encontrados)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Paths ─────────────────────────────────────────────────────

const ROOT = join(fileURLToPath(import.meta.url), '../../..');
const BASELINE_FILE = join(ROOT, 'benchmarks/baselines.json');
const RESULTS_FILE  = join(ROOT, 'benchmarks/results.json');

// ── Arg parsing ───────────────────────────────────────────────

const args = process.argv.slice(2);
const warnThreshold = parseFloat(args[args.indexOf('--warn') + 1] ?? '10');
const failThreshold = parseFloat(args[args.indexOf('--fail') + 1] ?? '25');
const emitJson      = args.includes('--json');

// ── Colors ────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

// ── I/O ───────────────────────────────────────────────────────

if (!existsSync(BASELINE_FILE)) {
  console.error(`${C.red}ERROR${C.reset}: No se encontró ${BASELINE_FILE}`);
  console.error('Corrí primero: npm run bench:save');
  process.exit(2);
}
if (!existsSync(RESULTS_FILE)) {
  console.error(`${C.red}ERROR${C.reset}: No se encontró ${RESULTS_FILE}`);
  console.error('Corrí primero: npm run bench');
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
const results  = JSON.parse(readFileSync(RESULTS_FILE,  'utf8'));

// ── Extract bench map from vitest JSON output ─────────────────
// vitest --outputJson emite: { files: [ { groups: [ { benchmarks: [ { name, median, p95, hz } ] } ] } ] }

/**
 * @param {object} data — vitest bench JSON output
 * @returns {Map<string, {median: number, p95: number, hz: number}>}
 *
 * vitest bench JSON structure:
 * { files: [ { filepath, groups: [ { fullName, benchmarks: [ { name, median, p75, p99, hz, ... } ] } ] } ] }
 */
function extractBenchmarks(data) {
  const map = new Map();
  const files = data?.files ?? [];
  for (const file of files) {
    for (const group of file?.groups ?? []) {
      // fullName is e.g. "benchmarks/cdcl.bench.ts > CDCL: trivial instances"
      const groupName = group.fullName ?? group.name ?? 'unknown';
      for (const bench of group?.benchmarks ?? []) {
        // Key: "<groupName> > <benchName>"
        const key = `${groupName} > ${bench.name}`;
        map.set(key, {
          median: bench.median ?? 0,
          p95:    bench.p99    ?? 0,   // vitest exposes p99, not p95
          hz:     bench.hz     ?? 0,
        });
      }
    }
  }
  return map;
}

const baseMap = extractBenchmarks(baseline);
const currMap = extractBenchmarks(results);

// ── Comparison ────────────────────────────────────────────────

const rows = [];
let hasFail = false;

for (const [key, curr] of currMap) {
  const base = baseMap.get(key);

  if (!base) {
    rows.push({ key, status: 'new', curr, base: null, diffPct: null });
    continue;
  }

  // Use median (ms) for comparison. Lower is better.
  const diffPct = base.median > 0
    ? ((curr.median - base.median) / base.median) * 100
    : 0;

  let status = 'ok';
  if (diffPct >= failThreshold) {
    status = 'fail';
    hasFail = true;
  } else if (diffPct >= warnThreshold) {
    status = 'warn';
  } else if (diffPct <= -warnThreshold) {
    status = 'improved';
  }

  rows.push({ key, status, curr, base, diffPct });
}

// Benchmarks that disappeared
for (const [key, base] of baseMap) {
  if (!currMap.has(key)) {
    rows.push({ key, status: 'missing', curr: null, base, diffPct: null });
  }
}

// ── Render table ──────────────────────────────────────────────

const COLOR_BY_STATUS = {
  ok:       C.green,
  improved: C.cyan,
  warn:     C.yellow,
  fail:     C.red,
  new:      C.gray,
  missing:  C.gray,
};

const ICON_BY_STATUS = {
  ok:       'OK',
  improved: 'UP',
  warn:     'WARN',
  fail:     'FAIL',
  new:      'NEW',
  missing:  'GONE',
};

console.log(`\n${C.bold}ST Benchmark Comparison${C.reset}`);
console.log(`Thresholds: warn >=${warnThreshold}%  fail >=${failThreshold}%\n`);

const colW = 60;
console.log(
  `${'Benchmark'.padEnd(colW)} ${'Status'.padEnd(8)} ${'Baseline(ms)'.padStart(14)} ${'Current(ms)'.padStart(12)} ${'Diff%'.padStart(8)}  ${'hz(curr)'.padStart(10)}`
);
console.log('-'.repeat(colW + 60));

for (const row of rows) {
  const { key, status, curr, base, diffPct } = row;
  const color = COLOR_BY_STATUS[status] ?? C.reset;
  const icon  = ICON_BY_STATUS[status]  ?? '?';
  const baseMs = base   ? base.median.toFixed(3)   : '—';
  const currMs = curr   ? curr.median.toFixed(3)   : '—';
  const diff   = diffPct != null ? `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%` : '—';
  const hz     = curr   ? curr.hz.toFixed(1) : '—';

  const shortKey = key.length > colW - 2 ? key.slice(0, colW - 5) + '...' : key;

  console.log(
    `${color}${shortKey.padEnd(colW)} ${icon.padEnd(8)} ${baseMs.padStart(14)} ${currMs.padStart(12)} ${diff.padStart(8)}  ${hz.padStart(10)}${C.reset}`
  );
}

// ── Summary ───────────────────────────────────────────────────

const fails    = rows.filter(r => r.status === 'fail').length;
const warns    = rows.filter(r => r.status === 'warn').length;
const improved = rows.filter(r => r.status === 'improved').length;
const okCount  = rows.filter(r => r.status === 'ok').length;
const newCount = rows.filter(r => r.status === 'new').length;

console.log(`\n${'─'.repeat(colW + 60)}`);
console.log(
  `${C.bold}Summary:${C.reset}  ` +
  `${C.green}${okCount} ok${C.reset}  ` +
  `${C.cyan}${improved} improved${C.reset}  ` +
  `${C.yellow}${warns} warn${C.reset}  ` +
  `${C.red}${fails} fail${C.reset}  ` +
  `${C.gray}${newCount} new${C.reset}`
);

if (hasFail) {
  console.log(`\n${C.red}${C.bold}REGRESION DETECTADA${C.reset} — ${fails} benchmark(s) superaron el umbral de fallo (${failThreshold}%).`);
  console.log('Para actualizar baselines si el cambio es intencional: npm run bench:save\n');
}

// ── JSON output ───────────────────────────────────────────────

if (emitJson) {
  const report = {
    timestamp: new Date().toISOString(),
    thresholds: { warn: warnThreshold, fail: failThreshold },
    summary: { ok: okCount, improved, warn: warns, fail: fails, new: newCount },
    rows: rows.map(r => ({
      key:     r.key,
      status:  r.status,
      baseMs:  r.base?.median ?? null,
      currMs:  r.curr?.median ?? null,
      diffPct: r.diffPct,
      hz:      r.curr?.hz ?? null,
    })),
  };
  console.log('\n--- JSON REPORT ---');
  console.log(JSON.stringify(report, null, 2));
}

process.exit(hasFail ? 1 : 0);
