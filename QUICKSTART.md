# ST Quickstart (v1.6.0)

Bienvenido a la versión más potente de **ST**. Aquí tienes un resumen de las capacidades clave introducidas recientemente.

## 1. Operadores Nativa (Teclado-Friendly)
Ya no necesitas símbolos complejos. ST soporta operadores modernos:

- **XOR**: `A ^ B` o `A xor B` (Símbolo: `⊕`)
- **NAND**: `A !& B` o `A nand B` (Símbolo: `↑`)
- **NOR**: `A !| B` o `A nor B` (Símbolo: `↓`)

```st
logic classical.propositional
check valid (A ^ B) <-> ((A | B) & !(A & B))
```

## 2. Programación Orientada a Objetos (POO)
Las teorías ahora son "Clases" que puedes instanciar.

```st
theory Agente(id, creencia) {
  let nombre = id
  axiom p = creencia
  
  fn saludar() {
    print "Soy " + nombre
  }
}

let a1 = Agente("Socrates", P)
a1.saludar()
check valid a1.p
```

## 3. Módulos con Encapsulamiento
Controla qué compartes usando `export`.

```st
// math_logic.st
export let Identidad = P -> P
let Interno = Q & !Q // No se exporta

// main.st
import "math_logic.st"
print Identidad // Funciona
```

## 4. Funciones como Expresiones
Usa funciones directamente dentro de tus fórmulas.

```st
fn combinar(x, y) {
  return x & y
}

let FormulaCompleja = combinar(P, Q) | !R
```

## 5. Mejoras en el Editor
- **Hover enriquecido**: Pasa el ratón sobre cualquier variable, axioma o keyword para ver su definición y documentación.
- **Autocompletado inteligente**: Sugerencias para todos los perfiles lógicos, operadores y estructuras de control.
- **Snippets**: Escribe `theory` o `fn` y presiona Tab para generar la estructura completa.

---
Para más detalles, consulta el manual completo en [DOCS.md](./DOCS.md).
