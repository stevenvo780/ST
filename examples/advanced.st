// ST — Ejemplo completo de lógica proposicional avanzada

logic classical.propositional

// === Leyes fundamentales ===

// Ley de identidad
check valid (P -> P)

// Tercero excluido
check valid (P | !P)

// No contradicción
check valid !(P & !P)

// Doble negación
check valid (P <-> !!P)

// === De Morgan ===
check equivalent (!(P & Q)), (!P | !Q)
check equivalent (!(P | Q)), (!P & !Q)

// === Distributividad ===
check equivalent (P & (Q | R)), ((P & Q) | (P & R))
check equivalent (P | (Q & R)), ((P | Q) & (P | R))

// === Implicación material ===
check equivalent (P -> Q), (!P | Q)

// === Modus Ponens encadenado ===
axiom h1 = A -> B
axiom h2 = B -> C
axiom h3 = C -> D
axiom h4 = A

derive D from {h1, h2, h3, h4}

// === Tabla de verdad completa ===
truth_table ((P -> Q) & (Q -> R) -> (P -> R))
