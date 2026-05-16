# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.3.0] - 2026-05-16

### Added

- **α1 — Coverage hole audit** (`6e8f52c`): +385 tests nuevos; cobertura
  statements sube de 71 % → 78,81 %. Total suite: 1583 → 1621 tests.
- **α3 — Type checker estricto en runtime** (`92914a1`): módulo
  `src/runtime/typecheck/` con reglas TC001/TC002/TC004/TC005/TC006/TC007/TC008.
  API pública: `typeCheck(program, profile, file): TypeError[]`.
  Sugerencias automáticas por distancia Levenshtein ≤ 2. +38 tests.
- **α5 — Benchmark suite** (`0621be6`): 69 benchmarks en `benchmarks/`
  (parser, cdcl, profiles, text-layer, end-to-end) con `baselines.json` y
  `scripts/bench/compare.mjs`. Regression detection: warn ≥ 10 % / fail ≥ 25 %.

### Changed

- **α2 — Refactor parser monolítico → AST visitors tipados**
  (`7548769`, `3804f1a`): `parser.ts` pasa de 1904 LOC monolito a 1222 LOC
  facade + `state.ts` (190 LOC) + `formulas.ts` (550 LOC). Nuevo visitor base
  `src/ast/visitor.ts` (301 LOC) con `ASTVisitor<T>`, `visit<T>()` exhaustivo y
  `BaseASTVisitor<T>`.

### Fixed

- **α4 — Cleanup deuda técnica** (`6202b08`, `6f9cd08`): 3 errores typecheck
  corregidos (coverage-fill-format, coverage-fill-probabilistic, checker.ts
  duplicate param). 0 `any` injustificados. 0 comentarios prohibidos.
