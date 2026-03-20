# Plan: SAT Solver Avanzado para ST

## Estado actual

El DPLL actual resuelve fórmulas de ~50 átomos en milisegundos.
Para escalar a miles de átomos, hay 4 ejes de mejora.

---

## 1. CDCL — Conflict-Driven Clause Learning

### Qué es
Cuando el solver encuentra un conflicto (una cláusula falsificada), en vez de hacer backtrack ciego, **analiza POR QUÉ** falló y genera una nueva cláusula que impide repetir el mismo error.

### Implementación concreta en `dpll.ts`

```
Archivo: src/profiles/classical/dpll.ts
Nuevo: src/profiles/classical/cdcl.ts (reemplaza dpll.ts)
```

**Estructuras de datos necesarias:**

1. **Implication Graph**: cada asignación registra:
   - Qué cláusula la forzó (antecedent clause)
   - En qué nivel de decisión se hizo (decision level)
   ```typescript
   interface Assignment {
     value: boolean;
     level: number;          // nivel de decisión (0 = unit prop inicial)
     antecedent: number | -1; // índice de cláusula que forzó, -1 si fue decisión
   }
   const assignments: Assignment[] = new Array(numVars + 1);
   ```

2. **Conflict Analysis (1UIP - First Unique Implication Point)**:
   - Cuando una cláusula se falsifica, recorrer el implication graph
   - Resolver cláusulas hasta encontrar el 1UIP (primer punto donde solo hay un literal del nivel actual)
   - La cláusula aprendida se añade al conjunto de cláusulas
   ```typescript
   function analyzeConflict(conflictClause: number): { learnedClause: Clause; backtrackLevel: number } {
     // Empezar con la cláusula conflictiva
     // Resolver con antecedentes hasta tener exactamente 1 literal del nivel actual
     // El segundo nivel más alto determina adónde hacer backtrack
   }
   ```

3. **Non-chronological Backtracking**:
   - En vez de subir 1 nivel, saltar directamente al `backtrackLevel`
   - Deshacer todas las asignaciones de niveles superiores
   - La cláusula aprendida se convierte en unit clause → propaga automáticamente

**Impacto**: ~100x mejora en fórmulas estructuradas. Pasa de ~50 átomos a ~500-1000.

### Watched Literals (prerequisito para CDCL eficiente)

El cuello de botella actual: `unitPropagation()` recorre TODAS las cláusulas en cada paso.

**Solución — 2-Literal Watching:**
- Cada cláusula vigila solo 2 literales (los "watched")
- Solo se re-examina una cláusula cuando uno de sus watched literals se falsifica
- Cuando un watched se falsifica, buscar otro literal no-falsificado para reemplazarlo
- Si no hay reemplazo → la cláusula es unit o conflicto

```typescript
// Para cada literal, lista de cláusulas que lo vigilan
const watchList: Map<number, number[]>;  // literal → clause indices

// Cada cláusula tiene 2 posiciones watched
const watched: Int32Array;  // watched[ci*2] y watched[ci*2+1] = posiciones en la cláusula

function propagate(lit: number): boolean {
  // Solo examinar cláusulas donde -lit es watched
  const clauses = watchList.get(-lit);
  for (const ci of clauses) {
    // Buscar otro literal no-falsificado para reemplazar el watch
    // Si no hay → unit propagation o conflicto
  }
}
```

**Impacto**: unit propagation pasa de O(total_literals) a O(affected_literals) por paso.

---

## 2. Paralelismo — Web Workers para SAT

### Arquitectura

```
Main Thread (Interpreter)
    │
    ├── Worker 1: CDCL solver (rama true)
    ├── Worker 2: CDCL solver (rama false)
    ├── Worker 3: CDCL solver (portfolio: diferentes heurísticas)
    └── Worker 4: Preprocessing + simplificación
```

### Implementación concreta

```
Nuevo: src/profiles/classical/parallel-sat.ts
Nuevo: src/profiles/classical/sat-worker.ts (código del worker)
```

**Estrategia 1 — Divide and Conquer:**
```typescript
// Elegir variable de split
const splitVar = chooseSplitVariable(formula);

// Lanzar 2 workers en paralelo
const worker1 = new Worker('./sat-worker.js');
const worker2 = new Worker('./sat-worker.js');

worker1.postMessage({ clauses, assignment: { [splitVar]: true } });
worker2.postMessage({ clauses, assignment: { [splitVar]: false } });

// El primero que encuentre SAT gana; si ambos dicen UNSAT → UNSAT
```

**Estrategia 2 — Portfolio (más efectiva en la práctica):**
```typescript
// Mismo problema, diferentes heurísticas
const configs = [
  { varSelection: 'vsids', restartPolicy: 'luby' },
  { varSelection: 'random', restartPolicy: 'geometric' },
  { varSelection: 'jw', restartPolicy: 'fixed-100' },
];

// El primero que resuelva, mata a los demás
const result = await Promise.race(
  configs.map(cfg => runWorker(clauses, cfg))
);
```

**Limitación de Node.js**: `worker_threads` tiene overhead de serialización.
Para cláusulas, usar `SharedArrayBuffer` para compartir memoria sin copia:

```typescript
// Codificar cláusulas en un buffer compartido
const sharedBuffer = new SharedArrayBuffer(totalLiterals * 4);
const sharedClauses = new Int32Array(sharedBuffer);
// Workers leen directamente sin copia
```

**Impacto**: 2-4x speedup con divide-and-conquer, hasta 8x con portfolio en multi-core.

---

## 3. Preprocessing — Simplificar antes de resolver

### Técnicas ordenadas por impacto

**a) Subsumption Elimination**
Si cláusula A ⊂ cláusula B, eliminar B (es redundante).
```
{P, Q} subsume {P, Q, R}  →  eliminar {P, Q, R}
```

