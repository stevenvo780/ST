#!/usr/bin/env node
/**
 * verify.mjs — Core logic for the verify-st-claims GitHub Action.
 *
 * Reads INPUT_PATHS, INPUT_DEFAULT_PROFILE and INPUT_FAIL_ON_WARNING from env.
 * Evaluates each matched .st file with @stevenvo780/st-lang.
 * Writes verified-count and failed-count to GITHUB_OUTPUT.
 * Exits 0 if all files pass, 1 if any fail.
 *
 * Profile detection: first non-empty line that matches
 *   ";; profile: <slug>"  (double-semicolon comment, tolerates spaces)
 * If not found, falls back to INPUT_DEFAULT_PROFILE.
 */

import { readFileSync, appendFileSync } from 'fs';

// Try the npm 'glob' package (installed in Docker), fall back to Node 22+ built-in.
// npm glob returns Promise<string[]>; Node 22 fs/promises.glob returns AsyncIterable.
// We normalise both to Promise<string[]> via the globFiles() helper below.
let _npmGlob = null;
try {
  ({ glob: _npmGlob } = await import('glob'));
} catch {
  _npmGlob = null;
}

/**
 * Expands a single glob pattern to an array of file paths.
 * @param {string} pattern
 * @returns {Promise<string[]>}
 */
async function globFiles(pattern) {
  if (_npmGlob) {
    // npm glob@11 returns Promise<string[]>
    return _npmGlob(pattern, { nodir: true, absolute: false });
  }
  // Node 22 built-in: returns AsyncIterable<string>
  const fsp = await import('node:fs/promises');
  const results = [];
  for await (const f of fsp.glob(pattern)) {
    results.push(f);
  }
  return results;
}

// ── Resolve st-lang from the action's own node_modules ───────────────────────
// When running in Docker /app/node_modules holds st-lang.
// When running locally the CJS require path is resolved from __dirname.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let stLang;
try {
  stLang = require('@stevenvo780/st-lang/api');
} catch {
  // fallback: try the default export (CommonJS barrel)
  stLang = require('@stevenvo780/st-lang');
}

const { evaluate } = stLang;

// ── Inputs ────────────────────────────────────────────────────────────────────
const rawPaths = process.env['INPUT_PATHS'] ?? '**/*.st';
const defaultProfile = (process.env['INPUT_DEFAULT_PROFILE'] ?? 'classical.propositional').trim();
const failOnWarning = (process.env['INPUT_FAIL_ON_WARNING'] ?? 'false').toLowerCase() === 'true';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts the declared profile from the file header.
 * Accepts the ";; profile: <slug>" convention (leading lines only).
 *   ;; profile: classical.propositional
 *   ;; profile:modal.k
 *
 * NOTE: ";;" is not valid ST syntax — these lines are stripped before
 * evaluation so the parser never sees them.
 */
function extractDeclaredProfile(source) {
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (line === '') continue;
    const m = line.match(/^;;\s*profile\s*:\s*(\S+)/i);
    if (m) return m[1] ?? null;
    // Stop scanning after first non-empty non-";;" line
    if (!line.startsWith(';;')) break;
  }
  return null;
}

/**
 * Strips leading ";;" header lines (they are not valid ST syntax).
 */
function stripHeaderLines(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith(';;'))
    .join('\n');
}

/**
 * Builds full ST source: prepends "logic <profile>" if the file doesn't
 * already contain one.
 */
function buildSource(source, profile) {
  const hasLogicDecl = /^\s*logic\s+\S/m.test(source);
  if (hasLogicDecl) return source;
  return `logic ${profile}\n${source}`;
}

/** Writes key=value to GITHUB_OUTPUT (multi-line safe). */
function setOutput(key, value) {
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    appendFileSync(outputFile, `${key}=${value}\n`);
  } else {
    // Local run: print to stdout
    console.log(`::set-output name=${key}::${value}`);
  }
}

/** Emits a GitHub Actions annotation. */
function annotate(level, file, message) {
  // level: 'error' | 'warning' | 'notice'
  const escapedMsg = message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  console.log(`::${level} file=${file}::${escapedMsg}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Expand globs (supports comma-separated patterns)
  const patterns = rawPaths.split(',').map((p) => p.trim()).filter(Boolean);

  /** @type {string[]} */
  const files = [];
  for (const pattern of patterns) {
    const matches = await globFiles(pattern);
    for (const f of matches) {
      if (!files.includes(f)) files.push(f);
    }
  }

  if (files.length === 0) {
    console.log(`[verify-st-claims] No .st files matched patterns: ${rawPaths}`);
    setOutput('verified-count', '0');
    setOutput('failed-count', '0');
    process.exit(0);
  }

  console.log(`[verify-st-claims] Verifying ${files.length} file(s)...`);

  let verifiedCount = 0;
  let failedCount = 0;

  for (const filePath of files) {
    let source;
    try {
      source = readFileSync(filePath, 'utf8');
    } catch (err) {
      annotate('error', filePath, `Cannot read file: ${err.message}`);
      failedCount++;
      continue;
    }

    const declaredProfile = extractDeclaredProfile(source);
    const profile = declaredProfile ?? defaultProfile;
    const strippedSource = stripHeaderLines(source);
    const fullSource = buildSource(strippedSource, profile);

    let result;
    try {
      result = evaluate(fullSource, filePath);
    } catch (err) {
      annotate('error', filePath, `st-lang threw an unexpected error: ${err.message}`);
      failedCount++;
      continue;
    }

    const errors = result.diagnostics.filter((d) => d.severity === 'error');
    const warnings = result.diagnostics.filter((d) => d.severity === 'warning');

    const hasFatalErrors = !result.ok || errors.length > 0;
    const hasBlockingWarnings = failOnWarning && warnings.length > 0;

    if (hasFatalErrors || hasBlockingWarnings) {
      failedCount++;
      const allIssues = [...errors, ...(hasBlockingWarnings ? warnings : [])];
      const summary = allIssues.map((d) => {
        const loc = d.location ? ` (line ${d.location.line})` : '';
        return `${d.severity.toUpperCase()}${loc}: ${d.message}`;
      }).join('\n');

      annotate('error', filePath, `[profile: ${profile}] Validation failed:\n${summary || result.stderr || 'unknown error'}`);
      console.log(`  ✗ ${filePath} [${profile}] — ${allIssues.length} issue(s)`);
    } else {
      verifiedCount++;
      if (warnings.length > 0) {
        for (const w of warnings) {
          const loc = w.location ? ` (line ${w.location.line})` : '';
          annotate('warning', filePath, `[profile: ${profile}]${loc}: ${w.message}`);
        }
      }
      console.log(`  ✓ ${filePath} [${profile}]`);
    }
  }

  setOutput('verified-count', String(verifiedCount));
  setOutput('failed-count', String(failedCount));

  console.log('');
  console.log(`[verify-st-claims] Results: ${verifiedCount} passed, ${failedCount} failed`);

  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[verify-st-claims] Fatal error:', err);
  process.exit(1);
});
