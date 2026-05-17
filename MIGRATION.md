# Migration Guide — @stevenvo780/st-lang

## 3.2.3 → 3.3.0

Released 2026-05-16. Filed under "Foundations refresh". 100% backward compatible at the public API surface.

---

## TL;DR

- **Ningún cambio necesario** — es drop-in. `parse`, `evaluate`, `derive` tienen las mismas firmas.
- Si querés usar el type checker nuevo: `import { typeCheck } from '@stevenvo780/st-lang'`.
- Si querés AST visitors tipados: `import { visit, BaseASTVisitor } from '@stevenvo780/st-lang'` (disponibles desde el barrel principal, **no** hay subpath `/ast`).

---

## What's new

### `typeCheck(program, profile?, file?): TypeError[]`

Validación estática del AST antes de evaluar. Emite errores y warnings con
sugerencias tipo "did you mean...". No bloquea `evaluate` por defecto — el
caller decide si abortar.

```ts
import { parse, typeCheck } from '@stevenvo780/st-lang';

const result = parse(source);
if (result.errors.length === 0) {
  const typeErrors = typeCheck(result.program, 'classical.propositional', 'mi-archivo.st');
  for (const e of typeErrors) {
    console.warn(`[${e.code}] ${e.severity}: ${e.message}`);
    if (e.suggestion) console.warn(`  → ${e.suggestion}`);
  }
}
```

Tipo `TypeError`:
```ts
interface TypeError {
  code: string;        // e.g. 'TC001'
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string; // "did you mean..."
  location: SourceLocation;
}
```

### AST Visitors tipados — `visit` y `BaseASTVisitor`

Patron visitor exhaustivo sobre el discriminated union de `Statement`.
Exportados desde el barrel principal:

```ts
import { parse, visit, BaseASTVisitor } from '@stevenvo780/st-lang';
import type { Statement, DeriveCmdNode } from '@stevenvo780/st-lang';

class QuantifierCounter extends BaseASTVisitor<number> {
  protected defaultResult(_node: Statement): number {
    return 0;
  }

  override visitDeriveCmd(node: DeriveCmdNode): number {
    // cuenta cuántos derive hay en el programa
    return 1;
  }
}

const result = parse(source);
const counter = new QuantifierCounter();
const counts = result.program.statements.map((s) => visit(s, counter));
const total = counts.reduce((a, b) => a + b, 0);
```

`BaseASTVisitor<T>` implementa todos los métodos con `defaultResult()`.
Sobreescribí solo los que te interesan; TypeScript te avisa si agregás un
`kind` nuevo y olvidaste actualizar.

### Benchmark suite formal

Suite completa con baselines en `benchmarks/baselines.json`. Para
contributors:

```bash
npm run bench          # corre la suite
npm run bench:save     # corre + guarda nuevo baseline
npm run bench:compare  # compara results.json vs baselines.json
```

Baselines establecidos en esta versión (hardware de referencia):
- `evaluate short program`: ~0.007 ms / op
- `evaluate workspace small`: ~0.098 ms / op
- `evaluate workspace medium`: ~0.898 ms / op
- `check valid tautology`: ~0.007 ms / op

---

## No breaking changes

Las siguientes firmas **no cambiaron**:

| Función | Firma (sin cambios) |
|---|---|
| `parse(source, opts?)` | `STParseResult` |
| `evaluate(source, opts?)` | `STEvalResult` |
| `check(source, opts?)` | `STCheckResult` |
| `quickEval(source)` | `STEvalResult` |
| `createInterpreter(opts?)` | `STInterpreter` |
| `listProfiles()` | `LogicProfile[]` |

Todo consumidor que importaba desde `'@stevenvo780/st-lang'` compila sin
tocar nada.

---

## Internal refactors (informational)

El parser monolítico se descompuso en tres módulos:
- `src/parser/parser.ts` — orchestration principal
- `src/parser/state.ts` — estado mutable del parse (nuevo)
- `src/parser/formulas.ts` — parseo de fórmulas (nuevo)