**b) Self-Subsuming Resolution**
Si resolver A con B produce un subconjunto de A, reemplazar A.
```
{P, Q, R} resuelve con {¬P, Q} → {Q, R} que subsume {P, Q, R}
Reemplazar {P, Q, R} por {Q, R}
```

**c) Bounded Variable Elimination (BVE)**
Si una variable aparece pocas veces, resolver todas sus cláusulas positivas contra las negativas y eliminar la variable.
```
x aparece en: {x, A}, {x, B}, {¬x, C}, {¬x, D}
Resolución: {A, C}, {A, D}, {B, C}, {B, D}
Si el resultado tiene ≤ cláusulas originales → eliminar x
```

**d) Failed Literal Probing**
Para cada literal no asignado, asumir que es true y propagar.
Si causa conflicto → el literal DEBE ser false (unit clause gratis).
```typescript
for (let v = 1; v <= numVars; v++) {
  // Probar v = true
  if (propagateAndConflict(v)) {
    addUnitClause(-v);  // v debe ser false
    continue;
  }
  // Probar v = false
  if (propagateAndConflict(-v)) {
    addUnitClause(v);   // v debe ser true
  }
}
```

```
Archivo: src/profiles/classical/sat-preprocess.ts
```

**Impacto**: reduce el tamaño del problema 30-80% antes de que el solver empiece.

---

## 4. Detección de paradojas e imposibilidades demostradas

### Fórmulas matemáticamente imposibles que ST debe reconocer

**a) Contradicciones estructurales (detectables en tiempo lineal)**
```
Patrón: P & ¬P                    → INSATISFACIBLE (trivial)
Patrón: (P → Q) & (Q → R) & P & ¬R  → INSATISFACIBLE (cadena rota)
```
Ya detectado por unit propagation.

**b) Pigeonhole Principle — PHP(n+1, n)**
"n+1 palomas en n casillas sin compartir" → UNSAT.
Demostrado que requiere cláusulas exponenciales en resolución (Haken, 1985).
CDCL no ayuda — necesita **Extended Resolution** o detección especial.

```typescript
function detectPigeonhole(clauses: Clause[]): boolean {
  // Detectar patrón: cada "fila" tiene exactamente n opciones (at-least-one)
  // y cada "columna" tiene at-most-one constraints
  // Si filas > columnas → UNSAT por PHP
}
```

**c) Principio de Paridad**
Fórmulas que codifican "número impar de variables true en un conjunto par" → siempre UNSAT.
Detectable contando restricciones XOR.

**d) Tautologías por simetría**
Si una fórmula tiene simetría completa entre variables (cualquier permutación da la misma fórmula), se puede resolver con un solo representante.

```typescript
function detectSymmetry(clauses: Clause[]): Map<number, number[]> {
  // Construir grafo de literales
  // Encontrar automorfismos (nauty/bliss algorithm simplificado)
  // Agrupar variables simétricas
  // Añadir symmetry-breaking clauses: v1 ≤ v2 ≤ v3 ...
}
```

**e) Indecidibilidad en FOL — lo que NUNCA se puede resolver**

El Teorema de Church (1936) demostró que la validez en lógica de primer orden es **indecidible**.
Esto significa: no existe NINGÚN algoritmo que, para toda fórmula FOL, termine y diga "válida" o "no válida".

Lo que SÍ se puede hacer:
- Si es válida → el tableau eventualmente la encuentra (semi-decidible)
- Si NO es válida → puede correr para siempre

ST debe detectar patrones conocidos como irresolubles:
```typescript
const UNDECIDABLE_PATTERNS = [
  // Fragmento Σ₁¹: cuantificación sobre funciones
  'second_order_existential',
  // Autorreferencia: φ dice "φ no es demostrable"
  'goedel_sentence',
  // Halting problem codificado como fórmula
  'halting_encoding',
];

function detectUndecidable(formula: Formula): string | null {
  // Analizar estructura de cuantificadores
  // Si tiene ∀∃∀ alternación sin restricción de dominio → advertir
  // Si referencia su propia derivabilidad → paradoja de Gödel
}
```

---

## 5. Orden de implementación recomendado

| Paso | Qué | Impacto | Esfuerzo |
|------|-----|---------|----------|
| 1 | Watched Literals | 10x propagación | 2-3 días |
| 2 | CDCL (1UIP + backtrack) | 100x general | 1 semana |
| 3 | Preprocessing (subsumption + BVE) | 30-80% reducción | 3-4 días |
| 4 | Restarts (Luby sequence) | Evita estancamiento | 1 día |
| 5 | Detección de pigeonhole/simetría | Resuelve lo "imposible para DPLL" | 3-4 días |
| 6 | Paralelismo (portfolio) | 2-8x multi-core | 1 semana |
| 7 | Detector de indecidibilidad FOL | UX: avisa al usuario | 2-3 días |

### Resultado esperado tras implementar pasos 1-4
- Fórmulas de **~5,000 átomos** resolubles en <30 segundos
- Comparable a MiniSat de 2005
- Suficiente para cualquier uso práctico en lógica educativa

### Resultado esperado tras implementar pasos 5-7
- Detección instantánea de paradojas conocidas
- Uso de todos los cores disponibles
- Mensajes claros cuando se topa con lo matemáticamente imposible

---

## Referencias

- MiniSat paper: Eén & Sörensson (2003) — implementación de referencia CDCL
- GRASP: Marques-Silva & Sakallah (1999) — primer solver CDCL
- Chaff: Moskewicz et al. (2001) — watched literals
- Haken (1985) — exponential lower bound para PHP en resolución
- Church (1936) — indecidibilidad de validez en FOL
- Gödel (1931) — incompletitud de aritmética
