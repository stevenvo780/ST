# ST Language Documentation (v0.3.0)

This document provides a detailed overview of the ST language syntax, its logical profiles, the Text Layer system, and the programmatic API.

---

## 1. Language Syntax

ST is a declarative language for logic. Every script starts with a `logic` declaration.

### Declarations

- **Logic Profile**: `logic <profile_name>`
  - Example: `logic classical.propositional`
- **Axioms**: `axiom <name> : <formula>` or `axiom <name> = <formula>`
  - Axioms are assumed to be true.
- **Theorems**: `theorem <name> : <formula>`
  - Theorems are logical consequences you intend to keep in your theory.

### Commands

- **Derive**: `derive <goal> from {<premise1>, <premise2>, ...}`
  - Attempts to prove the goal from the listed premises using the active profile's engine.
- **Check Valid**: `check valid <formula>`
  - Checks if the formula is a tautology/valid in the current logic.
- **Check Satisfiable**: `check satisfiable <formula>`
  - Checks if there exists at least one model where the formula is true.
- **Check Equivalent**: `check equivalent <formula1>, <formula2>`
  - Checks if two formulas are logically equivalent.
- **Prove**: `prove <goal> from {<axioms>}`
  - Similar to derive, but specifically checks if the goal follows from the registered theory.
- **Countermodel**: `countermodel <formula>`
  - If a formula is invalid, attempts to find and display a model that falsifies it.
- **Truth Table**: `truth_table <formula>`
  - Generates a markdown-formatted truth table (limited to 20 variables).

---

## 2. Logical Profiles

ST supports multiple logic systems. You can list them via `st --list-profiles`.

### `classical.propositional`
Standard classical propositional logic.
- **Operators**: `&` (and), `|` (or), `!` (not), `->` (implies), `<->` (iff).
- **Engine**: Truth Tables and systematic Tableau.

### `classical.first_order`
Classical First-Order Logic (FOL).
- **Quantifiers**: `forall x <formula>`, `exists x <formula>`.
- **Predicates**: `P(x, y)`.
- **Engine**: Systematic Tableau (Note: Semi-decidable, limited to 50 steps).

### `modal.k`
Basic Normal Modal Logic (System K).
- **Operators**: `[]` (Necessity/Box), `<>` (Possibility/Diamond).
- **Engine**: Kripke-style Tableau.

### `paraconsistent.belnap`
Belnap-Dunn 4-valued logic. Handles inconsistency and gaps (True, False, Both, None).

---

## 3. The Text Layer

The Text Layer allows you to link logical formalisms to natural language documents.

### Concept
1. **Passage**: Define a reference to a document anchor.
   ```st
   let p1 = passage([[contract.md#clause-1]])
   ```
2. **Formalization**: Map a passage to a logical formula.
   ```st
   let f1 = formalize p1 as (P & Q)
   ```
3. **Claim**: Declare a logical claim that can be verified.
   ```st
   claim c1 = f1
   ```
4. **Verification**: Use claims in standard commands.
   ```st
   derive R from {c1}
   ```

### Metadata
- **Support**: `support c1 <- source_name`
- **Confidence**: `confidence c1 = 0.85`
- **Context**: `context c1 = "Refers to the privacy policy"`

---

## 4. Programmatic API

The `@stevenvo780/st-lang` package exports several high-level functions for integration.

### `evaluate(source: string): STEvalResult`
Executes a full script and returns structured results, including truth tables, proofs, and models.

### `createInterpreter(): STInterpreter`
Creates a stateful instance that remembers axioms and state between `exec()` calls. Ideal for REPLs or interactive editors.

### `ProtocolHandler`
Implements a JSON-RPC-like protocol for editor features:
- `hover`: Get formula details at a specific cursor position.
- `symbols`: List all defined axioms/claims.
- `goto_definition`: Find where a symbol was defined.

---

## 5. Limitations

For specific technical limitations regarding the automated solvers (such as the 20-variable limit or Modal K closure issues), please refer to [LOGIC_LIMITATIONS.md](./LOGIC_LIMITATIONS.md).
