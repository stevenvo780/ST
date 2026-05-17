# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.2.0] - 2026-05-17

### Added
- **4.2.1 SAT incremental** (`31b5838`): `IncrementalCDCL` con push/pop, assumptions, failedAssumptions via cone-of-conflict. 32 tests.
- **4.2.2 ALC Description Logic** (`1b58ef4`): tableau con NNF, ∃/∀ duality, TBox internalization, subset blocking. 41 tests.
- **4.2.3 Countermodel minimization** (`675618b`): 3 algoritmos (one-at-a-time, binary-search, delta-debug). 28 tests.
- **4.2.4 Sequent calculus G3** (`daba532`): backward proof + bussproofs LaTeX export. 29 tests.
- **4.2.5 Curry-Howard** (`d761ec9`): term ↔ proof, β-reducción, type inference. 44 tests.
- **4.2.6 Belief revision AGM** (`d761ec9`): expand/contract/revise con Levi identity. 25 tests.
- **4.3.1 CTL model checker** (`460f1ca`): bounded BMC con witness paths lasso. 28 tests.
- **4.3.2 LTL satisfiability** (`c287eff`): tableau Vardi-Wolper con witness. 30 tests.
- **4.3.3 Hybrid logic** (`d4cf578`): nominales + @-operator + ↓-binder. 20 tests.
- **4.3.4 MUS extraction** (`15ca8ba`): deletion/insertion/QuickXplain. 35 tests.
- **4.3.5 FOL equality** (`3d8788f`): paramodulation + demodulation + factoring. 16 tests.
- **4.3.6 Default logic Reiter** (`c287eff`): credulous/skeptical entailment. 25 tests.

### Changed
- 2705 → 3058 tests (+353 tests nuevos en 12 módulos).

---

## [4.1.0] - 2026-05-17

### Added
- **δ2 — MDX-ST bidirectional bridge** (`3659246`): `mdxToClaims`, `claimsToMDX`, `diffMDX`. Soporta HTML comments y fences ```st-claim. 22 tests.

### Changed
- **α1 cobertura** (`9df79e7`): statements 78.8% → 86.24%, branches 67.97% → 75.27%, functions 83.28% → 92.55%. +631 tests dirigidos a interpreter ND, propositional DPLL, modal tableau, CDCL learned-clause, SMT backends, FOL prover, argumentation.

### Notes
- Repo housekeeping: `coverage/`, `benchmarks/results.json` ahora gitignored. `ROADMAP_V4.md` trackeado.
- 2074 → 2705 tests passing (+631).

---

## [4.0.0] - 2026-05-17

### Added

- **β1 — CDCL state-of-the-art** (`ec47ece`): VSIDS + clause learning 1-UIP +
  Luby restarts + phase saving + LBD. API: `solveCDCLv2()`. 44 tests nuevos.
- **β2 — Worker threads pool** (`f6d8778`): `evalParallel()`, `shutdownPool()`.
  12 tests.
- **β3 — Cache LRU derivaciones** (`048dd48`): `DerivationCache`,
  `hashFormula()` con alpha-canonical hashing. Persist opcional. 28 tests.
- **β4 — SMT bridge** (`7363601`): `toSMTLIB()`, `MockSMTBackend`,
  `SubprocessSMTBackend` (z3/cvc5 stdio). 33 tests.
- **β5 — Streaming evaluation** (`048dd48`): `streamEval()` AsyncIterable +
  AbortSignal. 14 tests.
- **δ1 — Text Layer 2.0** (`7876cf9`): `ClaimGraph` con Tarjan SCC + Kahn
  topological + invalidación propagada. 27 tests.
- **δ3 — Citation-aware reasoning** (`93c3eff`): `deriveWithCitations`,
  `explainProof`. 13 tests.
- **ε1 — Proof exchange** (`97d63a7`): `canonicalize()`, `hashProof()`,
  `signProof()` Ed25519 WebCrypto. 15 tests.
- **ε2 — Hyperreal probabilistic** (`ebcb901`): `Hyperreal` con
  infinitesimales, `propagate` uncertainty bounds. 32 tests.
- **ε3 — Time-travel snapshots** (`b060035`): `captureSnapshot`,
  `SnapshotStore`, `SnapshotDiff`. 24 tests.
- **ε4 — Plugin system** (`f70aa58`): `ProfileRegistry`, `validatePlugin`.
  32 tests.
- **ε5 — FOL prover** (`efc8481`): resolution-based con skolemización + CNF +
  unify. 25 tests.
- **W1 — Coq exporter** (`b9cc108`): `exportToCoq`, `exportProofToCoq`.
  77 tests.
- **W5 — LSP server** (`6f1d034`): `STLanguageServer`
  hover/definition/completion/diagnostics + `bin/st-lsp.js`. 19 tests.
- **W7 — Educational mode** (`16f1ab0`): `generateExercise`, `checkAnswer`,
  `generateLessonPath` con 17 templates en 4 niveles. 37 tests.
- **W8 — Dung argumentation** (`2be174a`): `computeExtensions`,
  grounded/preferred/stable/complete/semi-stable. 21 tests.
- **Fase γ — AI-Native Integration** (en AgoraBack): tools `st_check`,
  `st_derive`, `st_countermodel`, `st_formalize`; feedback loop LLM↔ST;
  auto-formalizer unificado; Belnap-aware reasoning; trace LaTeX export.
- **Wildcards consumer-side** (en AgoraFront/AgoraBack): web playground
  `/st-playground`, lattice viewer SVG `/lattice-viewer`, proof debugger
  `/proof-debugger`, agent dialogue tactics RAG, ST-as-a-Service endpoint.

### Performance

- **β1**: bench 17–556× speedup sobre CDCL v1 en conjuntos satisfacibles e
  insatisfacibles.

### Notes

- Suite total: 1583 → 2074+ tests (+491 nuevos).
- **Breaking change (convención)**: major bump por amplitud de alcance. La API
  pública es backward-compatible: `parse`, `evaluate`, `derive`, `check`,
  `formulaToString`, `STInterpreter` sin cambios. `typeCheck` es aditivo.

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
