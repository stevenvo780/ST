# Plan de Mejora de Salidas — ST Language (v2 completa)

> **Objetivo**: Enriquecer la salida de cada comando ST para que sea pedagógicamente completa,
> cubriendo **todo lo que un curso universitario de lógica** esperaría ver en cada sistema.
> Identificación de reglas, patrones, clasificaciones, formas normales, modelos, comparaciones
> entre sistemas, paradojas, y contexto educativo.

---

## Tabla resumen: Estado actual — Auditoría completa

| Sistema | Reglas | Prueba | Clasif. fórmula | Modelo | explain() | Formas normales | Comparación cruzada | Paradojas/Límites | Nota |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **classical.propositional** | ✅ 14 | ✅ traceBack | ❌ | ✅ valuación | ⚠️ básico | ❌ | ❌ | ❌ | Mejor perfil |
| **classical.first_order** | ❌ | ❌ | ❌ | ❌ | ❌ stub | ❌ | ❌ | ❌ | Más urgente |
| **modal.k** | ❌ | ❌ | ❌ | ❌ | ⚠️ axiomas | N/A | ❌ | ❌ | Wrapper |
| **deontic.standard** | ❌ | ❌ | ❌ | ❌ | ⚠️ axiomas | N/A | ❌ | ❌ | Wrapper |
| **epistemic.s5** | ❌ | ❌ | ❌ | ❌ | ⚠️ axiomas | N/A | ❌ | ❌ | Wrapper |
| **temporal.ltl** | ❌ | ❌ | ❌ | ❌ | ⚠️ axiomas | N/A | ❌ | ❌ | Wrapper |
| **paraconsistent.belnap** | ❌ | ❌ | ❌ | ⚠️ tabla 4-val | ❌ 1 línea | ❌ | ❌ | ❌ | Semántica OK |
| **probabilistic.basic** | ❌ | ❌ | ❌ | ❌ | ⚠️ parcial | N/A | ❌ | ❌ | Motor OK |
| **arithmetic** | ❌ | ❌ | ❌ | ❌ | ❌ mínimo | N/A | ❌ | ❌ | Solo evalúa |
| **intuitionistic.prop** | ❌ | ❌ | ❌ | ✅ Kripke | ⚠️ bueno | ❌ | ❌ | ❌ | Buen motor |
| **aristotelian.syllogistic** | ✅ nombre | ❌ | ✅ A/E/I/O | ❌ | ⚠️ bueno | N/A | ❌ | ❌ | Ya identifica |

---

## FASE 1 — Classical Propositional (🔴 Sprint 1)

### 1.1 Resumen de razonamiento en `derive`/`prove`

**Reglas ya implementadas** (14):
MP, MT, Silogismo Hipotético, Silogismo Disyuntivo, Intro/Elim Conjunción,
Intro Disyunción, Doble Negación Elim/Intro, Contrapositiva, Intro/Elim
Bicondicional, Intro Implicación, Explosión.

**Reglas que FALTAN en el motor de derivación**:

| # | Regla faltante | Esquema | Importancia |
|---|---|---|---|
| 15 | **Dilema Constructivo** | (P→Q) ∧ (R→S), P∨R ⊢ Q∨S | 🔴 Alta — argumento clásico |
| 16 | **Dilema Destructivo** | (P→Q) ∧ (R→S), ¬Q∨¬S ⊢ ¬P∨¬R | 🔴 Alta |
| 17 | **Absorción** | P→Q ⊢ P→(P∧Q) | 🟡 Media |
| 18 | **Exportación** | (P∧Q)→R ⊢ P→(Q→R) | 🟡 Media |
| 19 | **Importación** | P→(Q→R) ⊢ (P∧Q)→R | 🟡 Media |
| 20 | **Reducción al absurdo** | Si asumimos P y derivamos ⊥ ⊢ ¬P | 🔴 Alta — método de prueba fundamental |
| 21 | **Prueba condicional** | Si asumimos P y derivamos Q ⊢ P→Q | 🔴 Alta |
| 22 | **Resolución** | P∨Q, ¬P∨R ⊢ Q∨R | 🟡 Media — base de SAT solvers |
| 23 | **De Morgan (como regla)** | ¬(P∧Q) ⊢ ¬P∨¬Q y viceversa | 🟡 Media |
| 24 | **Dilema simple** | P∨Q, P→R, Q→R ⊢ R | 🟡 Media |

**Salida deseada**:
```
✓ [derive] Q derivado exitosamente
  Tipo de razonamiento: Modus Ponens (MP)
  Esquema: φ → ψ, φ ⊢ ψ
  Instanciación: (P → Q), P ⊢ Q
  Validez: Deductivamente válido — si las premisas son V, la conclusión es necesariamente V
  Prueba:
    1. (P → Q)  — Premisa (a1)    [Condicional: antecedente=P, consecuente=Q]
    2. P         — Premisa (a2)    [Átomo proposicional]
    3. Q         — Modus Ponens [de 1, 2]
```

### 1.2 Clasificación de fórmulas conocidas (módulo nuevo)

**Catálogo completo de leyes/equivalencias a reconocer**:

