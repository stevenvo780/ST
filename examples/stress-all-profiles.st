// ============================================================
// ST Stress Test — Todos los perfiles, pruebas intensivas
// ============================================================
// Este archivo prueba el perfil proposicional clásico con
// fórmulas complejas, derivaciones largas, y casos extremos.
// Para otros perfiles ver los archivos dedicados.
// ============================================================

logic classical.propositional

// ═══════════════════════════════════════════════════════════
// 1. TAUTOLOGÍAS FUNDAMENTALES
// ═══════════════════════════════════════════════════════════

check valid (P -> P)
check valid (P | !P)
check valid !(P & !P)
check valid (P <-> !!P)
check valid ((P -> Q) -> (!Q -> !P))
check valid (P -> (Q -> P))
check valid (((P -> Q) & (Q -> R)) -> (P -> R))
check valid (!P -> (P -> Q))
check valid ((P -> (Q -> R)) -> ((P -> Q) -> (P -> R)))
check valid ((!P -> !Q) -> (Q -> P))

// ═══════════════════════════════════════════════════════════
// 2. LEYES DE DE MORGAN
// ═══════════════════════════════════════════════════════════

check equivalent (!(P & Q)), (!P | !Q)
check equivalent (!(P | Q)), (!P & !Q)

// ═══════════════════════════════════════════════════════════
// 3. DISTRIBUTIVIDAD
// ═══════════════════════════════════════════════════════════

check equivalent (P & (Q | R)), ((P & Q) | (P & R))
check equivalent (P | (Q & R)), ((P | Q) & (P | R))

// ═══════════════════════════════════════════════════════════
// 4. EQUIVALENCIAS CLÁSICAS
// ═══════════════════════════════════════════════════════════

check equivalent (P -> Q), (!P | Q)
check equivalent ((P & Q) -> R), (P -> (Q -> R))
check equivalent (P & (P | Q)), (P)
check equivalent (P | (P & Q)), (P)
check equivalent (P <-> Q), ((P -> Q) & (Q -> P))
check equivalent (P <-> Q), (Q <-> P)
check equivalent (P & P), (P)
check equivalent (P | P), (P)
check equivalent (!!!P), (!P)

// ═══════════════════════════════════════════════════════════
// 5. NO-TAUTOLOGÍAS (deben fallar check valid)
// ═══════════════════════════════════════════════════════════

check valid (P -> Q)
check valid (P & Q)
check valid (P | Q)
check valid (P)

// ═══════════════════════════════════════════════════════════
// 6. SATISFACIBILIDAD
// ═══════════════════════════════════════════════════════════

check satisfiable (P & Q & R)
check satisfiable (P & !P)
check satisfiable ((P -> Q) & P & !Q)
check satisfiable ((P & Q & !R) & (R | S))
check satisfiable (A & B & C & D & E)
check satisfiable ((A | B) & (!A | C) & (!B | !C))

// ═══════════════════════════════════════════════════════════
// 7. DERIVACIONES — MODUS PONENS SIMPLE
// ═══════════════════════════════════════════════════════════

axiom mp1 = P -> Q
axiom mp2 = P
derive Q from {mp1, mp2}

// ═══════════════════════════════════════════════════════════
// 8. DERIVACIONES — CADENA LARGA (8 pasos)
// ═══════════════════════════════════════════════════════════

axiom c1 = A -> B
axiom c2 = B -> C
axiom c3 = C -> D
axiom c4 = D -> E
axiom c5 = E -> F
axiom c6 = F -> G
axiom c7 = G -> H
axiom c8 = A
derive H from {c1, c2, c3, c4, c5, c6, c7, c8}

// ═══════════════════════════════════════════════════════════
// 9. DERIVACIÓN INVÁLIDA (falacia: afirmación del consecuente)
// ═══════════════════════════════════════════════════════════

axiom f1 = P -> Q
axiom f2 = Q
derive P from {f1, f2}

// ═══════════════════════════════════════════════════════════
// 10. TABLAS DE VERDAD
// ═══════════════════════════════════════════════════════════

truth_table (P & Q)
truth_table (P -> Q)
truth_table ((P -> Q) & (Q -> R) -> (P -> R))
truth_table (A & B -> C | D)

// ═══════════════════════════════════════════════════════════
// 11. CONTRAMODELOS
// ═══════════════════════════════════════════════════════════

countermodel (P -> Q)
countermodel (P & Q)
countermodel (P -> P)
countermodel ((P -> Q) & (R -> S) -> (P -> S))

// ═══════════════════════════════════════════════════════════
// 12. FÓRMULAS PROFUNDAMENTE ANIDADAS
// ═══════════════════════════════════════════════════════════

check valid (((((P -> Q) -> Q) -> Q) -> Q) -> Q)
check valid ((P -> Q) | (Q -> R) | (R -> S) | (S -> P))
check valid ((A & B & C & D) -> A)
check valid ((A | B | C | D) -> (D | C | B | A))
check valid ((P -> (Q -> (R -> (S -> S)))))
