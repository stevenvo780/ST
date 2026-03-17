# ST Logic Engine — Conocidas Limitaciones (v0.3.0)

## 1. Axioma K en Lógica Modal (modal.k)

### Problema
El motor de Tableau sistemático implementado en la v2 tiene dificultades para cerrar el **Axioma K**: `[](P -> Q) -> ([]P -> []Q)`.

### Causa Técnica
Tras la Normalización de Negación (NNF), la fórmula se convierte en:
`[](!P | Q) & []P & <>!Q`

El algoritmo de Tableau actual:
1. Crea un mundo $w_1$ con `!Q` vía la regla Delta (<>).
2. Debe instanciar las reglas Gamma ([]) `!P | Q` y `P` en ese mundo $w_1$.
3. La contradicción se encuentra al derivar `Q` de `!P | Q` y `P`.

En la implementación actual, la **saturación Gamma** es extremadamente sensible al orden de los nodos en la pila. Si las reglas Gamma se consideran "procesadas" antes de que la regla Delta genere todos los mundos posibles, el tableau puede cerrarse prematuramente o no encontrar el cierre en el límite de profundidad establecido (50-100 pasos).

### Resolución para v0.4.0 (Roadmap)
Implementar **Tableau de Prefijos (Labeled Tableau)** o un **Grafo de Mundos Persistente** donde las reglas Gamma se registren como "observadores" de nuevos mundos, garantizando la instanciación automática sin depender del orden de la pila de nodos.

## 2. Indecidibilidad en Primer Orden (classical.first_order)

Como es estándar en FOL, el motor puede no terminar o devolver `unknown` si la fórmula no es válida, debido a que el espacio de constantes puede crecer indefinidamente. Se ha establecido un límite de seguridad de 50 pasos de saturación.