#### Leyes fundamentales (tautologías)
| Patrón | Nombre | Abreviatura | Fuente |
|---|---|---|---|
| P → P | Identidad / Reflexividad | Id | Hilbert |
| P ∨ ¬P | Tercero excluido | LEM | Aristóteles |
| ¬(P ∧ ¬P) | No-contradicción | LNC | Aristóteles |
| P → (Q → P) | Verum ex quodlibet / Axioma K | VEQ | Hilbert |
| (P→(Q→R))→((P→Q)→(P→R)) | Distribución / Axioma S | Dist | Hilbert |
| (P→Q)→(¬Q→¬P) | Contrapositiva | Contra | — |
| (¬P→¬Q)→(Q→P) | Contrapositiva inversa | ContraInv | — |
| ¬¬P → P | Doble negación eliminación | DNE | — |
| P → ¬¬P | Doble negación introducción | DNI | — |
| ((P→Q)→P)→P | Ley de Peirce | Peirce | — |
| ¬P → (P → Q) | Ex falso quodlibet | EFQ | — |
| (P→Q)∧(Q→R)→(P→R) | Transitividad del condicional | Trans | — |
| (P∨Q)→(Q∨P) | Conmutatividad ∨ | Comm∨ | — |
| (P∧Q)→(Q∧P) | Conmutatividad ∧ | Comm∧ | — |

#### Equivalencias (bicondicionales válidos)
| Patrón | Nombre |
|---|---|
| ¬(P∧Q) ↔ (¬P∨¬Q) | De Morgan 1 |
| ¬(P∨Q) ↔ (¬P∧¬Q) | De Morgan 2 |
| P∧(Q∨R) ↔ (P∧Q)∨(P∧R) | Distributividad ∧/∨ |
| P∨(Q∧R) ↔ (P∨Q)∧(P∨R) | Distributividad ∨/∧ |
| P→Q ↔ ¬P∨Q | Definición material del condicional |
| P↔Q ↔ (P→Q)∧(Q→P) | Definición del bicondicional |
| P∧(P∨Q) ↔ P | Absorción ∧ |
| P∨(P∧Q) ↔ P | Absorción ∨ |
| P∧P ↔ P | Idempotencia ∧ |
| P∨P ↔ P | Idempotencia ∨ |
| (P∧Q)→R ↔ P→(Q→R) | Exportación/Importación |
| P↔Q ↔ Q↔P | Simetría del bicondicional |
| ¬¬P ↔ P | Doble negación |
| P∧⊤ ↔ P | Identidad ∧ |
| P∨⊥ ↔ P | Identidad ∨ |
| P∧⊥ ↔ ⊥ | Dominancia ∧ |
| P∨⊤ ↔ ⊤ | Dominancia ∨ |

### 1.3 Formas normales: NNF, CNF, DNF

**Estado actual**: Solo existe `toNNF()`.

**Agregar**:
- `toCNF(formula)` — Forma Normal Conjuntiva → conjunción de cláusulas
- `toDNF(formula)` — Forma Normal Disyuntiva → disyunción de conjunciones
- `extractClauses(formula)` — Para análisis de resolución
- Mostrar en `explain()` y opcionalmente en `check valid`

```
Formas normales:
  NNF: (¬P ∨ Q)
  CNF: (¬P ∨ Q)                    [1 cláusula]
  DNF: (¬P) ∨ (P ∧ Q)             [2 términos]
  Cláusulas: {¬P, Q}
```

### 1.4 Análisis de estructura de fórmula en `explain`

```
explain ((P -> Q) -> (!Q -> !P))

Fórmula: (P → Q) → (¬Q → ¬P)
Conectivo principal: → (condicional)
Profundidad: 3
Complejidad: 5 conectivos

Sub-fórmulas (árbol):
  ├─ Antecedente: (P → Q)
  │   ├─ P [átomo]
  │   └─ Q [átomo]
  └─ Consecuente: (¬Q → ¬P)
      ├─ ¬Q [negación]
      └─ ¬P [negación]

Variables proposicionales: {P, Q}
Conectivos usados: {→, ¬}
Completitud funcional: No (faltan ∧ o ∨ para completitud con ¬)

Formas normales:
  NNF: (P ∧ ¬Q) ∨ (¬P ∨ Q) ∧ ...
  CNF: ...
  DNF: ...

Clasificación semántica: Tautología
Nombre conocido: Ley de la Contrapositiva (Modus Tollendo Tollens)

Tabla de verdad:
  4 valuaciones, 4 verdaderas, 0 falsas
  → Tautología ✓
```

### 1.5 Consecuencia semántica (⊨) vs sintáctica (⊢)

Actualmente `derive` solo reporta el resultado. Agregar:
```
  Consecuencia semántica (⊨): Verificada — no existe valuación donde las premisas
    sean V y la conclusión F
  Consecuencia sintáctica (⊢): Derivación formal completada en 3 pasos
  Nota: Por completitud de la lógica proposicional clásica, ⊨ y ⊢ coinciden.
```

### 1.6 Mejora de tabla de verdad

- **Columnas intermedias** para sub-fórmulas
- **Conteo**: n verdaderas / m falsas
- **Proporción**: útil para ver "casi-tautologías"
- **Filas marcadas**: contramodelo señalado con ←

### 1.7 Falacias adicionales

**Existentes**: 5 (afirmación consecuente, negación antecedente, medio no distribuido, composición, falso dilema)

**Agregar**:
| Falacia | Patrón | Prioridad |
|---|---|---|
| Petición de principio | conclusión ∈ premisas | 🔴 |
| Conversión ilícita | Todo S es P ⊬ Todo P es S | 🔴 |
| Generalización apresurada | Algún S es P ⊬ Todo S es P | 🟡 |
| Cuaterno terminorum | 4 términos distintos en silogismo | 🟡 |
| Anfibología | estructura ambigua (if detectable) | 🟢 |
| Falacia del consecuente | (P→Q)∧Q ⊬ P (ya está, asegurar nombre correcto) | ✅ |
| División | Todo tiene P ⊬ Parte tiene P | 🟡 |

---

## FASE 2 — Classical First-Order (🔴 Sprint 2 — es prácticamente stub)

### 2.1 `explain()` — actualmente retorna `"FOL"`

