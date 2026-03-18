// ============================================================
// ST — Paraconsistente (Belnap) y Probabilístico (intensivo)
// ============================================================

// ═══════════════════════════════════════════════════════════
// PARACONSISTENTE BELNAP — tolera contradicciones
// ═══════════════════════════════════════════════════════════
// En Belnap (4 valores: T, F, B=both, N=neither),
// P->P NO es tautología para N, y ex falso no vale.
// check equivalent NO soportado en este perfil.
// ═══════════════════════════════════════════════════════════

logic paraconsistent.belnap

// Identidad: en Belnap 4-valued, P->P falla para N (correcto)
check valid (P -> P)

// Contradicciones son satisfacibles (no explotan)
check satisfiable (P & !P)

// Ex falso quodlibet NO vale en Belnap (correcto)
check valid ((P & !P) -> Q)

// Modus Ponens: en Belnap puro, derive puede no funcionar
// porque el motor de derivación no implementa semántica 4-valued
axiom b1 = P -> Q
axiom b2 = P
derive Q from {b1, b2}

// Tercero excluido: no vale en Belnap (para N)
check valid (P | !P)

// Satisfacibilidad con contradicción + otras
check satisfiable (P & !P & Q)
check satisfiable (P & !P & !Q)

// ═══════════════════════════════════════════════════════════
// PROBABILÍSTICO BÁSICO
// ═══════════════════════════════════════════════════════════

logic probabilistic.basic

// Tautología tiene prob = 1 (VÁLIDO)
check valid (P | !P)

// Átomo solo no es tautología (NO VÁLIDO)
check valid P

// Ex falso (VÁLIDO — prob de P&!P = 0)
check valid ((P & !P) -> Q)

// Satisfacibilidad
check satisfiable (P & Q)
check satisfiable (P & !Q)
check satisfiable (P | Q)

// Derivación
axiom p1 = P -> Q
axiom p2 = P
derive Q from {p1, p2}
