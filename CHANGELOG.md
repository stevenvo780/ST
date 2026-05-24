# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [4.15.1] - 2026-05-24

### Added
- Subpath export `./reasoning/tactic-dsl` para que consumers puedan importar directamente sin `createRequire()` workaround.
- Re-export namespaced `TacticDSL` en barrel root (`src/index.ts`).

### Fixed
- Workaround `createRequire` en AgoraBack (`st_tactic_apply` tool) ya no necesario.

---

## [4.15.0] - 2026-05-24

### Added — Ciclo 3 barrel + subpath exports

- feat(proof-mining): extracción de lemmas auxiliares + persistencia expuesto vía barrel (`ProofMining`) y subpath `./reasoning/proof-mining` (C3-A, `82f9d71`).
- feat(stnb): formato notebook + parser/serializer/executor/renderer HTML+Markdown expuesto vía barrel (`STNotebook`) y subpath `./format/stnb` (C3-B, `12e02a7`).
- feat(dl-hybrid): differential dynamic logic subset perfil + invariant search expuesto vía barrels (`DLHybrid`, `DLHybridReasoning`) y subpaths `./logic/profiles/dl-hybrid`, `./reasoning/dl-hybrid` (C3-C, `d539c1b`).
- feat(lemma-rag): tactics-RAG con embeddings determinísticos hash-based expuesto vía barrel (`LemmaRAG`) y subpath `./reasoning/lemma-rag` (C3-D, `8cb6789`).
- exports: 5 subpath exports nuevos en `package.json` `exports` map para consumo granular desde AgoraFront/AgoraBack.

---

## [4.14.1] - 2026-05-18

### Added — V5 wave 7b (post-4.14.0)
- Sequent calculus intuicionista LJ + cut-elimination + embed Glivenko en `proof-systems/sequent-lj/` (`314f724`).
- Peano arithmetic P1-P6 + induction + comm/assoc theorems + Gödel encoding en `reasoning/peano-arithmetic/` (`16a2546`).
- Order theory posets + Dilworth + Hasse + Zorn finito + well-founded induction en `reasoning/order-theory/` (`48dfb12`).

### Added — Ecosystem (nuevos paquetes)
- `@stevenvo780/st-mcp@0.1.0` — MCP server para integración con Claude/LLMs.
- `@stevenvo780/st-cli@0.1.0` — CLI independiente distribuible.
- `vscode-st@0.1.0` — extensión VS Code (.vsix build).
- GitHub Action `verify-st-claims` v1 — Docker action para CI.

### Changed
- chore(lint): -661 issues via prettier + ESLint --fix + disables localizados (`658f3b6`).
- chore(cleanup): borrar `_releaseBranch` dead + campo `z3` huérfano.
- docs: regenerar `docs/api/` con 527 módulos (TSDoc 37.2% → 45.8%) (`8867b3a`).
- test: skip agora-integration-fixtures cuando fixture externo no existe (`0c538e4`).

---

## [4.14.0] - 2026-05-17

### Added — V5 wave 7
- Hoare logic verification en `reasoning/hoare-logic/` (`c9319a4`). 36 tests. WP/SP + symbolic exec + swap/factorial/gcd/linear-search.
- Separation logic en `reasoning/separation-logic/` (`a9dc906`). 26 tests. emp/points-to/star/magic-wand + listSegment/tree inductive predicates.
- Universal algebra en `reasoning/universal-algebra/` (`dfe0094`). 25 tests. Álgebras + homomorphisms + congruences + variedades + free term algebra.
- Model checking explicit-state en `reasoning/model-checking/` (`dfe0094`). 23 tests. BFS + safety/liveness GF/FG + BMC + deadlock + Peterson/Dining philosophers/Reader-writer.

### Changed
- ~5854 → ~5964 tests.

### Note
- Model checking detectó bug en modelo Peterson original durante desarrollo (permitía 2 procesos críticos simultáneamente). Modelo corregido + test safety validado.

---

## [4.13.0] - 2026-05-17

### Added — V5 wave 6
- Lambda Cube 8-system PTS en `type-theory/lambda-cube/` (`c243327`). 32 tests. λ→/λ2/λω/λP/λC + erasure.
- Polynomial ring Z/Q/Zp en `reasoning/polynomial-ring/` (`37950a4`). 36 tests. Euclid gcd + rational roots + Berlekamp + Sylvester resultant.
- Galois fields GF(p^n) en `reasoning/galois-fields/` (`f481722`). 26 tests. Rabin irreducibility + primitive elements + discrete log.
- Lattice theory en `reasoning/lattice/` (`73517bb`). 35 tests. Dedekind N5/M3 + Heyting + Boolean detection.
- Datalog engine en `reasoning/datalog/` (`a121a9f`). 26 tests. Semi-naive + SLD + magic sets + stratified negation.