**Salida deseada completa**:
```
explain forall x (P(x) -> Q(x))

Fórmula: ∀x(P(x) → Q(x))

Análisis sintáctico:
  Tipo de sentencia: Universal afirmativa
  Cuantificadores: ∀x (universal)
  Alcance de ∀x: P(x) → Q(x)
  Predicados: P/1 (aridad 1), Q/1 (aridad 1)
  Variables: x
  Variables libres: ninguna (sentencia cerrada)
  Variables ligadas: x (por ∀)

Forma prenex: ∀x(P(x) → Q(x))  [ya está en forma prenex]
Forma Skolem: P(x) → Q(x)       [sin ∃, nada que skolemizar]

Equivalencias notables:
  ∀x(P(x) → Q(x)) ≡ ∀x(¬P(x) ∨ Q(x))   [def. condicional]
  ¬∀x(P(x) → Q(x)) ≡ ∃x(P(x) ∧ ¬Q(x))  [negación cuantificada]

Interpretación natural: "Para todo x, si x es P entonces x es Q"
Lectura categórica: "Todo P es Q" (proposición tipo A)

Resultado: [según chequeo de validez]
```

### 2.2 `derive()` — actualmente retorna `"Derivacion"`

Agregar pasos del tableau con **reglas de cuantificadores nombradas**:

| Regla | Nombre | Esquema |
|---|---|---|
| UI | Instanciación Universal | ∀xφ(x) ⊢ φ(a) |
| EG | Generalización Existencial | φ(a) ⊢ ∃xφ(x) |
| UG | Generalización Universal | φ(a) [a arbitrario] ⊢ ∀xφ(x) |
| EI | Instanciación Existencial | ∃xφ(x) ⊢ φ(c) [c nueva] |

```
✓ [derive] exists x (Q(x)) derivado
  Prueba:
    1. ∀x(P(x) → Q(x))  — Premisa (a1)
    2. P(a)               — Premisa (a2)
    3. P(a) → Q(a)        — Instanciación Universal (UI) [de 1, x←a]
    4. Q(a)               — Modus Ponens [de 3, 2]
    5. ∃x(Q(x))           — Generalización Existencial (EG) [de 4]
```

### 2.3 Contramodelo de primer orden

**Estado actual**: `countermodel()` reusa `checkValid()` sin modelo.

```
Contramodelo:
  Dominio D = {a, b}
  Interpretación:
    P = {a}       — P(a) = V, P(b) = F
    Q = {}        — Q(a) = F, Q(b) = F
  Verificación:
    ∀x(P(x) → Q(x)): x=a → P(a)=V, Q(a)=F → F  ✗
  → La fórmula no es válida
```

### 2.4 Análisis de variables y cuantificadores

```
Análisis de cuantificadores:
  Alcance de ∀x: [P(x) → Q(x)]
  Alternancia de cuantificadores: 0 (no hay ∀∃ ni ∃∀)
  Profundidad de cuantificadores: 1
  Predicados: {P/1, Q/1}
  Universo de Herbrand: {a, b, ...}
```

### 2.5 Forma prenex y Skolemización

Para fórmulas complejas con cuantificadores mixtos:
```
Fórmula: ∀x(∃y(P(x,y)) → Q(x))
Forma prenex: ∀x∀y(P(x,y) → Q(x))   [moviendo ∃ a forma prenex negada]
Forma Skolem: ∀x(P(x, f(x)) → Q(x))  [reemplazando ∃y por función de Skolem f(x)]
Cláusulas: {¬P(x, f(x)), Q(x)}
```

---

## FASE 3 — Perfiles Modales: K, Deóntica, Epistémica, Temporal (🔴 Sprint 2-3)

### 3.1 Traza del Tableau (compartido vía `BaseTableauProfile`)

**Estado actual**: Solo dice "VÁLIDA" o "NO válida" — cero detalle.

**Salida deseada con traza completa**:
```
✓ [check valid] □(P → Q) → (□P → □Q) es VÁLIDA en modal.k
  Método: Refutación por Tableau (todas las ramas cerradas)
  Identificación: Axioma K (distribución de □ sobre →)
  Traza del tableau:
    1. w₀: ¬(□(P→Q) → (□P→□Q))     — Hipótesis de refutación
    2. w₀: □(P→Q)                    — α (de 1: ¬(A→B) ⊢ A)
    3. w₀: ¬(□P→□Q)                  — α (de 1: ¬(A→B) ⊢ ¬B)
    4. w₀: □P                        — α (de 3)
    5. w₀: ◇¬Q                       — α (de 3: ¬□Q ⊢ ◇¬Q)
    6. w₀Rw₁                         — δ (de 5: testigo para ◇)
    7. w₁: ¬Q                        — δ (de 5)
    8. w₁: P→Q                       — γ (de 2: □φ con w₀Rw₁)
    9. w₁: P                         — γ (de 4: □φ con w₀Rw₁)
   10. w₁: Q                         — α (de 8, 9: MP)
   ✗ Contradicción: Q (10) y ¬Q (7) en w₁
  → Todas las ramas cerradas ∴ Válida
```

### 3.2 Contramodelo Kripke con mundos posibles

```
✗ [check valid] □P → P  NO es válida en modal.k
  Contramodelo Kripke:
    Frame:
      Mundos: {w₀, w₁}
      Accesibilidad: w₀ R w₁
      Propiedades del frame: ninguna (K puro)
    Valuación:
      V(w₀) = {}        — P falso en w₀
      V(w₁) = {P}       — P verdadero en w₁
    Verificación:
      □P en w₀: ¿P vale en todo mundo accesible desde w₀?
        w₁ es accesible, P ∈ V(w₁) ✓ → □P = V en w₀
      P en w₀: P ∉ V(w₀) → P = F en w₀
    → □P = V pero P = F en w₀ → □P → P = F ✗
  Observación: □P → P (Axioma T) requiere reflexividad.
    En K no hay reflexividad → el axioma T no vale.
    Vale en: T, S4, S5, epistemic.s5, temporal.ltl
```

