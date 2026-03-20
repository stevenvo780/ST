## 🚨 NUEVAS VULNERABILIDADES DESCUBIERTAS (Test de Estrés Extremo)

**Prioridad**: Crítica  
**Riesgo**: Alto (Crash del motor por OOM y Stack Overflow)

Durante las pruebas de estrés, se encontraron tres formas de destruir el intérprete que deben ser parcheadas:

### 1. Ataque Aritmético: OOM por Evaluación Simbólica Perezosa
- **Problema**: El perfil aritmético no reduce `N + 1` a un valor (ej. `2`), sino que construye un árbol AST `add(1, 1)`. En loops y recursiones, esto genera árboles infinitamente grandes `add(add(add...))` hasta causar un `JavaScript heap out of memory`.
- **Solución Propuesta**: Implementar reducción ansiosa (eager evaluation) o plegado de constantes (constant folding) en las asignaciones aritméticas.

### 2. Ataque FOL (Dominio Infinito): Stack Overflow en Tableau
- **Problema**: Evaluar fórmulas de modelo infinito (ej. transitividad irreflexiva + serialidad: `∀x∃y R(x,y)`) provoca que la alternancia de reglas Delta (crear constante) y Gamma (instanciar universalmente) multiplique las ramas exponencialmente. Revienta el límite de la pila de V8 (`Maximum call stack size exceeded`) ANTES de llegar al límite de seguridad `depth > 3000`.
- **Solución Propuesta**: Reducir el límite de seguridad `MAX_DEPTH` del tableau de FOL a un valor conservador (ej. 500) o limitar el número máximo de iteraciones de la regla Gamma.

### 3. Agujero Negro Recursivo (Recursión Silenciosa)
- **Problema**: Las funciones declaradas con `fn` permiten recursión mutua sin límite. Si se fuerza su evaluación, rompen la pila sin arrojar un error semántico manejado por ST.
- **Solución Propuesta**: Inyectar un limitador de profundidad (call-stack limiter) directamente en el método `Interpreter.executeFnCall()`.
