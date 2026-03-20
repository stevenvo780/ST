# ST Language — Roadmap hacia v3.0

## Visión: Razonamiento Formal sobre Textos Reales

> **Principio rector**: ST debe ser el puente más corto entre un texto humano y su análisis lógico formal — sin convertirse en un lenguaje de programación general ni en un CMS.

### El ciclo que v3 debe hacer natural:

```
TEXTO → FUENTE → INTERPRETAR → DEFINIR → RAZONAR → VERIFICAR → DOCUMENTAR
  ↑                                                                    |
  └────────────────────────────────────────────────────────────────────┘
```

Hoy ST cubre bien **RAZONAR** y **VERIFICAR** (11 perfiles lógicos, CDCL, tableaux, contramodelos). La capa textual (`passage`, `formalize`, `claim`) es funcional pero primitiva. Falta un sistema de **definiciones formales**, **atribución de fuentes**, y **generación de documentación**.

---

## Estado actual (v2.8)

| Capa | Capacidades | Limitaciones |
|------|-------------|--------------|
| **Lógica** | 11 perfiles, derive, prove, check, truth_table, explain, CDCL paralelo | ✅ Robusto |
| **Scripting** | let (5 variantes), set, fn, if/for/while, import/export | ✅ Suficiente |
| **Texto** | passage, formalize, claim, support, confidence, context | ⚠️ Sin proveniencia, sin definiciones expandibles |
| **Teorías** | theory + extends + private/public | ⚠️ Namespaces planos, sin import selectivo |
| **Salida** | print, render, analyze, explain, LaTeX/Unicode | ⚠️ Sin exportación estructurada |

---

## Releases intermedios

### v2.9 — Definiciones Formales

**Objetivo**: Que el usuario pueda crear definiciones eliminables con parámetros, y que el motor las expanda automáticamente durante el razonamiento.

#### Nuevos constructos

```st
// Definición conservativa con parámetros
define Mortal(x) := exists y. (Causa(y, muerte(x)))
define Justo(x) := forall a. (Accion(x, a) -> Buena(a))

// Definición proposicional (sin parámetros)
define LEM := P | !P
define Contraposicion := (P -> Q) <-> (!Q -> !P)

// Definición con descripción (para glossary futuro)
define Modus_Ponens := (P -> Q) & P -> Q
  description "Regla de inferencia: si P implica Q y P es verdadero, Q es verdadero"

// Expandir una definición manualmente
unfold Mortal(socrates)
// → exists y. (Causa(y, muerte(socrates)))

// Contraer de vuelta
fold exists y. (Causa(y, muerte(socrates)))
// → Mortal(socrates)
```

#### Semántica

| Propiedad | Descripción |
|-----------|-------------|
| **Eliminabilidad** | Toda `define` puede expandirse completamente sin pérdida de significado |
| **Conservatividad** | Agregar una definición no crea nuevos teoremas sobre el vocabulario original |
| **Transparencia** | `derive`, `prove`, `check` expanden definiciones automáticamente antes de razonar |
| **Parámetros** | Sustitución posicional: `define F(x,y) := ...` → `F(a,b)` sustituye `x→a, y→b` |
| **Dependencia** | Una definición puede usar otra: `define A := ...`, `define B := ... & A` |

#### Cambios técnicos

1. **Lexer**: tokens `DEFINE`, `UNFOLD`, `FOLD`, `DESCRIPTION` (keyword `description` post-define)
2. **AST**: `DefineNode { name, params?, body: Formula, description? }`
3. **Parser**: regla `define NAME(params?) := FORMULA (description STRING)?`
4. **Runtime**: 
   - `definitions: Map<string, { params: string[], body: Formula, desc?: string }>`
   - `expandDefinition(name, args)` → sustituye params en body
   - Hook en `derive`/`prove`/`check`: expandir todas las definiciones antes de evaluar
5. **Comandos**: `unfold EXPR` → expande un nivel, `fold EXPR` → intenta contraer
6. **Tests**: ~30 nuevos tests

#### Ejemplo completo