### 3.3 Catálogo de axiomas/teoremas por sistema

| Esquema | Nombre | K | KD | T | S4 | S5 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| □(φ→ψ)→(□φ→□ψ) | K (distribución) | ✓ | ✓ | ✓ | ✓ | ✓ |
| □φ→φ | T (reflexividad) | ✗ | ✗ | ✓ | ✓ | ✓ |
| □φ→□□φ | 4 (transitividad) | ✗ | ✗ | ✗ | ✓ | ✓ |
| φ→□◇φ | B (simetría) | ✗ | ✗ | ✗ | ✗ | ✓ |
| □φ→◇φ | D (serialidad) | ✗ | ✓ | ✓ | ✓ | ✓ |
| ◇φ↔¬□¬φ | Dualidad | ✓ | ✓ | ✓ | ✓ | ✓ |
| □φ→φ→□φ | 5 (euclidiana) | ✗ | ✗ | ✗ | ✗ | ✓ |

Cuando `check valid` devuelve válido, identificar en la salida si es una instancia de uno de estos esquemas.

### 3.4 Propiedades del frame

En `explain()` y `check valid`, reportar qué propiedades del frame aplican:

```
Sistema: modal.k
  Relación de accesibilidad: sin restricciones
  Propiedades: ∅
  No vale: reflexividad, transitividad, simetría, serialidad, euclidiana

Sistema: deontic.standard (KD)
  Relación de accesibilidad: serial
  Propiedades: {serialidad}
  Significado: todo estado deóntico tiene al menos una alternativa permisible

Sistema: epistemic.s5
  Relación de accesibilidad: equivalencia (reflexiva + simétrica + transitiva)
  Propiedades: {reflexividad, simetría, transitividad}
  Significado: lo que sabes, sabes que lo sabes (introspección completa)
```

### 3.5 Modalidades iteradas (simplificación en S5)

En S5, las modalidades iteradas colapsan. Reportar:
```
Simplificación en S5:
  □□P ≡ □P    (colapsamiento por 4)
  ◇◇P ≡ ◇P   (colapsamiento dual)
  □◇P ≡ ◇P   (colapsamiento por 5+B)
  ◇□P ≡ □P   (colapsamiento dual)
```

### 3.6 Específico DEÓNTICA — Paradojas deónticas

Detectar y advertir cuando el usuario trabaja con fórmulas que involucran paradojas conocidas:

| Paradoja | Fórmula | Advertencia |
|---|---|---|
| **Paradoja de Ross** | O(P) → O(P∨Q) | "La lógica deóntica estándar valida esto, pero es contraintuitivo: si debes enviar la carta, ¿debes enviarla o quemarla?" |
| **Paradoja de Chisholm** | O(P), O(P→Q), ¬P→O(¬Q), ¬P | "Conjunto inconsistente en KD estándar — problema de contrary-to-duty obligations" |
| **Dilema del buen samaritano** | O(¬P) → O(¬P∧Q) | "Obligaciones derivadas de eventos que no deberían ocurrir" |

### 3.7 Específico EPISTÉMICA — Paradojas epistémicas

| Paradoja | Fórmula | Advertencia |
|---|---|---|
| **Paradoja de Moore** | P ∧ ¬K(P) | "Satisfacible pero no asertable: 'llueve pero no sé que llueve'" |
| **Omnisciencia lógica** | K(P→Q) ∧ K(P) → K(Q) | "Siempre válida en S5 — los agentes son lógicamente omniscientes (limitación del modelo)" |
| **Problema de la introspección** | ¬K(P) → K(¬K(P)) | "Axioma 5 — introspección negativa: si no sabes algo, sabes que no lo sabes" |

### 3.8 Específico TEMPORAL — Patrones de propiedades

Clasificar fórmulas LTL en patrones estándar de verificación:

| Patrón | Fórmula | Significado |
|---|---|---|
| **Safety** | G(¬P) | "P nunca ocurre" |
| **Liveness** | F(P) | "P eventualmente ocurre" |
| **Respuesta** | G(P → F(Q)) | "Cada P es seguido por Q" |
| **Persistencia** | F(G(P)) | "P eventualmente se vuelve permanente" |
| **Recurrencia** | G(F(P)) | "P ocurre infinitamente a menudo" |
| **Precedencia** | ¬P U Q | "Q llega antes que P" |
| **Ausencia** | G(¬P) | "P nunca ocurre" |

```
✓ [check valid] G(P → F(Q)) → ...
  Patrón temporal: Respuesta (Response)
  Significado: "Toda solicitud P eventualmente recibe respuesta Q"
  Categoría: Propiedad de Liveness
```

---

## FASE 4 — Paraconsistente Belnap (🟡 Sprint 3)

### 4.1 `explain()` completo — actualmente 1 línea

```
explain (P & !P)

Fórmula: (P ∧ ¬P)
Sistema: Belnap 4-valores (A4)

Retículo de verdad:
       T
      / \
     B   N
      \ /
       F

Valores designados: {T, B} (portadores de verdad)

Evaluación por valor de P:
  P = T → ¬P = F → (T ∧ F) = F
  P = F → ¬P = T → (F ∧ T) = F
  P = B → ¬P = B → (B ∧ B) = B  ← ¡Designado!
  P = N → ¬P = N → (N ∧ N) = N

Resultado: SATISFACIBLE en Belnap (designada para P = B)

Comparación entre sistemas:
  Clásica:        INSATISFACIBLE (contradicción)
  Intuicionista:  INSATISFACIBLE
  Belnap:         SATISFACIBLE (B = both true and false)
  
Significado pedagógico: En Belnap, una contradicción no causa "explosión"
  (ex falso quodlibet no vale). Esto modela fuentes de información
  contradictorias que coexisten sin colapso.
```

