// ============================================================
// ST — Intuicionismo intensivo
// ============================================================
// La lógica intuicionista rechaza el tercero excluido,
// la doble negación eliminación, y la ley de Peirce.
// ============================================================

logic intuitionistic.propositional

// ═══════════════════════════════════════════════════════════
// VÁLIDO intuicionísticamente
// ═══════════════════════════════════════════════════════════

// Identidad
check valid (P -> P)

// Axioma K
check valid (P -> (Q -> P))

// Axioma S
check valid ((P -> (Q -> R)) -> ((P -> Q) -> (P -> R)))

// Contrapositiva (dirección constructiva)
check valid ((P -> Q) -> (!Q -> !P))

// Ex falso quodlibet
check valid ((P & !P) -> Q)

// Doble negación introducción
check valid (P -> !!P)

// De Morgan parcial (⊃ dirección)
check valid (!(P | Q) -> (!P & !Q))

// Conjunción intro/elim
check valid ((P & Q) -> P)
check valid ((P & Q) -> Q)

// Disyunción intro
check valid (P -> (P | Q))
check valid (Q -> (P | Q))

// Transitividad de implicación
check valid (((P -> Q) & (Q -> R)) -> (P -> R))

// Modus tollens
check valid (((P -> Q) & !Q) -> !P)

// ═══════════════════════════════════════════════════════════
// NO VÁLIDO intuicionísticamente
// ═══════════════════════════════════════════════════════════

// Tercero excluido
check valid (P | !P)

// Doble negación eliminación
check valid (!!P -> P)

// Ley de Peirce
check valid (((P -> Q) -> P) -> P)

// De Morgan conversa
check valid ((!P & !Q) -> !(P | Q))

// Eliminación de doble negación compuesta
check valid (!!!(P) -> !P)

// ═══════════════════════════════════════════════════════════
// SATISFACIBILIDAD
// ═══════════════════════════════════════════════════════════

check satisfiable (P & !Q)
check satisfiable (P & Q & R)
check satisfiable ((P -> Q) & P)
check satisfiable (P & !P)