**Impacto**: si consumías subpaths internos no documentados como
`@stevenvo780/st-lang/parser/parser` o cualquier path bajo `src/`, esos
rutas no están en los `exports` del `package.json` y nunca fueron parte
de la API pública. Con la reorganización interna pueden no resolver igual.
Migrá a los exports oficiales:

```json
"@stevenvo780/st-lang"          // barrel principal
"@stevenvo780/st-lang/api"      // API programática
"@stevenvo780/st-lang/types"    // tipos base
"@stevenvo780/st-lang/protocol" // ProtocolHandler
```

No existe subpath `@stevenvo780/st-lang/ast` — los visitors se importan
desde el barrel principal.

---

## Performance notes

Baselines formales establecidos en esta versión. Consultar
`benchmarks/baselines.json` para cifras completas por caso.

Referencia rápida (mediana, hardware de desarrollo):

| Caso | Tiempo / op |
|---|---|
| `evaluate` programa corto (~3 stmts) | ~0.007 ms |
| `evaluate` workspace pequeño (5 axiomas + derive) | ~0.098 ms |
| `evaluate` workspace mediano (15 axiomas + glossary) | ~0.904 ms |
| `check valid` tautología propositional | ~0.007 ms |
| CDCL 3-SAT mediano (50 vars, 214 cláusulas) | ~10.2 ms |

Los números varían según CPU. Usar `npm run bench:compare` para detectar
regresiones frente al baseline del repo.

---

## 3.3.0 → 4.5.0

Releases incrementales: 4.0.x → 4.1.0 → 4.2.0 → 4.3.0 → 4.4.0 → 4.5.0.
**Sin breaking changes en la API pública.** `parse`, `evaluate`, `check`, `quickEval`,
`createInterpreter`, `listProfiles`, `formulaToString`, `STInterpreter` mantienen firmas idénticas.

---

## Test suite

| Versión | Tests | Delta |
|---|---|---|
| 3.2.3 | 1 583 | — |
| 3.3.0 | 1 621 | +38 |
| 4.0.x | 2 074 | +453 |
| 4.1.0 | 2 705 | +631 (cobertura α1) |
| 4.2.0 | 3 058 | +353 |
| 4.3.0 | 3 414 | +356 |
| 4.4.0 | 3 731 | +317 |
| **4.5.0** | **4 041** | +310 (+200 features 4.8/4.9, +48 integration, +62 resto) |

---

## Nuevos exports desde `@stevenvo780/st-lang` (4.x)

Todo lo siguiente es aditivo. Importar desde el barrel principal salvo que se indique subpath.

### SAT solving

| Export | Descripción |
|---|---|
| `solveCDCLv2` | CDCL v2 (17-556× más rápido que v1 en benchmarks — ver nota de performance) |
| `cdcl`, `cdclAsync` | CDCL v1 — internamente usado por workers |
| `dpll`, `dpllAsync` | DPLL clásico |
| `workersAvailable`, `PARALLEL_THRESHOLD` | Flags del pool paralelo |
| `evalParallel`, `shutdownPool` | Evaluación paralela con worker pool |
| `ParallelEvalOptions`, `ParallelEvalResult` | Tipos |

### Type checking y visitors

| Export | Descripción |
|---|---|
| `typeCheck`, `TypeChecker` | Validación estática antes de `evaluate` (ya en 3.3.0) |
| `TypeError` | Tipo de error de typecheck |
| `visit`, `visitProgram`, `BaseASTVisitor` | Visitor pattern sobre AST (ya en 3.3.0) |
| `ASTVisitor` | Interfaz del visitor |

### Memoización y cache de teoremas

