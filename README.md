# ST — Symbolic Theory Language

<p align="center">
  <img src="https://raw.githubusercontent.com/stevenvo780/ST/main/logo.png" alt="ST Logo" width="200" style="border-radius: 50%"/>
</p>

**ST** is a high-performance, modular logical environment and executable language. It is designed for formalizing, verifying, and exploring logical theories across multiple systems (Classical, Modal, Paraconsistent), bridging the gap between natural language documents and formal logic via its unique **Text Layer**.

[![Version](https://img.shields.io/badge/version-1.5.1-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

---

## 📥 Direct Downloads (Linux)

Install the interpreter directly on your Linux distribution using our pre-compiled packages:

| Distribution | Package | Command |
|--------------|---------|---------|
| **Debian / Ubuntu** | [⬇️ .deb](https://github.com/stevenvo780/ST/releases/latest/download/st-lang_1.5.1_amd64.deb) | `sudo dpkg -i st-lang_*.deb` |
| **Fedora / RHEL** | [⬇️ .rpm](https://github.com/stevenvo780/ST/releases/latest/download/st-lang-1.5.1-1.x86_64.rpm) | `sudo rpm -i st-lang-*.rpm` |
| **Generic Linux** | [⬇️ Binary](https://github.com/stevenvo780/ST/releases/latest/download/st) | `chmod +x st && sudo mv st /usr/local/bin/` |

---

## 🚀 Key Features

- **🛡️ Multi-Logic Support**: Pluggable profiles for Classical Propositional, First-Order, Modal (K), and Paraconsistent (Belnap) logic.
- **🤖 Automated Reasoning**: Built-in engines for automated derivations, truth tables, and countermodel generation.
- **📝 Text Layer**: Map logical claims directly to document anchors (e.g., `file.md#heading`), enabling formal verification of "live" documents.
- **💻 Interactive REPL**: A powerful CLI to explore theories in real-time with syntax highlighting and autocompletion.
- **🔌 Programmatic API**: Full TypeScript/JavaScript support to integrate logical verification into your own applications.
- **🛠️ Editor Integration**: Protocol-ready for high-level features like hover, go-to-definition, and symbols.

## 📦 Alternative Installation

### Using NPM (Cross-platform)
```bash
npm install -g @stevenvo780/st-lang
```

### From Source
```bash
git clone https://github.com/stevenvo780/ST.git
cd ST
npm install
npm run build
npm link
```

## 🛠️ Quick Start (CLI)

1. Create a file named `theory.st`:

```st
logic classical.propositional

// Define axioms
axiom a1 : P -> Q
axiom a2 : P

// Perform logical operations
derive Q from {a1, a2}
check valid (P | !P)
```

2. Run it:

```bash
st theory.st
```

3. Or enter the **REPL**:

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

ST is built with a modular compiler architecture specialized for symbolic logic:

1. **Lexer/Parser**: Consumes `.st` scripts into a typed AST.
2. **Interpreter**: Manages the **Theory** (axioms, theorems, claims) and executes statements.
3. **Logic Profiles**: Pluggable engines that implement the `LogicProfile` interface. Each profile provides its own solvers (Tableau, Truth Tables, etc.).
4. **Text Layer State**: Tracks references to external documents and maps them to logical formulas.

## 📚 Documentation

Detailed documentation is available in the following files:
- [Language Syntax & Logic Profiles](./DOCS.md)
- [Text Layer Philosophy](./src/tests/philosophy.test.ts)
- [Logic Solver Limitations](./LOGIC_LIMITATIONS.md)

---

## 📄 License

MIT © [Steven Velez](https://github.com/stevenvo780) | Developed by [Humanizar](https://github.com/humanizar)
