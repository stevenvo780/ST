# `reasoning/automata/types.ts`

============================================================ ST Automata — Tipos ============================================================ Modelado clásico de autómatas finitos y de pila:   DFA (Deterministic Finite Automaton)     · Transición total: state × symbol → state.     · Acepta una palabra sii el camino termina en estado final.   NFA (Nondeterministic Finite Automaton, con ε-transiciones)     · Transición: state × (symbol ∪ {ε}) → P(states).     · Acepta sii existe un camino que termina en final.   PDA (Pushdown Automaton) — variante "by final state"     · Transición: (state, read, popTop) → (nextState, pushTop[]).     · `read` o `popTop` pueden ser ε (sin consumir / sin tope).     · pushTop se apila en orden inverso (último → top). Notas:   • Los símbolos son strings de longitud 1 (chars). El alfabeto     se mantiene explícito porque define complement(M).   • La constante EPSILON ('ε') vive aquí para reutilizarse. ============================================================

## Contents

- [`EPSILON`](#epsilon) — Const
- [`Symbol`](#symbol) — Type
- [`DFA`](#dfa) — Interface
- [`NFA`](#nfa) — Interface
- [`Regex`](#regex) — Type
- [`PDATransition`](#pdatransition) — Interface
- [`PDA`](#pda) — Interface

## `EPSILON`

> Const · `reasoning/automata/types.ts:26`

```ts
const EPSILON
```


## `Symbol`

> Type · `reasoning/automata/types.ts:28`

```ts
export type Symbol = string;
```


## `DFA`

> Interface · `reasoning/automata/types.ts:32`

```ts
export interface DFA
```


## `NFA`

> Interface · `reasoning/automata/types.ts:44`

```ts
export interface NFA
```


## `Regex`

> Type · `reasoning/automata/types.ts:57`

```ts
export type Regex = | { kind: 'empty' } // ∅ | { kind: 'epsilon' } // ε | { kind: 'char'; c: Symbol } | { kind: 'concat'; left: Regex; right: Regex } | { kind: 'union'; left: Regex; right: Regex } | { kind: 'star'; arg: Regex } | { kind: 'plus'; arg: Regex } | { kind: 'optional'; arg: Regex };
```


## `PDATransition`

> Interface · `reasoning/automata/types.ts:69`

```ts
export interface PDATransition
```


## `PDA`

> Interface · `reasoning/automata/types.ts:82`

```ts
export interface PDA
```