### 4.2 Tabla Belnap mejorada con marcas de designación

```
P     | ¬P    | P ∧ ¬P
------+-------+--------
T     | F     | F
F     | T     | F
B ⊛   | B ⊛   | B ⊛      ← designado (Both)
N     | N     | N

⊛ = valor designado (T o B = porta verdad)
→ Satisfacible en Belnap (1/4 valuaciones designadas)
```

### 4.3 Comparación con lógica clásica en CADA resultado

Siempre emitir: "En lógica clásica, esta fórmula sería: [V/I/S/C]"

### 4.4 Falla de leyes clásicas y por qué

```
Leyes que FALLAN en Belnap:
  ✗ P → P           (falla cuando P = N: N → N = N, no designado)
  ✗ P ∨ ¬P          (falla cuando P = N: N ∨ N = N)
  ✗ ¬(P ∧ ¬P)       (falla cuando P = B: ¬(B ∧ B) = ¬B = B, pero B es designado → ?)
  ✗ (P ∧ ¬P) → Q   (falla: explosión no vale)

Leyes que SE MANTIENEN:
  ✓ De Morgan
  ✓ Distributividad
  ✓ Idempotencia
```

### 4.5 Conexión con lógica de la relevancia

Mencionar en explain: "La lógica de Belnap está relacionada con la lógica de la relevancia:
las premisas deben ser *relevantes* para la conclusión."

---

## FASE 5 — Probabilístico (🟡 Sprint 3-4)

### 5.1 Cálculo paso a paso con reglas nombradas

```
explain (P | Q)

P(P ∨ Q) bajo distribución uniforme P(P)=P(Q)=0.5:

  Regla de inclusión-exclusión:
    P(P ∨ Q) = P(P) + P(Q) − P(P ∧ Q)
  
  Asumiendo independencia:
    P(P ∧ Q) = P(P) × P(Q) = 0.5 × 0.5 = 0.25
  
  P(P ∨ Q) = 0.5 + 0.5 − 0.25 = 0.75
```

### 5.2 Verificación de axiomas de Kolmogorov

Reportar que la asignación cumple los axiomas:
```
Axiomas de Kolmogorov:
  ✓ K1: P(φ) ≥ 0 para toda φ
  ✓ K2: P(⊤) = 1
  ✓ K3: Si φ∧ψ es insatisfacible → P(φ∨ψ) = P(φ) + P(ψ)
```

### 5.3 Probabilidad condicional y Bayes

Actualmente NO hay soporte para P(A|B). Agregar:
```
Probabilidad condicional:
  P(Q | P) = P(P ∧ Q) / P(P) = 0.25 / 0.5 = 0.5

Teorema de Bayes:
  P(P | Q) = P(Q | P) × P(P) / P(Q)
           = 0.5 × 0.5 / 0.5
           = 0.5
```

### 5.4 Tabla de probabilidades con sub-fórmulas

```
P(P)  | P(Q)  | P(P∧Q)  | P(P∨Q)  | P(P→Q)
------+-------+---------+---------+--------
0.00  | 0.00  | 0.0000  | 0.0000  | 1.0000
0.00  | 0.50  | 0.0000  | 0.5000  | 1.0000
0.50  | 0.00  | 0.0000  | 0.5000  | 0.5000
0.50  | 0.50  | 0.2500  | 0.7500  | 0.7500
1.00  | 1.00  | 1.0000  | 1.0000  | 1.0000
```

### 5.5 Análisis de sensibilidad

```
Sensibilidad de P(P → Q) a cambios en P(P):
  P(P)=0.0 → P(P→Q)=1.000  [vacuamente verdadero]
  P(P)=0.3 → P(P→Q)=0.850
  P(P)=0.5 → P(P→Q)=0.750
  P(P)=0.7 → P(P→Q)=0.650
  P(P)=1.0 → P(P→Q)=P(Q)   [depende totalmente de Q]
```

---

## FASE 6 — Intuicionista (🟡 Sprint 4)

### 6.1 Traza de forcing (demostración constructiva)

```
✗ [check valid] (P ∨ ¬P) NO es válida intuicionistamente
  Contramodelo Kripke:
    Mundos: {w₀, w₁}
    Accesibilidad: w₀ ≤ w₁ (preorden)
    V(w₀) = {}     V(w₁) = {P}
  
  Traza de forcing en w₀:
    ¿w₀ ⊩ P ∨ ¬P?
      Rama izquierda: ¿w₀ ⊩ P?
        P ∉ V(w₀) → No
      Rama derecha: ¿w₀ ⊩ ¬P?
        ¬P en w₀ ≡ ∀v≥w₀: v ⊮ P
        Pero w₁ ≥ w₀ y P ∈ V(w₁) → w₁ ⊩ P
        → ¬P no se fuerza en w₀
    → Ni P ni ¬P se fuerzan en w₀
    → P ∨ ¬P falla en w₀ ✗
  
  Interpretación constructiva:
    En IPC, P ∨ Q requiere una PRUEBA de P o una PRUEBA de Q.
    Aquí no tenemos prueba de P (no tenemos evidencia)
    ni prueba de ¬P (porque podría aparecer evidencia en el futuro, w₁).
    → El Tercero Excluido (LEM) no tiene prueba constructiva.
```

### 6.2 Tabla comparativa IPC vs CPC

