# ST — Symbolic Theory Language

<p align="center">
  <img src="https://raw.githubusercontent.com/stevenvo780/ST/main/logo.png" alt="ST Logo" width="200" style="border-radius: 50%"/>
</p>

**ST** es un lenguaje ejecutable para lógica, argumentación y formalización documental.
Combina verificación formal, scripting declarativo, control de flujo, funciones, perfiles lógicos múltiples y una **Text Layer** para conectar fórmulas con texto humano real.

[![Version](https://img.shields.io/badge/version-1.5.8-blue.svg)](package.json)
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
| **Debian / Ubuntu** | [⬇️ `.deb`](https://github.com/stevenvo780/ST/releases/latest/download/st-lang_1.5.8_amd64.deb) | `sudo dpkg -i st-lang_*.deb` |
| **Fedora / RHEL** | [⬇️ `.rpm`](https://github.com/stevenvo780/ST/releases/latest/download/st-lang-1.5.8-1.x86_64.rpm) | `sudo rpm -i st-lang-*.rpm` |
| **Linux genérico** | [⬇️ binario](https://github.com/stevenvo780/ST/releases/latest/download/st) | `chmod +x st && sudo mv st /usr/local/bin/` |

### Con npm

```bash
npm install -g @stevenvo780/st-lang
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

1. **Lexer/Parser**: transforma el script `.st` en AST.
2. **Interpreter**: ejecuta statements, mantiene teoría, bindings, funciones y Text Layer.
3. **Profiles**: cada perfil implementa derivación, validez, satisfacibilidad, explicación y más.
4. **ProtocolHandler**: expone capacidades para integraciones de editor.

---

## Documentación ampliada

- Guía completa local: [`DOCS.md`](./DOCS.md)
- Documentación web: [agora.humanizar.cloud/docs#st-lang](https://agora.humanizar.cloud/docs#st-lang)

---

## Licencia

MIT © [Steven Velez](https://github.com/stevenvo780) | Developed by [Humanizar](https://github.com/humanizar)
