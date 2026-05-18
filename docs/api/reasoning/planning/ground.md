# `reasoning/planning/ground.ts`

============================================================ ST Planning — Grounding y aplicación de acciones ============================================================ "Grounding" = instanciar un action schema lifted (con ?vars) a una acción concreta sobre objetos del dominio. Ejemplo:   schema:   move(?from, ?to) pre: at(?from)  add: at(?to)  del: at(?from)   binding:  { '?from': 'a', '?to': 'b' }   ground:   pre: at(a)  add: at(b)  del: at(a) La sustitución es textual: reemplazamos ?from → a en cada string del schema. Usamos boundary `(?[A-Za-z_][A-Za-z0-9_]*)` para no pisar variables que comparten prefijo (`?x` vs `?xy`).

## Contents

- [`substituteVars`](#substitutevars) — Function
- [`ground`](#ground) — Function
- [`applyAction`](#applyaction) — Function
- [`preconditionsSatisfied`](#preconditionssatisfied) — Function
- [`goalSatisfied`](#goalsatisfied) — Function
- [`groundAll`](#groundall) — Function

## `substituteVars`

> Function · `reasoning/planning/ground.ts:24`

Sustituye variables `?var` por sus valores ligados en una cadena.
Si la variable no está en bindings, se deja como está (permite
grounding parcial / debugging).

```ts
export function substituteVars(text: string, bindings: Record<string, string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `text` | `string` | no |  |
| `bindings` | `Record<string, string>` | no |  |

### Returns

`string` — 


## `ground`

> Function · `reasoning/planning/ground.ts:41`

Aplica un binding a un schema y devuelve una acción ground.

No valida que el binding cubra todos los parámetros: lo que falte
queda con `?var` en el string (caller's responsibility validar).

```ts
export function ground(action: STRIPSAction, bindings: Record<string, string>): GroundedAction
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `action` | `STRIPSAction` | no |  |
| `bindings` | `Record<string, string>` | no |  |

### Returns

`GroundedAction` — 


## `applyAction`

> Function · `reasoning/planning/ground.ts:62`

Aplica una acción ground a un estado, devolviendo un nuevo estado.

Convención STRIPS estándar: primero se borran los hechos en delList,
luego se añaden los de addList. Si un hecho está en ambos, el
resultado neto es "añadido" (delete antes que add).

NO valida preconditions — esa verificación se hace en el planner
antes de invocar applyAction. (Permite usarlo para forward search
sin redundancia.)

```ts
export function applyAction( state: Set<Fact>, grounded:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `Set<Fact>` | no |  |
| `grounded` | `{ addList: Set<Fact>; delList: Set<Fact> }` | no |  |

### Returns

`Set<Fact>` — 


## `preconditionsSatisfied`

> Function · `reasoning/planning/ground.ts:76`

Chequea si un estado satisface las preconditions de una acción
ground (todas presentes).

```ts
export function preconditionsSatisfied(state: Set<Fact>, preconditions: Set<Fact>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `Set<Fact>` | no |  |
| `preconditions` | `Set<Fact>` | no |  |

### Returns

`boolean` — 


## `goalSatisfied`

> Function · `reasoning/planning/ground.ts:86`

Chequea si un estado satisface el goal (goal ⊆ state).

```ts
export function goalSatisfied(state: Set<Fact>, goal: Set<Fact>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `Set<Fact>` | no |  |
| `goal` | `Set<Fact>` | no |  |

### Returns

`boolean` — 


## `groundAll`

> Function · `reasoning/planning/ground.ts:105`

Enumera el producto cartesiano de objetos para los parámetros de
una acción y devuelve TODAS las acciones ground posibles.

Si el dominio tiene tipos en `objects`, por simplicidad enumeramos
sobre `flatObjects = union(values of objects)`. Quien necesite
tipos más finos puede pre-filtrar las acciones ground devueltas.

Para |params|=2 con |objs|=10 → 100 acciones ground por schema. Es
fácil que esto explote, así que el planner aplica `preconditionsSatisfied`
como filtro early y typically la mayoría se podan.

```ts
export function groundAll( action: STRIPSAction, objects: Record<string, string[]>, ): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `action` | `STRIPSAction` | no |  |
| `objects` | `Record<string, string[]>` | no |  |

### Returns

`Array<{ bindings: Record<string, string>; grounded: GroundedAction }>` — 

