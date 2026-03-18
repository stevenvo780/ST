# ST Language Documentation (v1.5.8)

Esta guía documenta el lenguaje **ST** de manera completa y práctica: sintaxis, perfiles lógicos, scripting, Text Layer, CLI, API y patrones de uso pedagógicos.

---

## 1. Modelo mental de ST

ST no es solo un lenguaje de fórmulas. Es la combinación de tres capas:

1. **Lógica formal**: axiomas, teoremas, derivaciones, satisfacibilidad, contramodelos.
2. **Scripting ejecutable**: variables, mutación controlada, condicionales, loops, funciones, módulos.
3. **Formalización documental**: pasajes, claims, soporte, confianza y contexto.

En la práctica, un archivo `.st` puede servir como:

- cuaderno de lógica
- verificador de argumentos
- especificación ejecutable
- puente entre texto humano y formalización
- laboratorio pedagógico para enseñar inferencias paso a paso

---

## 2. Estructura mínima de un script

Todo script útil empieza con un perfil lógico:

```st
logic classical.propositional
```

Luego puedes mezclar declaraciones y comandos:

```st
logic classical.propositional

axiom a1 : P -> Q
axiom a2 : P

derive Q from {a1, a2}
check valid (P | !P)
```

---

## 3. Statements principales

### 3.1 `logic`

Selecciona el perfil activo.

```st
logic classical.propositional
logic modal.k
logic arithmetic
```

Si un script usa comandos lógicos antes de declarar `logic`, el runtime falla con error.

---

### 3.2 `axiom`

Declara una fórmula asumida como parte de la teoría activa.

```st
axiom a1 : P -> Q
axiom base = P
```

Notas:

- Acepta `:` o `=`.
- Se almacena en `theory.axioms`.
- Puede referenciar variables definidas con `let`.

---

### 3.3 `theorem`

Registra una fórmula como teorema nombrado dentro de la teoría.

```st
theorem reflexividad : (P -> P)
```

Importante: declarar un `theorem` no ejecuta automáticamente una prueba; lo registra como miembro semántico de la teoría.

---

### 3.4 `derive`

Pide derivar una meta a partir de un conjunto explícito de premisas por nombre.

```st
derive Q from {a1, a2}
```

Uso recomendado:

- cuando quieres una derivación local y clara
- cuando quieres mostrar el origen exacto de una conclusión

---

### 3.5 `prove`

Pide probar una meta desde la teoría cargada.

```st
prove (P -> P)
```

`prove` usa el perfil activo y la teoría acumulada, no una lista explícita de premisas escrita en esa línea.

---

### 3.6 `check`

#### `check valid`

```st
check valid (P | !P)
```

Determina si la fórmula es válida en el perfil actual.

#### `check satisfiable`

```st
check satisfiable (P & Q)
```

Determina si existe al menos un modelo que la satisfaga.

#### `check equivalent`

```st
check equivalent (!(P & Q)), (!P | !Q)
```

Compara equivalencia lógica entre dos fórmulas.

---

### 3.7 `countermodel`

Busca un modelo que falsifique la fórmula.

```st
countermodel (P -> Q)
```

Muy útil para docencia, depuración de teoría y explicación de por qué algo no es válido.

---

### 3.8 `truth_table`

Construye tabla de verdad cuando el perfil lo soporta.

```st
truth_table (P -> Q)
```

Especialmente útil en `classical.propositional`.

---

### 3.9 `analyze`

Evalúa una inferencia completa: premisas y conclusión.

```st
analyze {P, P -> Q} -> Q
analyze {P} -> Q
```

Qué hace:

1. resuelve variables y aliases
2. intenta reconocer falacias conocidas
3. si no detecta falacias, comprueba si la inferencia es válida
4. produce salida pedagógica del tipo `VÁLIDA`, `NO VÁLIDA` o advertencias con patrón de falacia

Falacias detectadas actualmente por el sistema de análisis:

- afirmación del consecuente
- negación del antecedente
- medio no distribuido

---

### 3.10 `explain`

Explica una fórmula dentro del perfil activo.

```st
explain (P & !P)
explain [](P -> P)
explain 2 + 3 * 4
```

Es una de las herramientas más útiles para escenarios educativos:

- da contexto semántico
- describe el tipo de estructura
- en aritmética muestra resultados concretos
- en perfiles modales y afines refleja el perfil activo

---

### 3.11 `render`

Renderiza partes del estado actual.

```st
render theory
render claims
render c1
render a1
```

Casos habituales:

- inspeccionar qué axiomas quedaron cargados
- revisar claims y su metadato
- documentar el estado de una sesión o script

