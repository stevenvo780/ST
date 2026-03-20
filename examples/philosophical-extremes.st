// ============================================================
// ST Extreme Philosophy — Desafiando la Coherencia Lógica
// ============================================================
// Este archivo no busca saturar la memoria, sino poner a prueba
// la capacidad analítica del lenguaje frente a paradojas reales.
// ============================================================

print "=== DESAFÍO 1: La Paradoja de Moore (Epistémica) ==="
logic epistemic.s5
// "Llueve, pero no sé que llueve"
let moore = P & !K(P)
print "Analizando: P & !K(P)"
check satisfiable moore
countermodel moore // Debería mostrarnos un mundo donde P es real pero no conocido

print "\n=== DESAFÍO 2: Russell y la Autoreferencia (FOL) ==="
logic classical.first_order
// Intentando definir el conjunto de todos los conjuntos que no se contienen a sí mismos
// R(x) <-> !Member(x, x)
// Si existe un y tal que R(y), entonces R(y) <-> !Member(y, y).
// Pero si R es Member, entonces Member(y, y) <-> !Member(y, y) -> CONTRADICCIÓN.
axiom barber = forall x (Shaves(barber, x) <-> !Shaves(x, x))
print "Probando la existencia del barbero de Russell..."
check satisfiable forall x (Shaves(barber, x) <-> !Shaves(x, x))
// El motor debería detectar que esto es INSATISFACIBLE (Contradicción estructural)

print "\n=== DESAFÍO 3: El Colapso de la Obligación (Deóntica) ==="
logic deontic.standard
// Conflictos de obligaciones (Dilemas Morales)
axiom d1 = O(A)  // Es obligatorio hacer A
axiom d2 = O(!A) // Es obligatorio no hacer A
print "Analizando dilema moral insoluble: O(A) & O(!A)"
check satisfiable (O(A) & O(!A))
// En SDL estándar, esto debería ser insatisfacible porque []P & []!P cierra el tableau (Serialidad)

print "\n=== DESAFÍO 4: Inmunidad a la Explosión (Paraconsistente) ==="
// En lógica clásica, P & !P -> Q es válido (Ex Falso Quodlibet)
// En Belnap, no debería serlo.
logic classical.propositional
print "[Clásica] ¿De la contradicción sigue cualquier cosa?"
check valid (P & !P) -> Q

logic paraconsistent.belnap
print "[Belnap] ¿De la contradicción sigue cualquier cosa?"
check valid (P & !P) -> Q
// Belnap debería decir que NO es válida, protegiendo al sistema de la explosión.

print "\n=== DESAFÍO 5: La Omnisciencia Lógica ==="
logic epistemic.s5
// Si sé que (P -> Q) y sé que P, ¿sé que Q?
// Esto es un límite del realismo de la lógica epistémica.
print "Probando clausura bajo implicación conocida..."
check valid (K(P -> Q) & K(P)) -> K(Q)

print "\n=== TEST FILOSÓFICO FINALIZADO ==="
