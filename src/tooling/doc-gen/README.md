# `tooling/doc-gen` — TSDoc → Markdown documentation generator

Generador de documentación de API que parsea TSDoc/JSDoc directamente
con el **TypeScript Compiler API** (sin dependencias extra; `typescript`
ya está en `devDependencies`) y produce Markdown, JSON o HTML minimal
por módulo.

## Uso programático

```ts
import { generateDocs } from '../tooling/doc-gen';

await generateDocs({
  rootDir: 'src',          // raíz del código a documentar
  outputDir: 'docs/api',   // donde escribir los .md / .json / .html
  template: 'markdown',    // 'markdown' (default) | 'json' | 'html-minimal'
  includeInternal: false,  // include símbolos no exportados / @internal
});
```

## API low-level

```ts
import {
  extractDocs,
  parseJSDoc,
  renderMarkdown,
  renderJSON,
  renderIndex,
} from '../tooling/doc-gen';

const modules = extractDocs('src', { includeInternal: false });

// → Mapa { 'tooling/doc-gen/extract.md' → '# `tooling/doc-gen/extract.ts` ...' }
const md = renderMarkdown(modules);

// → JSON serializable
const raw = renderJSON(modules);

// → Solo el overview / index
const idx = renderIndex(modules);
```

## Lo que entiende del JSDoc/TSDoc

- `@param name description` (formato corto, sin tipos — los toma del compilador)
- `@returns description` / `@return description`
- `@example` (multi-línea; se respetan fences si el contenido los trae)
- `@remarks` (sección "Remarks" en el output)
- `@see` (puede repetirse; aparece como bullet list)
- `@deprecated` (marca DEPRECATED en el título y avisa)
- `@internal` (oculta el símbolo salvo que `includeInternal: true`)
- `@fileoverview` / `@file` para descripción a nivel de archivo

## Qué se exporta como ApiDoc

Símbolos top-level con `export`:
- `function`
- `class` (header sin cuerpo)
- `interface` (header sin cuerpo)
- `type` (alias completos)
- `const` (incluyendo `let`/`var`; tipo anotado si existe)
- `enum`
- `namespace` / `module`

Símbolos sin `export` se omiten salvo `includeInternal: true`.

## Output

- **markdown** — un `.md` por módulo + un `index.md` raíz con tabla
  resumen (cantidad de módulos, símbolos por kind, links a cada módulo).
- **json** — un único `api.json` con la estructura `{ modules: DocModule[] }`.
- **html-minimal** — un único `index.html` con el index incrustado en
  `<pre>`. Útil para preview sin pipeline de Markdown.

## Warnings

`generateDocs(...)` devuelve `warnings: string[]` con los símbolos que
no tienen descripción (útil para encontrar gaps de documentación).

## Notas de diseño

- El generador **no** ejecuta el código; sólo lee fuente y AST. No
  hay riesgo de side-effects.
- No genera nada para archivos `*.test.ts` / `*.spec.ts` ni directorios
  `tests/`, `__tests__/`, `dist/`, `node_modules/`, dotfiles.
- `index.ts` con sólo re-exports aparece igual (pero su `exports` queda
  vacío si no hay declaraciones locales con JSDoc).
- Las firmas (`signature`) se construyen sintéticamente desde el
  source code (sin cuerpo de funciones/clases) y se normalizan a una
  sola línea con whitespace colapsado.

## No commitee

Este repo **no** trackea el output generado (`docs/api/`). El
generador y este README sí entran al repo; el output se construye
on-demand. Si quieres versionarlo, añade un script post-build.
