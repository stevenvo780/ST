# ST Roadmap — V3.2.3 → V4.5.0 "Reasoning Foundation"

> Vivo. Cada fase produce un release publicable. Fechas estimadas asumen agentes paralelos.
> **Estado actual**: v4.5.0 publicado en npm. 4041 tests, 52+ módulos.

## Visión V4

ST hoy es lenguaje + intérprete + verificador (11 perfiles lógicos, CDCL paralelo, Text Layer básica).
ST V4 será:
- **Co-piloto formal IA-nativo**: el agente IA del Agora invoca ST tools internamente para verificar argumentos en tiempo real.
- **Universal proof carrier**: cada doc del workspace tiene capa ST que verifica claims y propaga incertidumbre.
- **Multi-modal reasoning**: LLM heurístico + ST deductivo + SMT decisión.
- **Distributed proof exchange**: pruebas formales firmadas y compartibles entre workspaces.

---

## Fase α — V3.3.0 "Foundations refresh" [DONE]

| ID | Scope | Estado |
|---|---|---|
| α1 | Coverage holes audit; tests faltantes hasta >95% statement | [PARTIAL] cobertura alcanzó 86%, objetivo era 95% |
| α2 | Refactor parser monolítico → AST visitors tipados | [DONE] |
| α3 | Type checker estricto en runtime con sugerencias humanas | [DONE] TC001–TC008 + Levenshtein |
| α4 | Limpieza deuda: `any` casts, comentarios prohibidos, regressions consolidadas | [DONE] |
| α5 | Benchmark suite formal con baselines JSON + CI comparable | [DONE] |

**Salida**: `@stevenvo780/st-lang@3.3.0` publicado en npm.

---

## Fase β — V3.5.0 "Performance & Concurrency" [DONE]

| ID | Scope | Estado |
|---|---|---|
| β1 | SAT solver estado del arte: VSIDS + clause learning + restart strategies (Luby) | [DONE] CDCL v2 |
| β2 | Worker threads pool — múltiples profiles paralelos sobre mismas premisas | [DONE] |
| β3 | Cache compartido de derivaciones (memoización persistente en disco opcional) | [DONE] |
| β4 | SMT bridge opcional: Z3/cvc5 vía WASM para fragmentos LRA/LIA/BV | [PARTIAL] bridge implementado sin WASM real |
| β5 | Streaming evaluation: yield resultados parciales mientras evalúa | [DONE] |

**Salida**: `@stevenvo780/st-lang@3.5.0`.

---

## Fase γ — V3.7.0 "AI-Native Integration" [DONE]

| ID | Scope | Estado |
|---|---|---|
| γ1 | ST tools tipadas para agente IA Agora: `st_check`, `st_derive`, `st_countermodel`, `st_formalize` | [DONE] |
| γ2 | Prompt feedback loop: LLM propone → ST valida → contraejemplo estructurado → LLM corrige | [DONE] |
| γ3 | Auto-formalización API: prosa libre → ST con confidence score | [DONE] |
| γ4 | Belnap-aware reasoning para el agente: maneja `{T, F, both, neither}` | [DONE] |
| γ5 | Trace explicable: árbol de pruebas humano-leíble + LaTeX export | [DONE] |

**Salida**: `@stevenvo780/st-lang@3.7.0` + tools registradas en AgoraBack.

---

## Fase δ — V3.9.0 "Document-Centric Verification" [DONE]

| ID | Scope | Estado |
|---|---|---|
| δ1 | Text Layer 2.0: claims con dependencias (invalidación propagada) | [DONE] |
| δ2 | ST-MDX bidireccional: editar prosa actualiza ST y viceversa | [DONE] |
| δ3 | Citation-aware reasoning: derive con citas internas cross-docs | [DONE] |
| δ4 | Proof obligation cards UI: cada premisa con estado (verified/pending/failed) | [DONE] |
| δ5 | Linter académico realtime: falacias formales + circular reasoning | [DONE] |

**Salida**: `@stevenvo780/st-lang@3.9.0` + UI cards en AgoraFront.

---

## Fase ε — V4.0 "Distributed Reasoning" [DONE]