```
Comparación con lógica clásica:
  │ Ley                          │ CPC │ IPC │
  │ P ∨ ¬P (LEM)                │ ✓   │ ✗   │
  │ ¬¬P → P (DNE)               │ ✓   │ ✗   │
  │ ((P→Q)→P)→P (Peirce)        │ ✓   │ ✗   │
  │ P → ¬¬P                     │ ✓   │ ✓   │
  │ (P→Q) → (¬Q→¬P) (Contra.)  │ ✓   │ ✓   │
  │ (P ∧ ¬P) → Q (EFQ)         │ ✓   │ ✓   │
  │ ¬¬¬P → ¬P                  │ ✓   │ ✓   │
```

### 6.3 Interpretación BHK

En explain() agregar:
```
Interpretación Brouwer-Heyting-Kolmogorov (BHK):
  Una prueba de P → Q es un procedimiento que transforma una prueba de P en una prueba de Q
  Una prueba de P ∧ Q es un par (prueba de P, prueba de Q)
  Una prueba de P ∨ Q es un par (i, prueba) donde i indica si es prueba de P o de Q
  Una prueba de ¬P es una prueba de P → ⊥ (P lleva a absurdo)
```

### 6.4 Propiedad de la disyunción

```
Propiedad de la disyunción (IPC):
  Si ⊢ P ∨ Q en IPC, entonces ⊢ P o ⊢ Q.
  (No se puede probar una disyunción sin probar uno de los disyuntos)
```

---

## FASE 7 — Aristotélica (🟡 Sprint 4)

### 7.1 Cuadro de oposición

```
explain forall x (S(x) -> P(x))

Proposición: Todo S es P (tipo A)

Cuadro de Oposición:
    A: Todo S es P ──── contrariedad ──── E: Ningún S es P
        │                                      │
   subalternación                         subalternación
        │                                      │
    I: Algún S es P ── subcontrariedad ── O: Algún S no es P
    
        A ←→ O: contradictorias
        E ←→ I: contradictorias
        A → I:  subalternación (si Todo S es P, entonces Algún S es P)*
        E → O:  subalternación (si Ningún S es P, entonces Algún S no es P)*
  
  * Con presuposición existencial (dominio no vacío)
```

### 7.2 Distribución de términos completa

```
✓ [check valid] Barbara (Figura 1) — AAA-1
  Premisa mayor: Todo M es P    [A: M+, P−]
  Premisa menor: Todo S es M    [A: S+, M−]
  Conclusión:    Todo S es P    [A: S+, P−]
  
  Distribución de términos:
    Término Mayor (P): −/− (no distribuido en premisa ni conclusión) ✓
    Término Menor (S): +/+ (distribuido en premisa menor y conclusión) ✓
    Término Medio (M): +/− (distribuido al menos una vez: en premisa mayor como sujeto) ✓
  
  Reglas cumplidas:
    ✓ El término medio está distribuido al menos una vez
    ✓ Ningún término está más distribuido en conclusión que en premisas
    ✓ Si una premisa es negativa, la conclusión es negativa (N/A: no hay negativas)
    ✓ No hay dos premisas negativas
    ✓ Si ambas premisas son universales, la conclusión puede ser universal
  
  Diagrama: ┌────────P────────┐
            │  ┌────M────┐    │
            │  │   [S]    │    │
            │  └──────────┘    │
            └──────────────────┘
```

### 7.3 Inferencias inmediatas

Para proposiciones individuales, mostrar las inferencias inmediatas:
```
Inferencias inmediatas de "Todo S es P" (A):
  Conversión: "Algún P es S" (I) — conversión por limitación
  Obversión: "Ningún S es no-P" (E)
  Contraposición: "Todo no-P es no-S" (A)
```

### 7.4 Entimemas (silogismos incompletos)

Cuando derive() recibe solo 1 premisa:
```
⚠ [derive] Solo se proporcionó 1 premisa — posible entimema
  Premisa dada: Todo M es P
  Conclusión buscada: Todo S es P
  Premisa faltante para completar silogismo:
    Opción 1: "Todo S es M" → Barbara (AAA-1) ✓
    Opción 2: "Algún S es M" → Darii (AIA-1) → pero conclusión sería I
```

---

## FASE 8 — Aritmética (🟢 Sprint 5)

### 8.1 Evaluación paso a paso

```
check valid (3 + 4 * 2 > 10)

Evaluación paso a paso:
  4 * 2 = 8          [multiplicación]
  3 + 8 = 11         [suma]
  11 > 10 = verdadero [comparación]
  → Resultado: ✓ verdadero
```

### 8.2 Propiedades matemáticas

```
explain (a + b)

Propiedades de la suma (+):
  ✓ Conmutativa: a + b = b + a
  ✓ Asociativa: (a + b) + c = a + (b + c)
  ✓ Identidad: a + 0 = a
  ✓ Inverso: a + (−a) = 0
```

### 8.3 Detección de patrones y simplificación

```
explain (x * 1 + 0)

Simplificación:
  x * 1 = x    [identidad multiplicativa]
  x + 0 = x    [identidad aditiva]
  → Simplificado: x
```

---

## FASE 9 — Mejoras Transversales (todos los sprints)

### T1. Módulo `src/runtime/formula-classifier.ts` (NUEVO)

**Responsabilidad**: Dado un `Formula`, retornar su clasificación:
- Nombre de ley conocida (si aplica)
- Tipo de conectivo principal
- Profundidad y complejidad
- Forma de argumento (si hay premisas + conclusión)
- Conjunto de conectivos usados (para completitud funcional)

### T2. Módulo `src/runtime/known-theorems.ts` (NUEVO)

**Responsabilidad**: Catálogo de axiomas y teoremas por sistema modal.
Matching de fórmulas por unificación con esquemas.

### T3. Módulo `src/runtime/cross-system-compare.ts` (NUEVO)

