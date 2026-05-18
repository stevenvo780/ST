# ST — Symbolic Theory Language

<p align="center">
  <img src="https://raw.githubusercontent.com/stevenvo780/ST/main/logo.png" alt="ST Logo" width="200" style="border-radius: 50%"/>
</p>

**ST** es un lenguaje ejecutable para lógica, argumentación y formalización documental.
Combina verificación formal, scripting declarativo, control de flujo, funciones, perfiles lógicos múltiples y una **Text Layer** para conectar fórmulas con texto humano real.

[![Version](https://img.shields.io/badge/version-4.14.0-blue.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-6333-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

---

## ¿Qué hace diferente a ST?

- **Lógica ejecutable**: no solo declaras axiomas; también ejecutas verificaciones, derivaciones, análisis y explicaciones.
- **Mini-lenguaje pedagógico**: `let`, `set`, `print`, `if`, `for`, `while`, `fn`, `return`, `theory`, `import`.
- **Múltiples perfiles**: proposicional clásica, primer orden, modal, deóntica, epistémica, intuicionista, temporal, probabilística, aristotélica, paraconsistente y aritmética.
- **Text Layer**: vincula pasajes de documentos con formalizaciones y claims verificables.
- **CLI + API + protocolo**: usable desde terminal, REPL, TypeScript/JavaScript y editores.
- **Alias en español**: el lenguaje acepta tanto sintaxis en inglés como en español.

---

## Instalación

### Descarga directa en Linux

| Distribución | Paquete | Comando |
|--------------|---------|---------|
| **Debian / Ubuntu** | [⬇️ `.deb`](https://github.com/stevenvo780/ST/releases/latest/download/st-lang_3.3.0_amd64.deb) | `sudo dpkg -i st-lang_*.deb` |
| **Fedora / RHEL** | [⬇️ `.rpm`](https://github.com/stevenvo780/ST/releases/latest/download/st-lang-3.3.0-1.x86_64.rpm) | `sudo rpm -i st-lang-*.rpm` |
| **Linux genérico** | [⬇️ binario](https://github.com/stevenvo780/ST/releases/latest/download/st) | `chmod +x st && sudo mv st /usr/local/bin/` |

### Con npm

```bash
npm install @stevenvo780/st-lang@4.14.0
```

### Desde el código fuente

```bash
git clone https://github.com/stevenvo780/ST.git
cd ST
npm install
npm run build
npm link
```

---

## What's new in V4–V5 (4.0 → 4.14.0)

80+ módulos nuevos. 6333 tests (eran 1583 en v3.3).

### Performance & SAT
- CDCL v2 con VSIDS, clause learning y reinicios Luby.
- SAT incremental — reutiliza estado entre consultas.
- MUS (Minimal Unsatisfiable Subsets) para diagnóstico de inconsistencias.
- Cache de derivaciones con memoización y theorem-cache persistente.

### Type theory
- Curry-Howard: pruebas como programas, términos como tipos.
- System F con polimorfismo paramétrico.
- MLTT (Martin-Löf Type Theory) con tipos dependientes.
- NbE (Normalización por Evaluación) para reducción eficiente.
- Refinement types sobre términos base.

### Modal & temporal
- Frame axioms K / T / B / 4 / 5 / D; sistemas S4, S5, KD45 completos.
- CTL (Computation Tree Logic) con operadores EX/AX/EF/AF/EG/AG.
- LTL (Linear Temporal Logic) con next/until/release.
- μ-calculus modal con punto fijo mínimo y máximo.
- Hybrid logic con operadores de nombrado y satisfacción (@).

### Substructural & resource logic
- Lógica lineal y afín (no-contraction, no-weakening).
- π-calculus: razonamiento sobre procesos concurrentes.
- Proof nets: representación canónica de pruebas lineales.

### Non-classical
- Intuicionista NJ (natural deduction intuicionista completa).
- Lógica many-valued (Łukasiewicz, Gödel) y Belnap four-valued.
- Paraconsistente — soporte para contradicciones sin explosión.

### Decision procedures
- FOL con igualdad — resolución para fragmentos decidibles.
- ALC Description Logic (subsumption, instance checking).
- AC-3 CSP — constraint propagation para problemas de satisfacción.
- STRIPS — planificación clásica sobre estados y acciones.

### Probabilistic & uncertainty
- Bayesian reasoning con redes y propagación de evidencia.
- Hyperreal extensions: probabilidad con infinitesimales.
- Fuzzy logic — valores de verdad continuos en [0,1].

### Term mechanics
- TRS + KB (Term Rewriting Systems + Knuth-Bendix completion).
- Anti-unification — lgg (least general generalization) de términos.
- HO-unify (Higher-Order Unification).
- SKI combinators y reducción.
- λ-calculus con α/β/η reducción.

### Integration
- Text Layer v2 con invalidación propagada de claims.
- MDX bridge bidireccional: prosa ↔ ST sincronizados.
- Proof exchange Ed25519: pruebas firmadas y compartibles entre workspaces.
- Time-travel: snapshots ST por commit de workspace.
- Plugin system: perfiles lógicos custom registrables en runtime.

### Knowledge & argumentation
- FCA (Formal Concept Analysis) — retículos de conceptos formales.
- Dung argumentation — grafos de ataque, extensiones admisibles/estables.
- Default logic — inferencia por defecto con excepciones.
- AGM belief revision — cambio de creencias con postulados AGM.
- Abduction — inferencia a la mejor explicación.
- Profile bridge — mapeo semántico entre perfiles lógicos.

---

## Inicio rápido

### 1) Tu primer archivo `theory.st`

```st
logic classical.propositional

let regla = P -> Q
let hecho = P

derive Q from {regla, hecho}
check valid (P | !P)
countermodel (P -> Q)
```

### 2) Ejecútalo

```bash
st theory.st
```

### 3) Revisa perfiles disponibles

```bash
st profiles
```

### 4) Entra al REPL

```bash
st repl
```

---

## Ejemplo paso a paso: variables, `if`, funciones y análisis

```st
logic classical.propositional

print "=== demo guiada ==="

let regla = "Si estudio, apruebo" : (E -> A)
let hecho = "Estudio hoy" : E

derive A from {regla, hecho}
analyze {E, E -> A} -> A
explain (E -> A)

if valid (P | !P) {
  print "tautología detectada"
} else {
  print "esto no debería ocurrir en clásica"
}

for Caso in { P, Q, (R -> R) } {
  print Caso
}

set estado = P
while satisfiable estado {
  print "iteración del while"
  set estado = P & !P
}

fn revisar(X) {
  print "revisando"
  print X
  check satisfiable X
  return X
}

revisar((P -> Q))
```

### Qué muestra este ejemplo

1. `let` define aliases lógicos y además los deja disponibles para derivaciones.
2. `analyze` evalúa si una inferencia es válida y detecta falacias conocidas.
3. `explain` devuelve una explicación del perfil activo sobre la fórmula.
4. `if valid|invalid|satisfiable|unsatisfiable` permite ramificar lógica del script.
5. `for` recorre una lista de fórmulas.
6. `while` reevalúa una condición lógica en cada iteración.
7. `fn` agrupa pasos reutilizables; `return` corta la ejecución del cuerpo.

> Nota: hoy `return` sirve para cortar la función y preservar un valor interno para futuras extensiones, pero las llamadas a función todavía se usan como sentencia, no como expresión anidable.

---

## Sintaxis principal de ST

### Núcleo lógico

```st
logic classical.propositional
axiom a1 : P -> Q
theorem t1 : (P -> P)
derive Q from {a1, a2}
prove (P -> P)
check valid (P | !P)
check satisfiable (P & Q)
check equivalent (!(P & Q)), (!P | !Q)
truth_table (P -> Q)
countermodel (P -> Q)
```

### Variables y scripting

```st
let phi = (P -> Q)
set phi = (Q -> R)
print phi

if satisfiable phi {
  print "hay modelo"
}

for X in {P, Q, R} {
  print X
}

while invalid phi {
  set phi = (P -> P)
}

fn verificar(X) {
  check valid X
}

verificar((P -> P))
```

### Text Layer

```st
let p = passage([[contrato.md#clausula-1]])
let f = formalize p as (P -> Q)
claim c1 = f
support c1 <- p
confidence c1 = 0.92
context c1 = "Interpretación jurídica conservadora"
render claims
```

### Pruebas estructuradas y teorías

```st
assume h1 : P -> Q
assume h2 : P
show Q
derive Q from {h1, h2}
qed

theory Base {
  let alias = P -> Q
  private let secreto = R & S
  axiom regla : P -> Q
}

print Base.alias
```

---

## Alias en español

ST acepta las dos familias de keywords. Ejemplos:

| Inglés | Español |
|--------|---------|
| `logic` | `logica` |
| `axiom` | `axioma` |
| `derive` | `derivar` |
| `from` | `desde` |
| `check valid` | `verificar valido` |
| `check satisfiable` | `verificar satisfacible` |
| `countermodel` | `contramodelo` |
| `truth_table` | `tabla_verdad` |
| `analyze` | `analizar` |
| `explain` | `explicar` |
| `import` | `importar` |
| `theory` | `teoria` |
| `if` | `si` |
| `else` | `sino` |
| `for` | `para` |
| `while` | `mientras` |
| `fn` | `funcion` |
| `return` | `retornar` |

---

## Perfiles incorporados

ST registra automáticamente estos perfiles:

- `classical.propositional`
- `classical.first_order`
- `modal.k`
- `paraconsistent.belnap`
- `deontic.standard`
- `epistemic.s5`
- `aristotelian.syllogistic`
- `intuitionistic.propositional`
- `temporal.ltl`
- `probabilistic.basic`
- `arithmetic`

### Operadores destacados por perfil

- **Proposicional clásica**: `!`, `&`, `|`, `->`, `<->`
- **Primer orden**: `forall`, `exists`, `P(x)`, igualdad `x = y`
- **Modal / deóntica / epistémica**: `[]`, `<>`
- **Temporal**: `next`, `until`
- **Aritmética**: `+`, `-`, `*`, `/`, `%`, `<`, `>`, `<=`, `>=`

---

## Herramientas explicativas nuevas y reforzadas

### `explain`

Explica una fórmula dentro del perfil activo:

```st
logic modal.k
explain [](P -> P)
```

### `analyze`

Evalúa inferencias completas y detecta falacias como:

- afirmación del consecuente
- negación del antecedente
- medio no distribuido

```st
logic classical.propositional
analyze {P, P -> Q} -> Q
analyze {P} -> Q
```

### `render`

Permite inspeccionar el estado acumulado:

```st
render theory
render claims
render c1
```

---

## CLI

### Ejecutar archivo

```bash
st run archivo.st
```

### Ejecutar modo legacy

```bash
st archivo.st
```

### Validar sintaxis y resultados

```bash
st check archivo.st
```

### Guardar diagnósticos JSON

```bash
st run archivo.st --diagnostics
```

### Evaluar una expresión directa

```bash
st eval "check valid (P -> P)"
```

### Protocolo para editores

```bash
st protocol
```

---

## API programática

```typescript
import { evaluate, createInterpreter } from '@stevenvo780/st-lang/api';

const result = evaluate(`
  logic classical.propositional
  let regla = P -> Q
  let hecho = P
  derive Q from {regla, hecho}
`);

console.log(result.results[0].status);

const st = createInterpreter();
st.exec('logic arithmetic');
st.exec('explain 2 + 3 * 4');
```

### Subpaths disponibles

| Subpath | Uso |
|---------|-----|
| `@stevenvo780/st-lang` | Entrypoint principal: `evaluate`, `typeCheck`, `createInterpreter` |
| `@stevenvo780/st-lang/api` | API pura sin CLI: `evaluate`, `createInterpreter` |
| `@stevenvo780/st-lang/types` | Tipos TypeScript exportados (AST, perfiles, resultados) |
| `@stevenvo780/st-lang/protocol` | `ProtocolHandler` para integraciones de editor |

---

## Carpeta `examples/`

El repositorio incluye ejemplos listos para ejecutar:

- `demo.st`: núcleo lógico básico
- `programming-control-flow.st`: `let`, `if`, `for`, `while`, `fn`
- `guided-language-tour.st`: recorrido guiado y pedagógico
- `text-layer.st`: formalización de documentos
- `theory-showcase.st`: encapsulación, herencia y acceso con punto
- `arithmetic-programming.st`: scripting con `logic arithmetic`
- `stress-all-profiles.st`: smoke test amplio

Para ejecutarlos todos:

```bash
npm run examples:run
```

---

## Extensión de VS Code

La extensión oficial en `editors/vscode-st` aporta:

- resaltado sintáctico
- snippets
- símbolos del documento
- hover
- diagnósticos
- autocompletado orientado al lenguaje

---

## Arquitectura

1. **Lexer/Parser**: transforma el script `.st` en AST tipado.
2. **AST Visitors** (`ASTVisitor<T>`, `BaseASTVisitor<T>`): traversal exhaustivo y tipado sobre el AST; reemplaza el parser monolítico de versiones anteriores.
3. **Type Checker** (`typeCheck`): validación estática en runtime antes de la ejecución; 7 reglas (TC001–TC008) con sugerencias Levenshtein.
4. **Interpreter**: ejecuta statements, mantiene teoría, bindings, funciones y Text Layer.
5. **Profiles**: cada perfil implementa derivación, validez, satisfacibilidad, explicación y más.
6. **ProtocolHandler**: expone capacidades para integraciones de editor.

---

## Documentación ampliada

- Guía completa local: [`DOCS.md`](./DOCS.md)
- Documentación web: [agora.elenxos.com/docs#st-lang](https://agora.elenxos.com/docs#st-lang)

---

## Licencia

MIT © [Steven Velez](https://github.com/stevenvo780) | Developed by [Humanizar](https://github.com/humanizar)
