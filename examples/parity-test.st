// ============================================================
// ST — Test de paridad CLI vs API
// ============================================================
// Este script compara que el intérprete devuelve los mismos
// resultados que se esperarían en el navegador (API).
// ============================================================

logic classical.propositional

// Estas deben dar EXACTAMENTE el mismo resultado en CLI y API:

check valid (P -> P)
check valid (P | !P)
check valid !(P & !P)
check valid ((P -> Q) -> (!Q -> !P))
check valid (P -> Q)

check equivalent (!(P & Q)), (!P | !Q)
check equivalent (P -> Q), (!P | Q)

check satisfiable (P & Q & R)
check satisfiable (P & !P)

axiom a1 = P -> Q
axiom a2 = P
derive Q from {a1, a2}

truth_table (P & Q)
countermodel (P -> Q)