| Export | Descripción |
|---|---|
| `DerivationCache`, `hashFormula` | Cache de derivaciones |
| `TheoremCache`, `tryReuseProof` | Reuso persistente de pruebas |
| `CachedTheorem`, `TheoremCacheOptions`, `TheoremCacheStats`, `TheoremReuseResult` | Tipos |

### Streaming

| Export | Descripción |
|---|---|
| `streamEval` | Evaluación con `AsyncIterable<StreamEvent>` |
| `StreamEvent` | Tipo |

### Countermodel y proof utilities

| Export | Descripción |
|---|---|
| `minimizeCountermodel` | Minimización de contramodelos |
| `CountermodelMinOptions`, `CountermodelMinAlgorithm`, `MinimalCountermodel` | Tipos |
| `minifyProof`, `compactModusPonensChain`, `removeUnusedSubproofs` | Minificación de pruebas |
| `GenericProofNode`, `MinifyOptions`, `MinifyResult`, `MinifyRule` | Tipos |

### Exportadores y provers

| Export | Descripción |
|---|---|
| `exportToCoq`, `exportProofToCoq` | Exporta pruebas a Coq |
| `proveFOL`, `unify`, `skolemize`, `toCNF` | Prover FOL (subpath `./api`) |
| `toSMTLIB`, `MockSMTBackend`, `SubprocessSMTBackend`, `detectAvailableSMT` | Bridge SMT |
| `SMTBackend` | Tipo |

### Argumentation (Dung framework)

| Export | Descripción |
|---|---|
| `computeExtensions`, `isAdmissible`, `isConflictFree`, `defends`, `dotExport` | AF semánticas |
| `ArgumentationFramework`, `Semantics` | Tipos |

### Proof exchange e integridad

| Export | Descripción |
|---|---|
| `canonicalize`, `hashProof`, `signProof`, `verifyProof`, `generateKeyPair` | Pruebas firmadas |
| `ProofPackage` | Tipo |

### Time-travel (snapshots de estado)

| Export | Descripción |
|---|---|
| `captureSnapshot`, `SnapshotStore` | Historial de ejecución |
| `STSnapshot`, `SnapshotDiff` | Tipos |

### Educational

| Export | Descripción |
|---|---|
| `generateExercise`, `checkAnswer`, `generateLessonPath` | Generación de ejercicios |
| `Exercise`, `ExerciseLevel`, `ExerciseKind` | Tipos |

### Citation reasoning (δ3)

| Export | Descripción |
|---|---|
| `deriveWithCitations`, `explainProof` | Derivación con trazabilidad de fuentes |
| `CitedClaim`, `CitationDerivation`, `CitationDerivationResult`, `DerivationStep`, `Evaluator` | Tipos |

### Type theory avanzada

**Curry-Howard:**

| Export | Descripción |
|---|---|
| `inferType`, `isInferError`, `reduceBeta`, `normalize`, `isNormal` | Inferencia de tipos λ-cálculo tipado |
| `termToProof`, `proofToTerm`, `proofIsConsistent`, `ProofConversionError` | Correspondencia term ↔ proof |
| `chTypeToString`, `chTermToString`, `chEqType` | Utils de display |
| `PropType`, `LambdaTerm`, `ProofTree`, `ProofRule`, `CHContext`, `InferResult` | Tipos |

**Martin-Löf Type Theory (MLTT):**

| Export | Descripción |
|---|---|
| `mVar`, `mUniverse`, `mPi`, `mLam`, `mApp`, `mSigma`, `mPair`, `mFst`, `mSnd` | Constructores de términos MLTT |
| `mId`, `mRefl`, `mNat`, `mZero`, `mSucc`, `mArrow` | Constructores de tipos |
| `mlttInferType`, `mlttCheckType`, `mlttIsInferError`, `mlttNormalize`, `mlttReduceStep` | Kernel |
| `mlttIsNormal`, `mlttAlphaEq`, `mlttAlphaBetaEq`, `mlttSubstitute`, `mlttFreeVars`, `mlttOccursFree`, `mlttTermToString` | Utils |
| `MLTTTerm`, `MLTTInferContext`, `MLTTInferResult` | Tipos |