---

## 4. Variables, alias y scripting

La gran expansión reciente de ST está en esta capa. Ahora el lenguaje no es solo declarativo; también permite estructurar guiones lógicos paso a paso.

---

### 4.1 `let`

`let` tiene varios usos distintos.

#### a) Alias de fórmula

```st
let regla = P -> Q
let hecho = P
derive Q from {regla, hecho}
```

Comportamiento importante:

- guarda el binding en memoria
- resuelve referencias anidadas
- registra el alias también como axioma implícito para derivaciones y pruebas

#### b) Descripción semántica sin fórmula

```st
let P = "Llueve"
```

Esto sirve para enriquecer la interpretación humana del átomo.

#### c) Descripción + fórmula

```st
let causa = "Si llueve, la calle se moja" : (L -> M)
```

Útil para docencia y salidas más legibles.

#### d) Pasaje documental

```st
let p = passage([[documento.md#seccion-2]])
```

#### e) Formalización de un pasaje

```st
let f = formalize p as (P -> Q)
```

---

### 4.2 `set`

Reasigna una variable lógica.

```st
set estado = P
set estado = P & !P
```

`set` actualiza:

- el binding de la variable
- el axioma correspondiente dentro de la teoría activa

Esto permite usar la variable reasignada en `while`, `if`, `derive` y demás comandos.

---

### 4.3 `print`

Imprime texto o una fórmula resuelta.

```st
print "inicio"
print regla
print (P -> Q)
```

Es especialmente útil para:

- enseñar paso a paso
- depurar scripts
- narrar la lógica que un ejemplo está ejecutando

---

## 5. Control de flujo lógico

---

### 5.1 `if`

Sintaxis general:

```st
if valid FORMULA {
  ...
} else if satisfiable OTRA {
  ...
} else {
  ...
}
```

Condiciones soportadas:

- `valid`
- `invalid`
- `satisfiable`
- `unsatisfiable`

Ejemplos:

```st
if valid (P | !P) {
  print "tautología"
}

if invalid P {
  print "P no es tautología"
} else {
  print "caso inesperado"
}
```

Qué evalúa cada variante:

- `valid`: la fórmula debe salir válida
- `invalid`: todo lo que no sea válido
- `satisfiable`: acepta fórmulas satisfacibles o válidas
- `unsatisfiable`: exige contradicción o insatisfacibilidad

---

### 5.2 `for`

Recorre una colección literal de fórmulas.

```st
for F in { P, Q, (R -> R) } {
  print F
}
```

Detalles de runtime:

- cada iteración liga el nombre de la variable al item actual
- al terminar, el binding previo se restaura

Eso vuelve a `for` seguro para experimentos pedagógicos.

---

### 5.3 `while`

Reevalúa una condición lógica en cada ciclo.

```st
set cond = P

while satisfiable cond {
  print "una vuelta"
  set cond = P & !P
}
```

ST protege el runtime con un límite de seguridad de `1000` iteraciones. Si lo alcanzas, emite una advertencia.

Usos típicos:

- simulaciones didácticas cortas
- demostraciones iterativas
- scripts que mutan un estado lógico de forma controlada

---

## 6. Funciones

Las funciones permiten empaquetar secuencias reutilizables de pasos lógicos.

### Declaración

```st
fn verificar(X) {
  check valid X
}
```

### Llamada

```st
verificar((P | !P))
```

### Múltiples parámetros

```st
fn mostrar(A, B) {
  print A
  print B
}

mostrar(P, Q)
```

### `return`

```st
fn crear() {
  print "antes"
  return P & Q
  print "después"
}

crear()
```

Semántica actual de funciones:

1. los argumentos se resuelven antes de entrar
2. el cuerpo puede ejecutar cualquier statement soportado
3. `return` detiene inmediatamente el cuerpo
4. el runtime restaura los bindings previos al salir
5. por ahora las funciones se invocan como statement; no se incrustan dentro de fórmulas como si fueran expresiones

Errores controlados:

- llamar una función no declarada
- pasar cantidad incorrecta de argumentos

---

## 7. Proof blocks

ST soporta bloques de prueba estructurada con `assume`, `show` y `qed`.

```st
assume h1 : P -> Q
assume h2 : P
show Q
derive Q from {h1, h2}
qed
```

Comportamiento:

1. las `assume` se agregan como axiomas temporales
2. se ejecuta el cuerpo del bloque
3. el runtime verifica si la meta `show` se deriva realmente
4. si la prueba cierra, registra un teorema interno del tipo implicación de hipótesis hacia meta
5. al salir, restaura el estado previo