### Changed
- ~5699 → ~5854 tests.

---

## [4.12.0] - 2026-05-17

### Added — V5 wave 5b (rescued + new)
- TSDoc → Markdown doc generator en `tooling/doc-gen/` (`caeab96`). 17 tests.
- Linear algebra primitives en `reasoning/linear-algebra/` (`72e6080`). 31 tests. LU/QR/SVD + eigenvalues + Gram-Schmidt.
- Constructive analysis Bishop en `reasoning/constructive-analysis/` (`199c0a9`). 23 tests. Cauchy seqs + IVT + Bishop integral.
- Test harness combinators en `tooling/test-harness/` (`199c0a9`). 20 tests. Cross-product + snapshots + mutation.
- Combinatorics en `reasoning/combinatorics/` (`f26aa2a`). 41 tests. Stirling/Catalan/Bell/Euler + Burnside + GFs.
- FOL prover advanced en `proof-systems/fol-prover-advanced/` (`f26aa2a`). 25 tests. Hyperresolution + SoS + KBO/LPO + subsumption.
- Set theory ZFC en `reasoning/set-theory/` (`b40ebdd`). 38 tests. HF sets Vω + von Neumann ordinals + ZFC axiom checks.

### Changed
- 5504 → ~5800 tests (real: 5699 passing).

### Notes
- 6 módulos fueron rescatados desde commits errantes a AgoraFront mediante revert+re-apply en ST. Repo principal correcto.

---

## [4.11.0] - 2026-05-17

### Added — V5 wave 5
- Graph theory comprehensive en `reasoning/graph-theory/` (`14db0aa`). 32 tests. Dijkstra/Bellman/Floyd + Kruskal/Prim + Hopcroft-Karp + isomorphism.
- Group presentations en `reasoning/group-presentation/` (`e08c0dd`). 31 tests. Todd-Coxeter HLT + Cayley graphs + S₃/S₄/Q₈/Klein.
- Coq exporter v2 en `tooling/exporters/coq-v2/` (`dc08a5a`). 51 tests. Dependent types + tactic strategies + proofterm + hints.
- Curated lemma library en `tooling/lemma-library/` (`2ecc4b0`). 27 tests + 95 lemmas. TF-IDF search + auto-apply.
- Provenance audit DAG en `tooling/provenance/` (`2f4fe51`). 20 tests. SHA-256 IDs + trust chain + audit risk.
- Distributed proof exchange gossip en `proof-systems/distributed-exchange/` (`3511dc3`). 19 tests. Multi-hop + anti-entropy + blacklist.

### Changed
- 5324 → ~5500 tests (+180 V5 wave 5).

---

## [4.10.0] - 2026-05-17

### Added — V5 wave 4
- Number theory en `reasoning/number-theory/` (`62e041b`). 26 tests. Miller-Rabin det. hasta 3.3·10²⁴, Pollard ρ, CRT, Jacobi.
- Natural deduction NK en `logic/profiles/natural-deduction-nk/` (`81df2ed`). 32 tests. DNE/LEM/Peirce vía rAA.
- Lean 4 exporter en `tooling/exporters/lean4/` (`0f27dea`). 102 tests. Unicode + Classical.em + ⟨x,hx⟩.
- Real analysis en `reasoning/real-analysis/` (`74cd6dd`). 32 tests. ε-δ + Simpson/Romberg/Gauss-Legendre + Taylor.
- Topology + homology en `reasoning/topology/` (`ffa251b`). 38 tests. Smith Normal Form + Betti Z/Z2 + RP²/Klein torsion.
- Automata DFA/NFA/PDA en `reasoning/automata/` (`1e6eeac`). 41 tests. Thompson + Hopcroft minimization.
- Computability en `reasoning/computability/` (`6b92dad`). 39 tests. Turing machines + bounded halting + PRF + Ackermann + Rice.

### Changed
- 5014 → ~5300 tests.

---

## [4.9.0] - 2026-05-17

### Added — V5 wave 3
- mathlib subset curado en `tooling/mathlib/` (`547023d`). 38 tests. Order/groups/rings/fields + Z/nZ + S3 + Rationals.
- Differential privacy en `reasoning/differential-privacy/` (`64b5164`). 38 tests. Laplace/Gaussian/exponential + composition.
- Algebraic effects + free monads en `type-theory/effects/` (`ab4e9db`). 31 tests. State/Reader/Writer/Exception.
- BAN logic crypto protocols en `reasoning/ban-logic/` (`47b049b`). 28 tests. Needham-Schroeder symmetric/PK + Kerberos.
- PROOFLIB certificate format en `proof-systems/certificate/` (`422a3b8`). 30 tests. LFSC import/export + Ed25519/HMAC sign.
- Quantum logic Birkhoff-vN en `logic/profiles/quantum/` (`ee439f4`). 30 tests. Cabello-18 KS provably non-colorable.

