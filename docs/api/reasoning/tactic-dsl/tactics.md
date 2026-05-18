# `reasoning/tactic-dsl/tactics.ts`

============================================================ Tactic DSL — tactics built-in ============================================================ Cada tactic recibe un ProofState y devuelve un ProofState nuevo (inmutable). Si la tactic no aplica al goal actual, lanza TacticError. Eso permite que `orElse` capture la falla y pruebe otra alternativa. Convención: el goal "activo" es siempre `state.goals[0]`. Las reglas que generan sub-goals (split, induction, destruct, …) los insertan al frente para que se trabajen en orden.

## Contents

- [`_resetGoalCounter`](#resetgoalcounter) — Function
- [`intro`](#intro) — Function
- [`exact`](#exact) — Function
- [`assumption`](#assumption) — Function
- [`apply`](#apply) — Function
- [`rewrite`](#rewrite) — Function
- [`rfl`](#rfl) — Function
- [`trivial`](#trivial) — Function
- [`split`](#split) — Function
- [`left`](#left) — Function
- [`right`](#right) — Function
- [`destruct`](#destruct) — Function
- [`induction`](#induction) — Function
- [`caseAnalysis`](#caseanalysis) — Function
- [`DefDictionary`](#defdictionary) — Interface
- [`unfold`](#unfold) — Function
- [`simp`](#simp) — Function

## `_resetGoalCounter`

> Function · `reasoning/tactic-dsl/tactics.ts:32`

Resets the internal goal ID counter to 0. Intended for deterministic tests only.

```ts
export function _resetGoalCounter(): void
```

### Returns

`void` — 


## `intro`

> Function · `reasoning/tactic-dsl/tactics.ts:78`

`intro(name?)` — For a goal of the form `P → Q`, moves the antecedent `P`
into the hypothesis context under `name` (auto-generated when omitted) and
leaves `Q` as the new goal. Also handles `¬P` (≡ `P → False`).

```ts
export function intro(name?: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | yes |  |

### Returns

`Tactic` — 


## `exact`

> Function · `reasoning/tactic-dsl/tactics.ts:121`

`exact(term)` — Closes the current goal when `term` is either the name of
a hypothesis whose type matches the conclusion, or a string syntactically
equal to the conclusion.

```ts
export function exact(term: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `string` | no |  |

### Returns

`Tactic` — 


## `assumption`

> Function · `reasoning/tactic-dsl/tactics.ts:147`

Closes the goal by finding a hypothesis whose type is syntactically equal
to the conclusion. Equivalent to `exact` over the full hypothesis map.

```ts
export function assumption(): Tactic
```

### Returns

`Tactic` — 


## `apply`

> Function · `reasoning/tactic-dsl/tactics.ts:178`

`apply(thm, args?)` — Backward chaining on hypothesis `thm`.
If `thm : A → B` and the goal is `B`, leaves sub-goal `A`.
Multi-premise: `thm : A → B → C` with goal `C` leaves goals `A` and `B`.
`args` allows immediately discharging leading premises with matching hypotheses.

```ts
export function apply(thm: string, args?: string[]): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm` | `string` | no |  |
| `args` | `string[]` | yes |  |

### Returns

`Tactic` — 


## `rewrite`

> Function · `reasoning/tactic-dsl/tactics.ts:240`

`rewrite(eq, dir?)` — Uses hypothesis `eq : lhs = rhs` to replace
occurrences of `lhs` with `rhs` in the conclusion (left-to-right by default),
or `rhs` with `lhs` when `dir = 'right-to-left'`.

```ts
export function rewrite( eq: string, dir: 'left-to-right' | 'right-to-left' = 'left-to-right', ): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eq` | `string` | no |  |
| `dir` | `'left-to-right' \| 'right-to-left'` | yes |  |

### Returns

`Tactic` — 


## `rfl`

> Function · `reasoning/tactic-dsl/tactics.ts:278`

Closes goals of the form `a = a` (syntactic reflexivity after normalization).

```ts
export function rfl(): Tactic
```

### Returns

`Tactic` — 


## `trivial`

> Function · `reasoning/tactic-dsl/tactics.ts:300`

Closes trivially true goals: `True`, or any goal when `False` is in the hypotheses
(ex falso quodlibet).

```ts
export function trivial(): Tactic
```

### Returns

`Tactic` — 


## `split`

> Function · `reasoning/tactic-dsl/tactics.ts:326`

∧-introduction: splits a conjunction goal `P ∧ Q` into two sub-goals `P` and `Q`.

```ts
export function split(): Tactic
```

### Returns

`Tactic` — 


## `left`

> Function · `reasoning/tactic-dsl/tactics.ts:348`

∨-introduction (left): for a disjunction goal `P ∨ Q`, reduces to proving `P`.

```ts
export function left(): Tactic
```

### Returns

`Tactic` — 


## `right`

> Function · `reasoning/tactic-dsl/tactics.ts:365`

∨-introduction (right): for a disjunction goal `P ∨ Q`, reduces to proving `Q`.

```ts
export function right(): Tactic
```

### Returns

`Tactic` — 


## `destruct`

> Function · `reasoning/tactic-dsl/tactics.ts:387`

Case analysis on hypothesis `name`.
- `H: P ∧ Q` → splits into hypotheses `H_L: P` and `H_R: Q` in the same goal.
- `H: P ∨ Q` → produces two sub-goals, each with the respective disjunct.
- `H: ⊥` → closes the goal (ex falso).

```ts
export function destruct(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `induction`

> Function · `reasoning/tactic-dsl/tactics.ts:442`

Structural induction on hypothesis `name: Nat`.
Produces two sub-goals:
- **zero case**: conclusion with `name` substituted by `zero`.
- **succ case**: adds `IH: P(k)` and `k: Nat`; conclusion is `P(succ(k))`.

Only Nat induction is supported in this base implementation.

```ts
export function induction(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `caseAnalysis`

> Function · `reasoning/tactic-dsl/tactics.ts:495`

Alias of {@link destruct} with the semantics of "case analysis".
Exported as `case` from `index.ts` via re-export alias (JS keyword conflict).

```ts
export function caseAnalysis(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `DefDictionary`

> Interface · `reasoning/tactic-dsl/tactics.ts:506`

Maps definition names to their body expressions. Passed to {@link unfold}.

```ts
export interface DefDictionary
```


## `unfold`

> Function · `reasoning/tactic-dsl/tactics.ts:516`

`unfold(def, dict)` — Replaces the identifier `def` by its body from `dict`
in the current conclusion. The definition dictionary is caller-supplied;
no global state is maintained.

```ts
export function unfold(def: string, dict: DefDictionary =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `def` | `string` | no |  |
| `dict` | `DefDictionary` | yes |  |

### Returns

`Tactic` — 


## `simp`

> Function · `reasoning/tactic-dsl/tactics.ts:547`

Applies the following rewrite rules recursively to a fixed point:
- `True ∧ X → X`, `X ∧ True → X`, `False ∧ X → False`
- `False ∨ X → X`, `X ∨ False → X`, `True ∨ X → True`
- `True → X → X`, `X → True → True`, `False → X → True`
- `¬¬X → X`

```ts
export function simp(): Tactic
```

### Returns

`Tactic` — 