| ID | Scope | Estado |
|---|---|---|
| ε1 | Proof exchange format: serialización determinística + firma criptográfica Ed25519 | [DONE] |
| ε2 | Hyperreal extensions: probabilistic logic con uncertainty propagation real | [DONE] |
| ε3 | Time-traveling proofs: snapshots ST por commit del workspace | [DONE] |
| ε4 | Plugin system: usuarios registran perfiles lógicos custom | [DONE] |
| ε5 | FOL theorem prover light (resolution-based) | [DONE] |

**Salida**: `@stevenvo780/st-lang@4.0.0` publicado en npm.

---

## Wildcards extra (post-V4)

| W | Descripción | Estado |
|---|---|---|
| W1 | **ST → Coq/Lean exporter** — generar pruebas formales para asistentes maduros | [DONE] |
| W2 | **ST playground web** en `agora.elenxos.com/st` con visualización árbol pruebas | [DONE] |
| W3 | **Multi-tenant ST cloud** — libraries ST compartidas entre workspaces | [TODO] |
| W4 | **Lattice 3D viewer** Belnap + modal frames con react-three-fiber | [PARTIAL] visualización 2D implementada, 3D sin terminar |
| W5 | **ST-LSP** — language server (autocompletado/hover/go-to-def) para `.st` en VSCode/web | [DONE] |
| W6 | **Agent dialogue tactics** — el agente IA aprende qué tools ST invocar por tipo de pregunta | [TODO] |
| W7 | **Educational mode** — ST genera ejercicios progresivos según nivel del usuario | [DONE] |
| W8 | **Argumentation graphs** — threads de docs → grafos Dung, compute extensions | [DONE] Dung argumentation implementada |
| W9 | **ST-as-a-Service** — endpoint público autenticado | [DONE] |
| W10 | **Time-travel debugger UI** — replay paso a paso de derivación | [DONE] |

---

---

## Beyond V4 — implementado en 4.1–4.5

Módulos completados en el sprint 4.1–4.5, más allá del scope original del roadmap V4.

### 4.1.0 — MDX Bridge + cobertura
- ST-MDX bridge bidireccional (δ2 completado con API estable).
- Cobertura de tests subió de 78% a 86%.

### 4.2.0 — Decision procedures & modal
- SAT incremental (reutiliza estado entre consultas).
- ALC Description Logic: subsumption e instance checking.
- Countermodel minimization.
- Sequent calculus G3.
- Curry-Howard isomorphism.
- AGM belief revision.
- CTL (Computation Tree Logic).
- LTL (Linear Temporal Logic).
- Hybrid logic con operadores @.
- MUS (Minimal Unsatisfiable Subsets).
- FOL con igualdad.
- Default logic.

### 4.3.0 — Term mechanics & non-classical
- Bisimulation para equivalencia de modelos.
- Intuicionista NJ (natural deduction completa).
- Abduction (inferencia a la mejor explicación).
- TRS + Knuth-Bendix completion.
- Proof minification.
- λ-calculus con α/β/η.
- Modal frame construction.
- Substructural logic (lineal/afín).
- Many-valued logic (Łukasiewicz, Gödel).
- Bayesian reasoning con redes.
- FCA (Formal Concept Analysis).
- Symbolic differentiation.

### 4.4.0 — Advanced type theory & process calculi
- μ-calculus con punto fijo mínimo/máximo.
- MLN (Markov Logic Networks).
- Theorem cache persistente.
- Anti-unification (lgg de términos).
- STRIPS planning.
- AC-3 CSP.
- System F con polimorfismo paramétrico.
- MLTT (Martin-Löf Type Theory).
- Sequent calculus LK.
- π-calculus.
- Refinement types.

### 4.5.0 — Computation & proof foundations
- SKI combinators.
- NbE (Normalización por Evaluación).
- Constructive reals.
- Game semantics.
- Proof nets para lógica lineal.
- Higher-Order Unification (HO-unify).
- Coinduction.
- Tableau framework genérico.
- Profile bridge (mapeo semántico entre perfiles).
- 48 integration tests nuevos.

---

## Convenciones

- Cada fase: branch `feature/v3.X-phase-Y` o commits atomic con prefix `feat(stX):`.
- Tests primero (TDD) en cada subtarea.
- `npm version minor` solo después de validar integración con AgoraFront.
- `CHANGELOG.md` actualizado por cada release.
