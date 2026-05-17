#!/usr/bin/env node
/**
 * bench/v5-regression.mjs
 * ----------------------------------------------------------------
 * Performance regression suite v5.
 *
 * Workflow:
 *   1. Corre `vitest bench --run` (config v5) si los resultados no
 *      existen (omitible con `--no-run`).
 *   2. Lee `benchmarks/results.json` y `benchmarks/baselines.json`.
 *   3. Compara medianas (ms) por bench-name.
 *   4. Si algún bench regresó > THRESHOLD_PCT (default 25%) → exit 1.
 *   5. Si `--update` está presente: sobrescribe `baselines.json` con
 *      el snapshot actual y sale 0.
 *
 * Flags:
 *   --update           Actualiza baselines (no compara).
 *   --threshold <pct>  Override del umbral fail (default 25).
 *   --no-run           No ejecuta vitest; usa results.json existente.
 *   --json             Emite reporte JSON además del texto.
 *   --quiet            Sólo imprime resumen final.
 *
 * Exit codes:
 *   0  OK (sin regresiones o --update exitoso)
 *   1  Regresión detectada (≥1 bench >= threshold)
 *   2  Error I/O (results/baselines no encontrados)
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const RESULTS = join(ROOT, 'benchmarks/results.json');
const BASELINES = join(ROOT, 'benchmarks/baselines.json');

// ── arg parsing ─────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
function arg(name, def) {
  const i = argv.indexOf(name);
  if (i === -1 || i === argv.length - 1) return def;
  return argv[i + 1];
}

const UPDATE = flag('--update');
const NO_RUN = flag('--no-run');
const QUIET = flag('--quiet');
const EMIT_JSON = flag('--json');
const THRESHOLD = parseFloat(arg('--threshold', '25'));

// ── colors ──────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(...a) {
  if (!QUIET) console.log(...a);
}

// ── step 1: run bench (optional) ───────────────────────────
function runVitestBench() {
  log(`${C.bold}[v5-regression] running vitest bench (config v5)...${C.reset}`);
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const r = spawnSync(
    npxBin,
    ['vitest', 'bench', '--run', '--config', 'vitest.bench.v5.config.ts'],
    {
      cwd: ROOT,
      stdio: QUIET ? 'pipe' : 'inherit',
    },
  );
  if (r.status !== 0) {
    console.error(`${C.red}vitest bench falló (exit ${r.status})${C.reset}`);
    process.exit(2);
  }
}

if (!NO_RUN) {
  runVitestBench();
}

// ── step 2: load JSON ───────────────────────────────────────
if (!existsSync(RESULTS)) {
  console.error(`${C.red}ERROR: ${RESULTS} no existe.${C.reset}`);
  console.error('Corré primero: npm run bench:v5');
  process.exit(2);
}

const results = JSON.parse(readFileSync(RESULTS, 'utf8'));

// ── step 3: --update path: copy results → baselines and exit ─
if (UPDATE) {
  copyFileSync(RESULTS, BASELINES);
  log(`${C.green}${C.bold}baselines actualizadas${C.reset} → ${BASELINES}`);
  log(`(${countBenches(results)} benchmarks registrados)`);
  process.exit(0);
}

if (!existsSync(BASELINES)) {
  console.error(`${C.red}ERROR: ${BASELINES} no existe.${C.reset}`);
  console.error('Corré primero: node scripts/bench/v5-regression.mjs --update');
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(BASELINES, 'utf8'));

// ── step 4: extract bench medians by name ─────────────────
/**
 * vitest bench JSON estructura:
 *   { files: [{ filepath, groups: [{ fullName, benchmarks: [{ name, median, ... }] }] }] }
 * Devuelve Map<key, { median, hz }>.
 */
function extractBenchmarks(data) {
  const map = new Map();
  for (const file of data?.files ?? []) {
    for (const group of file?.groups ?? []) {
      const groupName = group.fullName ?? group.name ?? 'unknown';
      for (const bench of group?.benchmarks ?? []) {
        const key = `${groupName} > ${bench.name}`;
        map.set(key, {
          median: bench.median ?? 0,
          hz: bench.hz ?? 0,
        });
      }
    }
  }
  return map;
}

function countBenches(data) {
  let n = 0;
  for (const file of data?.files ?? []) {
    for (const group of file?.groups ?? []) {
      n += (group?.benchmarks ?? []).length;
    }
  }
  return n;
}

const currMap = extractBenchmarks(results);
const baseMap = extractBenchmarks(baseline);

