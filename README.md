# ST — Symbolic Theory Language

**ST** is a modular logical environment and executable language designed for formalizing, verifying, and exploring logical theories across multiple systems (Classical, Modal, Paraconsistent). It features a unique **Text Layer** that bridges natural language documents with formal logical claims.

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Key Features

- **Multi-Logic Support**: Pluggable profiles for Classical Propositional, First-Order, Modal (K), and Paraconsistent (Belnap) logic.
- **Automated Reasoning**: Built-in engines for automated derivations, truth tables, and countermodel generation.
- **Text Layer**: Map logical claims directly to document anchors (e.g., `file.md#heading`), enabling formal verification of "live" documents.
- **Interactive REPL**: A powerful CLI to explore theories in real-time.
- **Programmatic API**: Full TypeScript/JavaScript support to integrate logical verification into your own applications.
- **Editor Integration**: Protocol-ready for high-level features like hover, go-to-definition, and symbols.

## 📦 Installation

```bash
npm install -g @stevenvo780/st-lang
```

## 🛠️ Quick Start (CLI)

Create a file named `demo.st`:

```st
logic classical.propositional

axiom a1 : P -> Q
axiom a2 : P

derive Q from {a1, a2}
check valid (P | !P)
```

Run it:

```bash
st demo.st
```

Or enter the REPL:

```bash
st
```

## 💻 Programmatic API

```typescript
import { evaluate, createInterpreter } from '@stevenvo780/st-lang/api';

// Stateless evaluation
const result = evaluate(`
  logic classical.propositional
  check valid (A -> (B -> A))
`);
console.log(result.results[0].status); // 'valid'

// Stateful interpreter
const st = createInterpreter();
st.exec('logic classical.propositional');
st.exec('axiom a1 : P -> Q');
const r = st.exec('check satisfiable a1');
console.log(r.ok); // true
```

## 🏗️ Architecture

ST is built with a traditional compiler architecture but specialized for logic:

1. **Lexer/Parser**: Consumes `.st` scripts into a typed AST.
2. **Interpreter**: Manages the **Theory** (axioms, theorems, claims) and executes statements.
3. **Logic Profiles**: Pluggable engines that implement the `LogicProfile` interface. Each profile provides its own solvers (Tableau, Truth Tables, etc.).
4. **Text Layer State**: Tracks references to external documents and maps them to logical formulas.

## 📚 Documentation

For a deep dive into the language syntax, logic profiles, and the Text Layer, see [DOCS.md](./DOCS.md).

Check [LOGIC_LIMITATIONS.md](./LOGIC_LIMITATIONS.md) for known boundaries of the current solvers.

## 📄 License

MIT © [Steven Velez](https://github.com/stevenvo780)