**Responsabilidad**: Dada una fórmula, evaluar rápido en múltiples sistemas y reportar:
```
Comparación entre sistemas:
  Clásica proposicional:   VÁLIDA (tautología)
  Intuicionista:           NO VÁLIDA
  Modal K:                 [N/A si no tiene modales]
  Belnap:                  NO VÁLIDA (falla para N)
```

Se activa con `set verbose on` o cuando el usuario invoca `explain`.

### T4. Campos adicionales en `RunResult`

```typescript
interface RunResult {
  // ... existente ...
  reasoningType?: string;             // "Modus Ponens", "Barbara", etc.
  reasoningSchema?: string;           // "φ → ψ, φ ⊢ ψ"
  formulaClassification?: string;     // "Contrapositiva", "Ley de De Morgan"
  normalForms?: {
    nnf?: string;
    cnf?: string;
    dnf?: string;
  };
  formulaAnalysis?: {
    mainConnective?: string;          // "→", "∧", "∨", "¬", etc.
    depth?: number;                   // profundidad del árbol
    complexity?: number;              // número de conectivos
    subFormulas?: string[];           // lista de sub-fórmulas
    atomCount?: number;               // número de átomos distintos
    connectivesUsed?: string[];       // {"→", "¬"}, etc.
  };
  crossSystemComparison?: Record<string, string>;  // {classical: "valid", intuitionistic: "invalid"}
  tableauTrace?: TableauStep[];       // traza del tableau para modales
  educationalNote?: string;           // nota pedagógica contextual
  paradoxWarning?: string;            // advertencia de paradoja conocida
}
```

### T5. Tabla de verdad con sub-fórmulas

```typescript
interface TruthTableResult {
  variables: string[];
  rows: TruthTableRow[];
  isTautology: boolean;
  isContradiction: boolean;
  isSatisfiable: boolean;
  // NUEVO:
  subFormulas?: { formula: Formula; label: string }[];
  subFormulaValues?: Record<string, boolean | string>[];
  satisfyingCount?: number;           // cuántas filas son V
  totalCount?: number;                // total de filas
}
```

### T6. Flag de verbosidad

```st
set verbose on    // Todo: formas normales, sub-fórmulas, comparación, notas pedagógicas
set verbose off   // Salida compacta (default actual)
set verbose proof // Solo pruebas detalladas
set verbose model // Solo modelos detallados
```

### T7. Notas pedagógicas contextuales

En `emitResult()`, agregar notas educativas automáticas:
- En derive con MP: "El Modus Ponens es la regla de inferencia más fundamental..."
- En check valid de tautología: "Una tautología es verdadera bajo TODA interpretación..."
- En contradicción: "Una contradicción es falsa bajo toda interpretación..."
- En silogismo: "Los silogismos fueron sistematizados por Aristóteles en el Organon..."

Solo se muestra con `set verbose on`.

### T8. Exportación LaTeX de pruebas

El `formulaToLaTeX()` ya existe en `format.ts`. Extender para exportar pruebas completas:
```
\begin{prooftree}
  \AxiomC{$P \to Q$}
  \AxiomC{$P$}
  \RightLabel{\scriptsize MP}
  \BinaryInfC{$Q$}
\end{prooftree}
```

Activar con: `render latex (derive Q from {a1, a2})` o `set output latex`.

---

## Plan de implementación revisado

### Sprint 1 — Proposicional (impacto inmediato)
1. `formula-classifier.ts` — clasificación de leyes (~300 líneas)
2. `RunResult` — campos nuevos en types
3. `emitResult()` — enrichment con reasoningType, classification
4. Motor de derivación — 10 reglas nuevas (dilemas, absorción, resolución, RAA, etc.)
5. `propositional.explain()` — reescribir completo con sub-fórmulas, CNF/DNF, clasificación
6. `toCNF()` / `toDNF()` — nuevas funciones
7. Tabla de verdad — sub-fórmulas y conteo
8. Tests

**Estimación**: ~800 líneas nuevas + ~200 modificadas

### Sprint 2 — Tableau y Modales
1. `tableau-engine.ts` — instrumentar con traza exportable
2. `base-profile.ts` — propagar traza, generar contramodelo Kripke
3. `known-theorems.ts` — catálogo de axiomas por sistema
4. K/Deóntica/Epistémica/Temporal — identify axiom, frame properties, paradoxes
5. Tests

**Estimación**: ~900 líneas nuevas + ~250 modificadas

### Sprint 3 — First-Order + Belnap
1. `first-order.ts` — reescribir explain(), derive() con reglas UI/EG/UG/EI, countermodel
2. Forma prenex, Skolemización, análisis de variables
3. `belnap.ts` — explain() completo, tabla mejorada, leyes que fallan, retículo
4. `cross-system-compare.ts` — comparación entre sistemas
5. Tests

**Estimación**: ~700 líneas nuevas + ~200 modificadas

### Sprint 4 — Probabilístico + Intuicionista + Aristotélica
1. Probabilístico: cálculo paso a paso, condicional, Bayes, Kolmogorov, sensibilidad
2. Intuicionista: traza de forcing, comparación IPC/CPC, interpretación BHK, propiedad disyunción
3. Aristotélica: cuadro de oposición, distribución completa, inferencias inmediatas, entimemas
4. Tests

**Estimación**: ~800 líneas nuevas + ~200 modificadas

### Sprint 5 — Aritmética + Pulido + Cross-cutting
1. Aritmética: evaluación paso a paso, propiedades, simplificación
2. `fallacies.ts` — 7 falacias nuevas
3. `set verbose` — sistema de verbosidad
4. Notas pedagógicas
5. Exportación LaTeX de pruebas
6. Documentación completa

**Estimación**: ~600 líneas nuevas + ~150 modificadas

---

## Ejemplos de salida final deseada

