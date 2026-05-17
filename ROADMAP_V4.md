# ST Roadmap — V3.2.3 → V4.0 "Reasoning Foundation"

> Vivo. Cada fase produce un release publicable. Fechas estimadas asumen agentes paralelos.

## Visión V4

ST hoy es lenguaje + intérprete + verificador (11 perfiles lógicos, CDCL paralelo, Text Layer básica).
ST V4 será:
- **Co-piloto formal IA-nativo**: el agente IA del Agora invoca ST tools internamente para verificar argumentos en tiempo real.
- **Universal proof carrier**: cada doc del workspace tiene capa ST que verifica claims y propaga incertidumbre.
- **Multi-modal reasoning**: LLM heurístico + ST deductivo + SMT decisión.
- **Distributed proof exchange**: pruebas formales firmadas y compartibles entre workspaces.

---

## Fase α — V3.3.0 "Foundations refresh"

| ID | Scope | Agente | Zona exclusiva |
|---|---|---|---|
| α1 | Coverage holes audit; tests faltantes hasta >95% statement | Sonnet | `src/tests/` (nuevos archivos) |
| α2 | Refactor parser monolítico → AST visitors tipados | **Opus** | `src/core/parser/` (excl. tests) |
| α3 | Type checker estricto en runtime con sugerencias humanas | Sonnet | `src/runtime/typecheck/` (nuevo dir) |
| α4 | Limpieza deuda: `any` casts, comentarios prohibidos, regressions consolidadas | Sonnet | cross-cutting, post α2 |
| α5 | Benchmark suite formal con baselines JSON + CI comparable | Sonnet | `benchmarks/`, `scripts/bench/` |

**Salida**: `@stevenvo780/st-lang@3.3.0` publicado en npm.

---

## Fase β — V3.5.0 "Performance & Concurrency"

| ID | Scope | Agente |
|---|---|---|
| β1 | SAT solver estado del arte: VSIDS + clause learning + restart strategies (Luby) | Opus |
| β2 | Worker threads pool — múltiples profiles paralelos sobre mismas premisas | Sonnet |
| β3 | Cache compartido de derivaciones (memoización persistente en disco opcional) | Sonnet |
| β4 | SMT bridge opcional: Z3/cvc5 vía WASM para fragmentos LRA/LIA/BV | Opus |
| β5 | Streaming evaluation: yield resultados parciales mientras evalúa | Sonnet |

**Salida**: `@stevenvo780/st-lang@3.5.0`.

---

## Fase γ — V3.7.0 "AI-Native Integration"

| ID | Scope | Agente |
|---|---|---|
| γ1 | ST tools tipadas para agente IA Agora: `st_check`, `st_derive`, `st_countermodel`, `st_formalize` | Opus |
| γ2 | Prompt feedback loop: LLM propone → ST valida → contraejemplo estructurado → LLM corrige | Opus |
| γ3 | Auto-formalización API: prosa libre → ST con confidence score | Opus |
| γ4 | Belnap-aware reasoning para el agente: maneja `{T, F, both, neither}` | Sonnet |
| γ5 | Trace explicable: árbol de pruebas humano-leíble + LaTeX export | Sonnet |

**Salida**: `@stevenvo780/st-lang@3.7.0` + tools registradas en AgoraBack.

---

## Fase δ — V3.9.0 "Document-Centric Verification"

| ID | Scope | Agente |
|---|---|---|
| δ1 | Text Layer 2.0: claims con dependencias (invalidación propagada) | Opus |
| δ2 | ST-MDX bidireccional: editar prosa actualiza ST y viceversa | Opus |
| δ3 | Citation-aware reasoning: derive con citas internas cross-docs | Sonnet |
| δ4 | Proof obligation cards UI: cada premisa con estado (verified/pending/failed) | Sonnet (front) |
| δ5 | Linter académico realtime: falacias formales + circular reasoning | Opus |

**Salida**: `@stevenvo780/st-lang@3.9.0` + UI cards en AgoraFront.

---

## Fase ε — V4.0 "Distributed Reasoning"

| ID | Scope | Agente |
|---|---|---|
| ε1 | Proof exchange format: serialización determinística + firma criptográfica | Opus |
| ε2 | Hyperreal extensions: probabilistic logic con uncertainty propagation real | Opus |
| ε3 | Time-traveling proofs: snapshots ST por commit del workspace | Sonnet |
| ε4 | Plugin system: usuarios registran perfiles lógicos custom | Opus |
| ε5 | FOL theorem prover light (resolution-based) | Opus |

**Salida**: `@stevenvo780/st-lang@4.0.0` 🎉

---

## Wildcards extra (post-V4)

1. **ST → Coq/Lean exporter** — generar pruebas formales para asistentes maduros.
2. **ST playground web** en `agora.elenxos.com/st` con visualización árbol pruebas.
3. **Multi-tenant ST cloud** — libraries ST compartidas entre workspaces.
4. **Lattice 3D viewer** Belnap + modal frames con react-three-fiber.
5. **ST-LSP** — language server (autocompletado/hover/go-to-def) para `.st` en VSCode/web.
6. **Agent dialogue tactics** — el agente IA aprende qué tools ST invocar por tipo de pregunta (RAG sobre proofs viejos).
7. **Educational mode** — ST genera ejercicios progresivos según nivel del usuario.
8. **Argumentation graphs** — threads de docs → grafos Dung de argumentos atacándose, compute extensions.
9. **ST-as-a-Service** — endpoint público autenticado, terceros usan el engine sin instalar.
10. **Time-travel debugger UI** — replay paso a paso de derivación con DevTools-style.

---

## Convenciones

- Cada fase: branch `feature/v3.X-phase-Y` o commits atomic con prefix `feat(stX):`.
- Tests primero (TDD) en cada subtarea.
- `npm version minor` solo después de validar integración con AgoraFront.
- `CHANGELOG.md` actualizado por cada release.
