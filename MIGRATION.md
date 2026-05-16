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