### Changed
- 4819 → ~5000 tests (~+200 V5 wave 3).

---

## [4.8.0] - 2026-05-17

### Added — V5 wave 2 (post-refactor)
- **Z3 WASM backend real** en `solver/smt-z3/` (`22a6550`). 28 tests. Reemplaza el mock con Z3 funcional in-process (LIA/LRA/BV/Bool/push-pop/unsat-cores). Dynamic import (no bundle bloat).
- **Cubical Type Theory subset** en `type-theory/cubical/` (`aa06ad3`). 30 tests. Intervalo + conexiones + β interválica + PathP + glue.
- **Mechanism design + VCG + Myerson** en `reasoning/mechanism-design/` (`6d548d9`). 24 tests. Auctions + revenue equivalence Monte Carlo.
- **Combinatorial games** en `reasoning/combinatorial-games/` (`904b912`). 43 tests. Sprague-Grundy + Surreales Conway + Nim/Chomp.
- **Probabilistic programming (PPL)** en `reasoning/probabilistic/` (`3715517`). 31 tests. 4 backends: enumerate/rejection/importance/MH MCMC.
- **ML-guided proof search** en `tooling/proof-guidance/` (`a657ed8`). 27 tests. Logistic regression + beam search + cycle detection.

### Changed
- 4636 → 4800+ tests (~+180 V5 wave 2).
- Z3 dep size: 34M dynamic (no afecta bundle publicado).

---

## [4.7.0] - 2026-05-17

### Changed — V5.0 α1 structural refactor
- **Reorganización por dominios** (8 buckets): logic/, proof-systems/, type-theory/, solver/, reasoning/, semantics/, tooling/ + runtime/ (mantenido).
- 60+ módulos movidos a su bucket semántico.
- API pública IDÉNTICA: 322 símbolos, 84 export lines, mismos 4 entry points (`dist/index.js`, `dist/api.js`, `dist/types/index.js`, `dist/protocol/handler.js`).
- Backward-compat 100%: consumers no requieren cambio alguno.

### Internal
- 4636 tests preservados (cero regresiones).
- 8 commits secuenciales por dominio para historial git limpio + bisect.
- `git log --follow` sigue rastreando todos los módulos movidos.

---

## [4.6.0] - 2026-05-17

### Added — V5 features wave
- Hindley-Milner algorithm W con let-polymorphism + occurs check (`6298495`). 42 tests.
- Categorical primitives: Category/Functor/NaturalTransformation + limits/colimits + monoidal (`9e06e66`). 30 tests.
- HoTT base: paths + transport + J + S¹ + suspension + ua axiom (`0748ec0`). 39 tests.
- TPTP parser FOF/CNF/TFF light + bridge a fol-prover (`c601120`). 73 tests.
- CSP Hoare con traces + failures + refinement semantics (`f436617`). 37 tests.
- Tactic DSL Lean/Coq-style con 14 tactics + 4 combinators (`dc7dbaf`). 39 tests.
- Lemma synthesis QuickSpec-style: enumeración + random testing + pruning (`704b454`). 33 tests.

### Tests infrastructure
- Property-based testing con fast-check: 38 properties, 5000 runs (`95f5911`).
- Performance regression CI: 87 benchmarks v5 + GH Actions auto-baselines (`5f9baac`).

### Known issues
- `export const then` top-level rompe Vite/vitest (módulo treated as thenable). Tactic DSL exports `seq` con alias `T.then`.
- buildModel en cdcl-v2/solver.ts:74-81: lógica `varVal===1 || varVal===0` siempre true. Cosmético — phase-saving siempre asigna, sin observable bug.

### Changed
- ~4087 → ~4400+ tests (~+300 nuevos en este release).

---

## [4.5.2] - 2026-05-17

### Added
- BDD ROBDDs con unique table + apply algorithm + quantification (`4b6f082`). 57 tests.
- Information theory: Shannon/Rényi entropy + KL/JS/TV/Hellinger + mutual info (`08471a0`). 42 tests.
- HOL (Higher-Order Logic) Church-style con 10 reglas primitivas (`e98145a`). 42 tests.
- Public API namespaces (Logic/ProofSystems/TypeTheory/Solvers/Reasoning/Semantics) (`e8f4121`). 25 paridad tests.
- LP simplex 2-phase + ILP branch-and-bound (`c6ccb8e`). 30 tests.
- Game theory: Nash equilibrium via Lemke-Howson + support enum + dominance (`1b4a6b5`). 20 tests.
- SMT-LIB v2 parser + emisor + tokenizer (22 comandos, 48 tests) (`9c777c3`).

