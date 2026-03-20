# ST v3.0 — Nuevas funciones

## Resumen

ST v3.0 introduce 9 constructos nuevos organizados en tres capas:

| Keyword | Alias (ES) | Sintaxis | Propósito |
|---------|-----------|----------|-----------|
| `define` | `definir` | `define N(p?) := F` | Definición formal eliminable |
| `description` | `descripcion` | `description "texto"` | Descripción de una definición |
| `unfold` | `desplegar` | `unfold EXPR` | Expandir definición un nivel |
| `fold` | `plegar` | `fold EXPR` | Contraer fórmula hacia definición |
| `source` | `fuente` | `source ID { ... }` | Fuente bibliográfica |
| `interpret` | `interpretar` | `interpret S as FORMULA` | Formalización inline |
| `@` | — | `@SOURCE` | Anotación de fuente |
| `glossary` | `glosario` | `glossary` | Auto-listar definiciones + fuentes |
| `render..as` | — | `render X as FORMAT` | Exportación formateada |

---

## 1. `define` — Definiciones Formales

Crea una definición eliminable con parámetros opcionales. El motor expande automáticamente las definiciones durante `derive`, `prove`, `check`, `truth_table`, etc.

### Sin parámetros

```st
define LEM := P | !P
define Contrapositiva := (!Q -> !P)
```

### Con parámetros

```st
define Implies(x, y) := x -> y
define Iff(a, b) := (a -> b) & (b -> a)
```

### Con descripción

```st
define Modus_Ponens := (P -> Q) & P -> Q
description "Regla de inferencia clásica"
```

### Uso con `:=` o `=`

```st
define D := P -> Q   // preferido
define D = P -> Q     // también válido
```

### Expansión automática

Las definiciones se expanden transparentemente en cualquier contexto de razonamiento:

```st
logic classical.propositional

define Taut := P -> P
check valid Taut              // expande a: check valid (P -> P) → VÁLIDO

define Impl(x, y) := x -> y
check valid Impl(P, P)       // expande a: check valid (P -> P) → VÁLIDO

define IMP := P -> Q
axiom A1 : IMP               // A1 almacena P -> Q (expandido)
axiom A2 : P
derive Q from {A1, A2}       // PROVABLE ✓
```

### Cadenas de dependencia

```st
define A := P -> Q
define B := A & R             // B usa A → expande a (P -> Q) & R
```

### Detección de circularidad

```st
define Loop := Loop           // ERROR: definición circular
define X := Y
define Y := X                 // ERROR: circularidad indirecta
```

---

## 2. `unfold` / `fold` — Expansión y Contracción Manual

### `unfold`

Muestra la fórmula subyacente de una definición:

```st
define D := P & Q
unfold D
// Unfold: (P ∧ Q) → (P ∧ Q)
```

### `fold`

Identifica si una fórmula corresponde a alguna definición registrada:

```st
define D := P -> Q
fold (P -> Q)
// Fold: (P → Q) → D
```

---

## 3. `source` — Fuentes Bibliográficas

Declara una fuente con campos opcionales:

```st
source Aristotle {
  author "Aristóteles"
  work "Organon"
  year 350
  section "Analytica Priora"
  edition "Oxford"
  url "https://example.com"
}
```

**Campos disponibles**: `author`, `work`, `year`, `section`, `edition`, `url`.

Los años negativos se soportan: `year -350`.

---

## 4. `interpret` — Formalización Inline

Vincula un texto natural con una fórmula lógica:

```st
// Con string literal
interpret "todo hombre es mortal" as P -> Q

// Con identificador (referencia a passage)
interpret Premise1 as P -> Q
```

`interpret` crea automáticamente un **let binding** con el nombre derivado del texto (espacios → `_`, caracteres especiales eliminados), permitiendo usar la interpretación en razonamientos posteriores.

---

## 5. `glossary` — Glosario Automático

Emite un listado formateado de:
- Todas las definiciones (con descripción si existe)
- Todas las fuentes registradas
- Todas las interpretaciones

```st
glossary
```

Salida:
```
══════════════════════════════════════
  GLOSARIO
══════════════════════════════════════
  D  :=  (P → Q)
      "Implicación material"

── Fuentes ──
  Aristotle: Aristóteles (350) — Organon

── Interpretaciones ──
  "todo hombre es mortal" → (P → Q)
══════════════════════════════════════
```

---

## 6. `render glossary as FORMAT`

Exporta las definiciones en formato específico:

| Formato | Ejemplo de salida |
|---------|-------------------|
| `markdown` | `- **D(x, y)** := (x → y)\n  > Descripción` |
| `json` | `{"D": {"params": [], "body": "...", "description": "..."}}` |
| `latex` | `\newcommand{\D}{...} % Descripción` |

```st
render glossary as markdown
render glossary as json
render glossary as latex
```

---

## 7. `render analysis as FORMAT`

Genera un documento estructurado completo con secciones:

1. **Fuentes** — todas las `source` declaradas
2. **Definiciones** — glossary embebido
3. **Axiomas** — todos los axiomas de la teoría
4. **Teoremas** — todos los teoremas
5. **Claims** — claims con su metadata
6. **Verificaciones** — resumen de resultados

```st
render analysis as markdown
```

---

## 8. Aliases en Español

Todos los constructos tienen alias en español:

| Inglés | Español |
|--------|---------|
| `define` | `definir` |
| `unfold` | `desplegar` |
| `fold` | `plegar` |
| `source` | `fuente` |
| `interpret` | `interpretar` |
| `glossary` | `glosario` |
| `description` | `descripcion` |

---

## 9. Compatibilidad con Perfiles Lógicos

Las funciones v3 funcionan con **todos los 11 perfiles**:

- `classical.propositional` — proposicional clásica
- `classical.first_order` — primer orden clásica
- `modal.k` — lógica modal K
- `paraconsistent.belnap` — Belnap 4 valores
- `deontic.standard` — lógica deóntica
- `epistemic.s5` — lógica epistémica S5
- `aristotelian.syllogistic` — silogística aristotélica
- `intuitionistic.propositional` — intuicionista
- `temporal.ltl` — lógica temporal LTL
- `probabilistic.basic` — lógica probabilística
- `arithmetic` — aritmética

Las definiciones se expanden **antes** de pasar al motor del perfil, así que cualquier definición trabaja transparentemente con el sistema de evaluación de cada perfil.

---

## Ejemplo Completo

```st
logic classical.propositional

source Aristotle {
  author "Aristóteles"
  work "Organon"
  year 350
}

define Mortal := P -> Q
description "Todo hombre es mortal"

define Implies(x, y) := x -> y

axiom A1 : Mortal
axiom A2 : P
derive Q from {A1, A2}

check valid Implies(P, P)
check valid (P -> Q) & (Q -> R) -> (P -> R)

interpret "todo hombre es mortal" as P -> Q
interpret "Sócrates es hombre" as P

unfold Mortal
fold (P -> Q)

glossary
render glossary as markdown
render analysis as markdown
```