// ── step 5: compare ──────────────────────────────────────
const rows = [];
let hasFail = false;
let hasMissing = false;

for (const [key, curr] of currMap) {
  const base = baseMap.get(key);
  if (!base) {
    rows.push({ key, status: 'new', curr, base: null, diffPct: null });
    continue;
  }
  const diffPct =
    base.median > 0 ? ((curr.median - base.median) / base.median) * 100 : 0;

  let status = 'ok';
  if (diffPct >= THRESHOLD) {
    status = 'fail';
    hasFail = true;
  } else if (diffPct >= 10) {
    status = 'warn';
  } else if (diffPct <= -10) {
    status = 'improved';
  }
  rows.push({ key, status, curr, base, diffPct });
}

for (const [key, base] of baseMap) {
  if (!currMap.has(key)) {
    rows.push({ key, status: 'missing', curr: null, base, diffPct: null });
    hasMissing = true;
  }
}

// ── step 6: render ─────────────────────────────────────────
const ICON = {
  ok: ' OK ',
  improved: ' UP ',
  warn: 'WARN',
  fail: 'FAIL',
  new: ' NEW',
  missing: 'GONE',
};
const COLOR = {
  ok: C.green,
  improved: C.cyan,
  warn: C.yellow,
  fail: C.red,
  new: C.gray,
  missing: C.gray,
};

log(`\n${C.bold}ST Benchmark v5 Regression Check${C.reset}`);
log(`Threshold fail: >= ${THRESHOLD}%   (warn: >= 10%)\n`);

const W = 64;
log(
  `${'Benchmark'.padEnd(W)} ${'Status'.padEnd(5)} ${'Baseline(ms)'.padStart(14)} ${'Current(ms)'.padStart(13)} ${'Diff%'.padStart(8)}`,
);
log('-'.repeat(W + 50));

for (const row of rows) {
  const color = COLOR[row.status] ?? C.reset;
  const icon = ICON[row.status] ?? '?';
  const baseMs = row.base ? row.base.median.toFixed(3) : '—';
  const currMs = row.curr ? row.curr.median.toFixed(3) : '—';
  const diff =
    row.diffPct != null ? `${row.diffPct >= 0 ? '+' : ''}${row.diffPct.toFixed(1)}%` : '—';
  const shortKey = row.key.length > W - 2 ? row.key.slice(0, W - 5) + '...' : row.key;
  log(
    `${color}${shortKey.padEnd(W)} ${icon.padEnd(5)} ${baseMs.padStart(14)} ${currMs.padStart(13)} ${diff.padStart(8)}${C.reset}`,
  );
}

const fails = rows.filter((r) => r.status === 'fail').length;
const warns = rows.filter((r) => r.status === 'warn').length;
const improved = rows.filter((r) => r.status === 'improved').length;
const okCount = rows.filter((r) => r.status === 'ok').length;
const newCount = rows.filter((r) => r.status === 'new').length;
const missing = rows.filter((r) => r.status === 'missing').length;

const summary =
  `${C.bold}Summary:${C.reset} ` +
  `${C.green}${okCount} ok${C.reset}  ` +
  `${C.cyan}${improved} improved${C.reset}  ` +
  `${C.yellow}${warns} warn${C.reset}  ` +
  `${C.red}${fails} fail${C.reset}  ` +
  `${C.gray}${newCount} new${C.reset}  ` +
  `${C.gray}${missing} missing${C.reset}`;

if (QUIET) {
  console.log(summary);
} else {
  log(`\n${'─'.repeat(W + 50)}`);
  log(summary);
}

if (hasFail) {
  console.log(
    `\n${C.red}${C.bold}REGRESION DETECTADA${C.reset} — ${fails} bench(s) > ${THRESHOLD}% peor que baseline.`,
  );
  console.log('Para aceptar el cambio (intencional): node scripts/bench/v5-regression.mjs --update');
}

if (EMIT_JSON) {
  const report = {
    timestamp: new Date().toISOString(),
    threshold: THRESHOLD,
    summary: { ok: okCount, improved, warn: warns, fail: fails, new: newCount, missing },
    rows: rows.map((r) => ({
      key: r.key,
      status: r.status,
      baseMs: r.base?.median ?? null,
      currMs: r.curr?.median ?? null,
      diffPct: r.diffPct,
    })),
  };
  writeFileSync(join(ROOT, 'benchmarks/regression-report.json'), JSON.stringify(report, null, 2));
}

process.exit(hasFail ? 1 : 0);