### Proposicional — derive con cadena compleja
```
✓ [derive] S derivado exitosamente
  Patrón de razonamiento: Cadena de Modus Ponens + Silogismo Hipotético
  Reglas aplicadas: MP(×2), SH(×1)
  Prueba:
    1. (P → Q)  — Premisa (a1)
    2. (Q → R)  — Premisa (a2)
    3. (R → S)  — Premisa (a3)
    4. P         — Premisa (a4)
    5. (P → R)  — Silogismo Hipotético [de 1, 2]
    6. R         — Modus Ponens [de 5, 4]
    7. S         — Modus Ponens [de 3, 6]
  Consecuencia semántica: ✓ (verificada por tabla de verdad)
```

### Modal — check valid con identificación
```
✓ [check valid] K(P) → P  es VÁLIDA en epistemic.s5
  Identificación: Axioma T (Veridicidad)
  Nombre: "Lo que se sabe es verdadero"
  Interpretación epistémica: K(P) → P
  Requiere: Reflexividad de la relación de accesibilidad
  Válida en: T, S4, S5, epistemic.s5, temporal.ltl
  No válida en: K, KD (deontic.standard)
  Método: Tableau cerrado (4 pasos)
```

### Belnap — contradicción tolerada
```
◎ [check satisfiable] (P ∧ ¬P) es SATISFACIBLE en Belnap
  Modelo: P = B (Both: verdadero Y falso)
  
  Comparación:
    Clásica:       INSATISFACIBLE (contradicción, explosión)
    Intuicionista: INSATISFACIBLE
    Belnap:        SATISFACIBLE — B es valor designado
  
  Nota: En lógica de Belnap, las contradicciones no causan explosión.
  Ex falso quodlibet (P ∧ ¬P → Q) NO es válido aquí.
  Esto modela sistemas con información contradictoria pero útil.
```

### Aristotélica — silogismo con análisis completo
```
✓ [check valid] Barbara (Figura 1) — AAA-1
  Premisa mayor: Todo M es P    [M+, P−]
  Premisa menor: Todo S es M    [S+, M−]
  ∴ Conclusión:  Todo S es P    [S+, P−]
  
  Término medio (M): distribuido en premisa mayor ✓
  Vocal mnemotécnica: B-A-r-b-A-r-A (AAA)
  
  Cuadro: S ⊆ M ⊆ P → S ⊆ P (transitividad)
  
  Diagrama:  ┌────────P────────┐
             │  ┌────M────┐    │
             │  │   [S]    │    │
             │  └──────────┘    │
             └──────────────────┘
```

---

## Archivos afectados (resumen completo)

| Archivo | Tipo | Sprint | Estimación |
|---|---|---|---|
| `src/runtime/formula-classifier.ts` | **NUEVO** | 1 | ~300 |
| `src/runtime/known-theorems.ts` | **NUEVO** | 2 | ~200 |
| `src/runtime/cross-system-compare.ts` | **NUEVO** | 3 | ~150 |
| `src/types/index.ts` | Modificar (RunResult, TruthTable) | 1 | ~50 |
| `src/runtime/interpreter.ts` | Modificar (emitResult, formatTruthTable, verbose) | 1,5 | ~200 |
| `src/profiles/classical/propositional.ts` | Modificar (derive engine, explain, CNF/DNF) | 1 | ~400 |
| `src/profiles/shared/tableau-engine.ts` | Modificar (traza, contramodelo) | 2 | ~300 |
| `src/profiles/shared/base-profile.ts` | Modificar (propagar traza, frame info) | 2 | ~150 |
| `src/profiles/modal/k.ts` | Modificar (axiom ID, frame props) | 2 | ~80 |
| `src/profiles/deontic/standard.ts` | Modificar (paradojas deónticas) | 2 | ~120 |
| `src/profiles/epistemic/s5.ts` | Modificar (paradojas epistémicas, colapsamiento) | 2 | ~120 |
| `src/profiles/temporal/ltl.ts` | Modificar (patrones temporales) | 2 | ~100 |
| `src/profiles/classical/first-order.ts` | Modificar (explain, derive con UI/EG/UG/EI, model) | 3 | ~350 |
| `src/profiles/paraconsistent/belnap.ts` | Modificar (explain, tabla, leyes, retículo) | 3 | ~200 |
| `src/profiles/probabilistic/basic.ts` | Modificar (paso a paso, Bayes, Kolmogorov) | 4 | ~250 |
| `src/profiles/intuitionistic/propositional.ts` | Modificar (forcing trace, BHK, comp.) | 4 | ~200 |
| `src/profiles/aristotelian/syllogistic.ts` | Modificar (oposición, distribución, entimema) | 4 | ~250 |
| `src/profiles/arithmetic/index.ts` | Modificar (paso a paso, propiedades) | 5 | ~150 |
| `src/runtime/fallacies.ts` | Modificar (+7 falacias) | 5 | ~150 |
| `src/runtime/format.ts` | Modificar (LaTeX de pruebas) | 5 | ~100 |
| `src/tests/formula-classifier.test.ts` | **NUEVO** | 1 | ~200 |
| `src/tests/tableau-trace.test.ts` | **NUEVO** | 2 | ~200 |
| `src/tests/cross-system.test.ts` | **NUEVO** | 3 | ~150 |
| `src/tests/first-order-output.test.ts` | **NUEVO** | 3 | ~150 |

---

> **Líneas estimadas totales**: ~3,800 nuevas + ~1,000 modificadas
> **Sprints estimados**: 5 (incrementales, cada sprint entrega valor visible)
> **Riesgo**: Bajo — cambios aditivos, compatibles hacia atrás
> **Criterio de éxito**: Cada comando en cada perfil produce salida educativamente completa
> comparable a un libro de texto universitario de lógica