```st
logic classical.propositional

// Definimos conceptos
define Implicacion_Material := P -> Q
  description "Condicional material: falso solo cuando P verdadero y Q falso"

define Contrapositiva := !Q -> !P
  description "Equivalente lógico de la implicación material"

// Verificamos la equivalencia expandiendo definiciones
check valid (Implicacion_Material <-> Contrapositiva)
// Motor expande → check valid ((P -> Q) <-> (!Q -> !P)) → VÁLIDO

// Podemos inspeccionar la expansión
unfold Implicacion_Material
// → P -> Q

truth_table Implicacion_Material
// Muestra tabla de P -> Q pero con header "Implicacion_Material"
```

---

### v2.10 — Fuentes y Texto Enriquecido

**Objetivo**: Dar proveniencia a los textos y permitir formalización inline más flexible.

#### Nuevos constructos

```st
// Declarar una fuente bibliográfica
source Aristoteles {
  author "Aristóteles"
  work   "Categorías"  
  year   -350
}

source Kant {
  author "Immanuel Kant"
  work   "Crítica de la Razón Pura"
  year   1781
  edition "B"
}

// Passage con atribución de fuente
passage @Aristoteles "Se llaman sinónimas las cosas cuyo nombre es común"
passage @Kant §B16 "Los juicios sintéticos a priori son posibles"

// Formalización inline directa (sin necesidad de let intermedio)
interpret "todo hombre es mortal" as forall x. (H(x) -> M(x))
interpret "Sócrates es hombre" as H(socrates)

// Claim con fuente
claim @Aristoteles c1 = forall x. (Sustancia(x) -> !EnOtro(x))

// Multi-formalizar un passage (varias lecturas del mismo texto)
passage p = @Kant §B16 "Los juicios sintéticos a priori son posibles"
interpret p as J                        // Lectura simple
interpret p as (Sintetico & APriori)    // Lectura compuesta
```

#### Modelo de datos de `source`

```
SourceDecl {
  id: string           // identificador en el script
  author: string       
  work: string         
  year?: number        
  section?: string     // §, #, capítulo
  edition?: string     
  url?: string         // recurso digital opcional
}
```

#### Cambios técnicos

1. **Lexer**: tokens `SOURCE`, `INTERPRET`, `@` (anotación de fuente), `§` (sección)
2. **AST**: `SourceDeclNode`, `InterpretNode`, anotación `sourceRef?` en `PassageNode`/`ClaimNode`
3. **Parser**: bloques `source`, `interpret X as FORMULA`, `@ID` como prefijo
4. **Runtime**: 
   - `sources: Map<string, SourceDecl>`
   - Al emitir resultados de `claim`/`passage`, incluir metadata de fuente
   - `interpret` = azúcar sintáctico para `let + formalize`
5. **Tests**: ~20 nuevos tests

#### Ejemplo completo

```st
logic classical.propositional

source Mill {
  author "John Stuart Mill"
  work   "Sobre la libertad"
  year   1859
}

passage @Mill §1 "La única libertad que merece ese nombre es la de buscar nuestro propio bien a nuestra propia manera"

interpret "buscar el propio bien" as B
interpret "libertad genuina" as L

define Principio_Mill := B <-> L
  description "La libertad genuina es equivalente a buscar el propio bien"

// Formalizar y verificar
axiom p1 = B -> L
axiom p2 = L -> B
check valid (p1 & p2 <-> Principio_Mill)

// El motor expande Principio_Mill → B <-> L → verifica
```

---

### v3.0 — Documentación, Namespaces y Ecosistema

**Objetivo**: Cerrar el ciclo — que un archivo `.st` pueda generar documentación legible, que las teorías sean verdaderos módulos, y que el editor ayude.

#### 3.0.1 — Glossary (auto-documentación)

```st
// Genera un glosario con todas las definiciones del scope
glossary
// Salida:
//   GLOSARIO
//   ─────────
//   Mortal(x)         — exists y. (Causa(y, muerte(x)))
//                       "Todo ser cuya muerte tiene una causa"
//   Justo(x)          — forall a. (Accion(x, a) -> Buena(a))
//                       "Agente cuyas acciones son todas buenas"
//   Principio_Mill    — B <-> L
//                       "La libertad genuina es equivalente a buscar el propio bien"

// Exportar en formato
render glossary as markdown   // → texto Markdown
render glossary as latex      // → LaTeX con \newcommand
render glossary as json       // → JSON estructurado
```

#### 3.0.2 — Theory como Namespace Real