Es ideal para materiales docentes y demostraciones explicadas.

---

## 8. Teorías, encapsulación y herencia

Las `theory` agrupan conocimiento lógico con aislamiento de scope.

```st
theory Base {
  let alias = P -> Q
  private let secreto = R & S
  axiom regla : P -> Q
}

theory Extendida extends Base {
  theorem cierre : P -> Q
}

print Base.alias
print Extendida.regla
```

### Capacidades

- **encapsulación**: miembros internos no contaminan el scope global
- **privacidad**: `private` bloquea acceso externo por notación con punto
- **herencia**: `extends` copia miembros públicos del padre
- **acceso calificado**: `Teoria.miembro`

### Notas importantes

- los miembros privados siguen siendo accesibles dentro de su propia teoría
- si una teoría hija extiende una inexistente, el runtime falla

---

## 9. Importación de archivos

```st
import "utils.st"
import biblioteca
```

Comportamiento:

- si no hay extensión, ST agrega `.st`
- la ruta relativa se resuelve respecto al archivo actual
- hay protección contra imports circulares ya cargados

Esto permite separar librerías, bloques pedagógicos o módulos temáticos.

---

## 10. Text Layer

El Text Layer conecta documentos y lógica formal.

### Flujo completo

#### 1) Declara un pasaje

```st
let p = passage([[clase-logica.md#b8]])
```

#### 2) Formalízalo

```st
let phi = formalize p as (P -> Q)
```

#### 3) Registra un claim

```st
claim c1 = phi
```

#### 4) Agrega metadatos

```st
support c1 <- p
confidence c1 = 0.84
context c1 = "Lectura conservadora del pasaje"
```

#### 5) Renderiza o razona

```st
render claims
```

### Qué resuelve esta capa

- trazabilidad documental
- formalización auditables
- puentes entre lenguaje natural y verificación lógica
- explicaciones mejor contextualizadas

---

## 11. Perfiles lógicos soportados

### 11.1 `classical.propositional`

Lógica proposicional clásica estándar.

Operadores:

- `!`
- `&`
- `|`
- `->`
- `<->`

Ideal para:

- cursos introductorios
- tablas de verdad
- derivaciones básicas
- análisis de argumentos

---

### 11.2 `classical.first_order`

Lógica de primer orden.

Operadores y construcciones:

- `forall x ...`
- `exists x ...`
- predicados: `Humano(x)`
- igualdad: `x = y`

Ejemplo:

```st
logic classical.first_order
check valid (forall x (Humano(x) -> Humano(x)))
```

---

### 11.3 `modal.k`

Lógica modal básica con:

- `[]` necesidad
- `<>` posibilidad

Ejemplo:

```st
logic modal.k
explain [](P -> P)
```

---

### 11.4 `paraconsistent.belnap`

Lógica paraconsistente de Belnap-Dunn.

Útil cuando quieres trabajar con inconsistencia sin colapso explosivo.

---

### 11.5 `deontic.standard`

Para razonar sobre obligación, permiso o normatividad usando operadores modales dentro del perfil deóntico.

---

### 11.6 `epistemic.s5`

Perfil epistémico para razonamiento sobre conocimiento y accesibilidad epistémica.

---

### 11.7 `aristotelian.syllogistic`

Perfil orientado a razonamiento silogístico aristotélico.

---

### 11.8 `intuitionistic.propositional`

Lógica intuicionista proposicional.

Útil cuando no quieres asumir automáticamente principios clásicos como tercero excluido.

---

### 11.9 `temporal.ltl`

Soporta construcciones temporales como:

- `next P`
- `P until Q`

Ejemplo:

```st
logic temporal.ltl
axiom a1 : next P
axiom a2 : P until Q
```

También acepta alias en español:

- `siguiente`
- `hasta`

---

### 11.10 `probabilistic.basic`

Perfil destinado a razonamiento probabilístico básico.

---

### 11.11 `arithmetic`

Convierte a ST en un mini-lenguaje aritmético explicable.

Operadores:

- `+`
- `-`
- `*`
- `/`
- `%`
- `<`
- `>`
- `<=`
- `>=`

Ejemplos:

```st
logic arithmetic
check valid 2 + 3 < 10
explain 2 + 3 * 4
countermodel 5 < 3
```

El perfil aritmético también se beneficia de `if`, `for`, `while`, `fn`, `let` y `set`.

---

## 12. Operadores y precedencia

### 12.1 Proposicional

Precedencia de menor a mayor:

1. `<->`
2. `->`
3. `|`
4. `&`
5. `!` y átomos