**λ-cálculo untyped puro (β/η, estrategias, Church numerals):**

| Export | Descripción |
|---|---|
| `lcVar`, `lcLam`, `lcAp`, `lcApN` | Constructores |
| `lcAlphaEq`, `lcTermToString`, `lcFreeVars`, `lcSubstitute`, `lcAlphaRename`, `lcMakeFreshSupply` | Utils |
| `lcBetaStep`, `lcEtaStep`, `lcNormalize`, `lcIsNormalForm`, `lcIsWHNF` | Reducción |
| `lcI`, `lcK`, `lcS`, `lcY`, `lcOmega`, `lcOmegaSmall` | Combinadores clásicos |
| `lcChurchNumeral`, `lcDecodeChurch`, `lcEvalChurch`, `lcChurchSucc`, `lcChurchAdd`, `lcChurchMul` | Church numerals |
| `LCTerm`, `LCBetaStrategy`, `LCNormalStrategy`, `LCNormalizeOpts`, `LCNormalizeResult` | Tipos |

### Formato extendido

| Export | Descripción |
|---|---|
| `formulaToUnicode`, `formulaToLaTeX` | Render a Unicode / LaTeX |
| `detectFallacies` | Detección de falacias informales |
| `FallacyInfo` | Tipo |

### Text Layer

| Export | Descripción |
|---|---|
| `TextLayerState`, `createTextLayerState`, `parseAnchorPath` | Estado de capa textual |
| `registerPassage`, `registerFormalization`, `registerClaim`, `registerSupport` | Registros |
| `registerConfidence`, `registerContext`, `compileClaimsToTheory`, `registerDefinition`, `registerSource`, `registerInterpretation` | Compilador |
| `ClaimGraph`, `CycleError` | Grafo de claims v2 con propagación de invalidación |
| `Claim`, `ClaimValidation`, `ClaimSource`, `ClaimEvaluator` | Tipos v2 |

### LSP helpers

| Export | Descripción |
|---|---|
| `hover`, `symbols`, `gotoDefinition`, `completion`, `render` | Soporte LSP básico (desde `./api`) |
| `STHoverResult`, `STRenderResult` | Tipos |

---

## Subpaths disponibles

| Subpath | Contenido |
|---|---|
| `@stevenvo780/st-lang` | Barrel completo |
| `@stevenvo780/st-lang/api` | API programática (`evaluate`, `parse`, `check`, LSP helpers) |
| `@stevenvo780/st-lang/types` | Tipos base del AST |
| `@stevenvo780/st-lang/protocol` | `ProtocolHandler` |

No existen subpaths para módulos internos (`/ast`, `/parser`, `/solver`, etc.).

---

## Performance notes (4.x)

- **CDCL v2** (`solveCDCLv2`): 17-556× más rápido que CDCL v1 en benchmarks de satisfacibilidad.
  Los workers internos conservan v1 para compatibilidad de protocolo.
- **Parallel pool** (`evalParallel`): evaluación de múltiples programas en worker threads.
  Usar `shutdownPool()` al terminar el proceso para liberar workers.
- **DerivationCache / TheoremCache**: reducen tiempo de re-derivación en workspaces grandes
  que repiten axiomas. Usar con caution en entornos con memoria limitada.

Benchmarks de referencia establecidos en 3.3.0 (sin cambios de firma en 4.x):

| Caso | Tiempo / op |
|---|---|
| `evaluate` programa corto (~3 stmts) | ~0.007 ms |
| `evaluate` workspace pequeño (5 axiomas + derive) | ~0.098 ms |
| `evaluate` workspace mediano (15 axiomas + glossary) | ~0.904 ms |
| CDCL 3-SAT mediano (50 vars, 214 cláusulas) | ~10.2 ms |