```st
theory Epistemologia {
  source Gettier {
    author "Edmund Gettier"
    work   "Is Justified True Belief Knowledge?"
    year   1963
  }

  define Conocimiento(s, p) := Cree(s, p) & Justificado(s, p) & Verdadero(p)
    description "Definición tripartita clásica (JTB)"

  define Gettier_Case(s, p) := Cree(s, p) & Justificado(s, p) & Verdadero(p) & Accidental(p)
    description "Caso Gettier: JTB + verdad accidental"

  axiom jtb : Conocimiento(s, p) -> (Cree(s, p) & Verdadero(p))
}

// Import selectivo
from Epistemologia import { Conocimiento, jtb }

// Uso con namespace completo
check valid Epistemologia.jtb
```

#### 3.0.3 — Exportación Estructurada

```st
// Exportar el análisis completo como documento
render analysis as markdown
// Genera:
//   # Análisis: [nombre del archivo]
//   ## Fuentes
//   - Kant (1781) Crítica de la Razón Pura
//   - Mill (1859) Sobre la libertad
//   ## Definiciones  
//   ... (glossary)
//   ## Proposiciones
//   - axiom kant1: I → J ✓
//   - theorem t1: G (derivado de kant1, kant2, kant3)
//   ## Verificaciones
//   - ((I → J) ∧ (J → G) ∧ I) → G : VÁLIDO
```

#### 3.0.4 — VS Code Integration

| Feature | Descripción |
|---------|-------------|
| **Select → Define** | Seleccionar texto en el editor → Quick Action → genera `define` con nombre sugerido |
| **Hover on define** | Muestra expansión + descripción |
| **Goto definition** | Click en uso de definición → ir a `define` |
| **Glossary panel** | Panel lateral con todas las definiciones del archivo |
| **Source references** | Decoradores con info de `source` |
| **Auto-unfold** | Tooltip mostrando fórmula expandida al hover |

#### Cambios técnicos v3.0

1. **Lexer**: `GLOSSARY`, `FROM`, `AS` (para render/export), `ANALYSIS`
2. **AST**: `GlossaryNode`, `ImportSelectiveNode { theory, members[] }`, `RenderNode { target, format }`
3. **Runtime**: 
   - `renderGlossary(format)` → Markdown/LaTeX/JSON
   - `renderAnalysis(format)` → documento completo
   - `resolveSelectiveImport(theory, members)`
4. **VS Code extension**: Commands + hover + decorators (usar Language Server Protocol)
5. **Tests**: ~40 nuevos tests

---

## Resumen de constructos nuevos

| Release | Keyword | Sintaxis | Propósito |
|---------|---------|----------|-----------|
| v2.9 | `define` | `define N(p?) := F (description S)?` | Definición formal eliminable |
| v2.9 | `unfold` | `unfold EXPR` | Expandir definición un nivel |
| v2.9 | `fold` | `fold EXPR` | Contraer hacia definición |
| v2.10 | `source` | `source ID { author S, work S, ... }` | Fuente bibliográfica |
| v2.10 | `interpret` | `interpret S as FORMULA` | Formalización inline |
| v2.10 | `@` | `@SOURCE` | Anotación de fuente |
| v3.0 | `glossary` | `glossary` | Auto-listar definiciones |
| v3.0 | `from..import` | `from T import { a, b }` | Import selectivo |
| v3.0 | `render..as` | `render X as FORMAT` | Exportación formateada |

**Total**: 9 constructos nuevos en 3 releases. Cada uno es una línea o un bloque corto. Ninguno introduce complejidad de lenguaje de programación.

---

## Lo que NO entra (y por qué)

| Descartado | Razón |
|------------|-------|
| Sistema de tipos completo | ST es un lenguaje de lógica, no de programación. Los "tipos" son sorts de primer orden, no ADTs. |
| Clases / OOP | Las teorías ya cumplen el rol de módulos con herencia. No necesitamos más. |
| Persistencia / base de datos | Responsabilidad del editor (VS Code) o del host (EducacionCooperativa). ST es stateless. |
| Formato BibTeX / CSL completo | Demasiada complejidad para poco retorno. `source` es suficiente para atribución. |
| Macros / metaprogramación | Peligro de complejidad accidental. `define` con params cubre el 90% de los casos. |
| Evaluación lazy / streams | Paradigma funcional innecesario para un DSL declarativo. |
| REPL interactivo | Mejor como feature del editor, no del lenguaje. |