Ejemplos:

```st
P -> Q -> R
P & Q | R
!(P & Q)
```

### 12.2 Aritmética

Precedencia destacada:

1. comparaciones `<`, `>`, `<=`, `>=`
2. suma / resta
3. multiplicación / división / módulo
4. paréntesis para forzar agrupación

Ejemplos:

```st
2 + 3 * 4
(2 + 3) * 4
2 + 3 < 10
```

---

## 13. Alias en español

ST es bilingüe a nivel de lexer.

Ejemplos válidos:

```st
logica classical.propositional
axioma A1 : P -> Q
derivar Q desde {A1, A2}
verificar valido (P -> P)
verificar satisfacible P
contramodelo P
tabla_verdad (P -> Q)
analizar {P, P -> Q} -> Q
explicar (P -> P)
```

Alias destacados:

- `logica`
- `axioma`
- `teorema`
- `derivar`
- `desde`
- `verificar`
- `valido`
- `satisfacible`
- `contramodelo`
- `tabla_verdad`
- `analizar`
- `explicar`
- `importar`
- `teoria`
- `privado`
- `si`
- `sino`
- `para`
- `mientras`
- `funcion`
- `retornar`

---

## 14. CLI

### Ejecutar un archivo

```bash
st run archivo.st
```

### Compatibilidad legacy

```bash
st archivo.st
```

### Verificar un archivo

```bash
st check archivo.st
```

Si el archivo no tiene errores sintácticos, la CLI también muestra advertencias o resultados negativos relevantes.

### Escribir diagnósticos JSON

```bash
st run archivo.st --diagnostics
```

### REPL

```bash
st repl
```

### Evaluación rápida

```bash
st eval "check valid (P -> P)"
```

Si la expresión no comienza por `logic ...`, la CLI asume `logic classical.propositional`.

### Ver perfiles disponibles

```bash
st profiles
```

### Modo protocolo para editores

```bash
st protocol
```

---

## 15. API programática

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

### Cuándo usar `evaluate`

- para procesamiento stateless
- para correr un script completo de una vez

### Cuándo usar `createInterpreter`

- para REPLs
- para editores
- para sesiones interactivas con memoria

---

## 16. Integración con editor y protocolo

El `ProtocolHandler` permite capacidades tipo editor/LSP:

- diagnóstico
- hover
- símbolos
- go to definition
- render de salida estructurada
- snippets y completions desde la extensión VS Code

La extensión oficial vive en `editors/vscode-st`.

---

## 17. Ejemplos recomendados del repositorio

### `demo.st`

Ideal para el núcleo lógico básico.

### `programming-control-flow.st`

Muestra:

- `print`
- `let`
- `if`
- `for`
- `while`
- `fn`

### `guided-language-tour.st`

Recorrido pedagógico, orientado a leer el lenguaje paso a paso.

### `text-layer.st`

Demuestra formalización documental.

### `theory-showcase.st`

Demuestra teoría, encapsulación y herencia.

### `arithmetic-programming.st`

Demuestra el perfil aritmético junto con scripting.

---

## 18. Buenas prácticas

### Para enseñar lógica

- usa `print` para narrar el script
- usa `let` con descripciones textuales
- usa `analyze` antes de `derive` cuando quieras explicar por qué una inferencia vale
- usa `countermodel` para mostrar errores de intuición

### Para organizar proyectos

- separa módulos con `import`
- agrupa conocimiento con `theory`
- usa `private` para encapsular reglas auxiliares

### Para scripting seguro

- usa `while` solo con condiciones que cambien vía `set`
- mantén funciones pequeñas y explícitas
- recuerda que `return` corta ejecución pero aún no produce valores embebibles en expresiones

---

## 19. Limitaciones y notas de precisión

- La madurez varía por perfil; `classical.propositional` es el flujo más completo y probado.
- `truth_table` depende del perfil.
- `check equivalent` depende de que el perfil lo implemente.
- Las funciones hoy son statements reutilizables; no son todavía expresiones de primer orden dentro del parser.
- `while` tiene límite de seguridad para evitar loops infinitos.

---

## 20. Receta pedagógica sugerida

Si quieres enseñar o documentar ST paso a paso, este orden funciona muy bien:

1. `logic`
2. `let` y `print`
3. `check valid` / `check satisfiable`
4. `derive`
5. `countermodel`
6. `analyze`
7. `explain`
8. `if`, `for`, `while`
9. `fn`
10. `theory`
11. `Text Layer`

Así el estudiante o lector pasa de lógica básica a scripting explicativo sin saltos bruscos.