### Changed
- 4041 → ~4087+ tests.
- API pública ahora accesible via flat exports + namespaces semánticos (backward-compat).

---

## [4.5.1] - 2026-05-17

### Fixed
- Re-exports de barrel para profile-bridge, tableau-framework, game-semantics, coinduction, higher-order-unify. Ahora accesibles vía `import { X } from '@stevenvo780/st-lang'`.

---

## [4.5.0] - 2026-05-17

### Added
- 4.8.1 SKI combinatory + bracket abstraction λ→SKI (`2cff5a5`). 25 tests.
- 4.8.2 NbE Normalization by Evaluation STLC con η-larga (`1c994e6`). 17 tests.
- 4.8.3 Constructive reals via Cauchy sequences + BigInt (`d1648b4`). 58 tests.
- 4.8.4 Game semantics IPC dialógicas Lorenzen-Felscher (`5d55678`). 21 tests.
- 4.8.5 Proof nets MLL + Danos-Regnier (`d4ae8a3`). 21 tests.
- 4.9.1 Higher-order Miller pattern unification (`9729b07`). 32 tests.
- 4.9.2 Coinduction streams + bisimulation (`8784951`). 10+ tests.
- 4.9.3 Tableau extensible framework (`4383f36`). 16 tests.
- 4.9.4 Profile bridge Glivenko + Gödel-McKinsey + LTL↔CTL (`57b8d40`). 37 tests.
- QA integration suite cross-modules V4 (`76e1b93`). 48 tests end-to-end.

### Changed
- 3731 → 3920+ tests (+200+ nuevos).

---

## [4.4.0] - 2026-05-17

### Added
- 4.6.1 Modal μ-calculus + fixed-point + ctlToMu (`db3c33d`). 32 tests.
- 4.6.2 Markov Logic Networks + Gibbs + MaxWalkSAT (`86c7ba3`). 22 tests.
- 4.6.3 Theorem cache LRU persistente + proof reuse (`4a59bec`). 42 tests.
- 4.6.4 Anti-unification Plotkin lgg + n-way (`695d893`). 25 tests.
- 4.6.5 STRIPS planner BFS+A*+FF heuristic (`475ef15`). 32 tests.
- 4.6.6 CSP solver AC-3+MAC+MRV+LCV (`d1d148b`). 17 tests.
- 4.7.1 System F polymorphic λ con Λ/type-app (`3be32a3`). 27 tests.
- 4.7.2 Martin-Löf Type Theory Π/Σ/Id/Nat + universe hierarchy (`afa1dec`). 34 tests.
- 4.7.3 Sequent LK + Gentzen Hauptsatz cut-elimination (`50b96bb`). 24 tests.
- 4.7.4 π-calculus Milner con scope extrusion (`098ede0`). 34 tests.
- 4.7.5 Refinement types bidireccional + VC solver (`7d38ab0`). 28 tests.

### Changed
- 3261 → 3610+ tests (+349 nuevos).

---

## [4.3.0] - 2026-05-17

### Added
- 4.4.1 Bisimulation Paige-Tarjan + strong/weak (`60cdc2e`). 19 tests.
- 4.4.2 Intuitionistic NJ + Kripke counter-models (`4a0dd5c`). 27 tests.
- 4.4.3 Abductive reasoning con cost preferences (`bcc0f04`). 26 tests.
- 4.4.4 Term Rewriting System + Knuth-Bendix + LPO (`4f43781`). 32 tests.
- 4.4.5 Proof minification con detrivialization/MP-compact (`aed1fa5`). 27 tests.
- 4.4.6 Lambda calc untyped puro + Church numerals (`0f38acc`). 22 tests.
- 4.5.1 Modal frame axioms K/T/B/4/5/D + S4/S5/KD45 (`19b1f3b`). 57 tests.
- 4.5.2 Substructural linear + affine logic (`8db6843`). 35 tests.
- 4.5.3 Many-valued Łukasiewicz/Gödel/Product. 21 tests.
- 4.5.4 Bayesian inference + MPE (`86a25d0`). 24 tests.
- 4.5.5 FCA Next Closure + Hasse lattice (`bcffd2f`). 27 tests.
- 4.5.6 Symbolic differentiation + gradient (`7cc6e4a`). 39 tests.

### Changed
- 3058 → 3414 tests (+ ~356 tests nuevos).

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