---

## Criterios de completitud por release

### v2.9 ✅ COMPLETADO:
- [x] `define` con y sin parámetros funciona
- [x] `define` con `description` funciona
- [x] `unfold` / `fold` producen resultado correcto
- [x] `derive`/`prove`/`check` expanden definiciones automáticamente
- [x] Definiciones circulares detectadas y rechazadas
- [x] Dependencias entre definiciones resueltas en orden
- [x] ≥30 tests nuevos, todos pasando
- [x] 0 errores lint, 0 errores tsc

### v2.10 ✅ COMPLETADO:
- [x] `source` parsea y almacena metadata
- [x] `@source` anota passages y claims
- [x] `interpret` crea formalización inline
- [x] Multi-interpret sobre un mismo passage funciona
- [x] Fuentes aparecen en output de `render`/`explain`
- [x] ≥20 tests nuevos, todos pasando
- [x] Ejemplo `.st` completo con workflow fuentes → interpret → define → verify

### v3.0 ✅ COMPLETADO:
- [x] `glossary` genera listado correcto de todas las definiciones
- [x] `render glossary as markdown/latex/json` produce output válido
- [ ] `from T import { x }` funciona con theories *(diferido — ya existe `import` estándar)*
- [x] `render analysis as markdown` genera documento completo
- [ ] VS Code: hover en `define` muestra expansión *(diferido — requiere extensión separada)*
- [ ] VS Code: "select → define" quick action funciona *(diferido — requiere extensión separada)*
- [x] ≥40 tests nuevos, todos pasando (63 tests v3)
- [x] Ejemplo `.st` de análisis filosófico completo (`examples/v3-showcase.st`)

---

## Ejemplo final: cómo se ve un archivo ST v3.0

```st
logic classical.first-order

// ═══════════════════════════════════════════════════
// FUENTES
// ═══════════════════════════════════════════════════

source Aristoteles {
  author "Aristóteles"
  work   "Ética Nicomáquea"
  year   -340
}

source Kant {
  author "Immanuel Kant"
  work   "Fundamentación de la Metafísica de las Costumbres"
  year   1785
}

// ═══════════════════════════════════════════════════
// DEFINICIONES
// ═══════════════════════════════════════════════════

define Virtuoso(x) := forall a. (Accion(x, a) -> Medio(a, extremos))
  description "Agente que actúa siempre en el justo medio (Aristóteles)"

define Deber(x, a) := Universalizable(maxima(x, a))
  description "Una acción es deber si su máxima es universalizable (Kant)"

define Bueno(x) := Virtuoso(x) & forall a. (Accion(x, a) -> Deber(x, a))
  description "Agente que es virtuoso Y actúa por deber — síntesis aristotélico-kantiana"

// ═══════════════════════════════════════════════════
// TEXTOS Y FORMALIZACIÓN
// ═══════════════════════════════════════════════════

passage @Aristoteles §1107a "La virtud es un hábito selectivo que consiste en un término medio"
interpret "virtud como término medio" as forall x. (Virtuoso(x) -> Medio_Habitual(x))

passage @Kant §4:421 "Obra solo según aquella máxima que puedas querer que se convierta en ley universal"
interpret "imperativo categórico" as forall x, a. (Deber(x, a) <-> Universalizable(maxima(x, a)))

// ═══════════════════════════════════════════════════
// RAZONAMIENTO
// ═══════════════════════════════════════════════════

axiom a1 : forall x. (Virtuoso(x) -> Medio_Habitual(x))
axiom a2 : Virtuoso(socrates)

derive Medio_Habitual(socrates) from {a1, a2}

theory Etica_Comparada {
  define Conflicto(x, a) := Virtuoso(x) & !Deber(x, a)
    description "Caso donde virtud aristotélica y deber kantiano divergen"
  
  axiom caso : Virtuoso(aquiles) & !Universalizable(maxima(aquiles, venganza))
  
  // Aquiles es virtuoso pero la venganza no es universalizable
  // → Conflicto entre frameworks éticos
}

// ═══════════════════════════════════════════════════
// DOCUMENTACIÓN
// ═══════════════════════════════════════════════════

glossary
render analysis as markdown
```

---

*Documento generado para ST v2.8.0 → v3.0 roadmap. Implementación completada: 2025-05-18. Versión: 3.0.0.*
