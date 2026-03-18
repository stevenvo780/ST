// ============================================================
// ST — Modal, Deóntico, Epistémico, Temporal (intensivo)
// ============================================================
// Todos los perfiles basados en tableaux con [] y <>
// Nota: check equivalent no está soportado en estos perfiles.
// ============================================================

// ═══════════════════════════════════════════════════════════
// MODAL K — sistema mínimo de Kripke
// ═══════════════════════════════════════════════════════════

logic modal.k

// Axioma K: distribución (VÁLIDO)
check valid ([](P -> Q) -> ([]P -> []Q))

// Necessitación de tautología (VÁLIDO)
check valid ([](P -> P))

// Dualidad box/diamond como bicondicional (VÁLIDO)
check valid (<>P <-> ![]!P)

// En K, T NO vale: []P → P (NO VÁLIDO)
check valid ([]P -> P)

// En K, 4 NO vale: []P → [][]P (NO VÁLIDO)
check valid ([]P -> [][]P)

// En K, B NO vale: P → []<>P (NO VÁLIDO)
check valid (P -> []<>P)

// Satisfacibilidad
check satisfiable (<>P & <>Q)
check satisfiable ([]P & []Q)
check satisfiable (<>P & <>!P)

// ═══════════════════════════════════════════════════════════
// DEÓNTICO KD — obligación, permisión, prohibición
// ═══════════════════════════════════════════════════════════

logic deontic.standard

// Axioma D: O(φ) → P(φ) — lo obligatorio es permitido (VÁLIDO)
check valid ([](P) -> <>(P))

// Axioma K deóntico (VÁLIDO)
check valid ([](P -> Q) -> ([]P -> []Q))

// Lo obligatorio NO implica lo real (NO VÁLIDO en KD)
check valid ([](P) -> P)

// Prohibición implica no-permisión: [](!P) → !<>(P) (VÁLIDO)
check valid ([](!P) -> !<>(P))

// No-conflicto deóntico: ¬(O(P) ∧ O(¬P)) (VÁLIDO)
check valid !([](P) & [](!P))

// Dualidad O/P como bicondicional (VÁLIDO)
check valid (<>P <-> ![]!P)

// Satisfacibilidad
check satisfiable ([](P) & <>(Q))
check satisfiable (<>(P) & <>(Q) & <>(!P))

// ═══════════════════════════════════════════════════════════
// EPISTÉMICO S5 — conocimiento e introspección
// ═══════════════════════════════════════════════════════════

logic epistemic.s5

// Axioma T: K(P) → P — veridicidad (VÁLIDO en S5)
check valid ([](P) -> P)

// Axioma 4: K(P) → K(K(P)) — introspección positiva (VÁLIDO)
check valid ([](P) -> []([](P)))

// Axioma 5: ¬K(P) → K(¬K(P)) — introspección negativa (VÁLIDO)
check valid (![]P -> [](![]P))

// Axioma K (VÁLIDO)
check valid ([](P -> Q) -> ([]P -> []Q))

// Dualidad K/B (VÁLIDO)
check valid ([]P <-> !<>!P)

// Conocimiento implica creencia (VÁLIDO)
check valid ([]P -> <>P)

// Satisfacibilidad
check satisfiable ([]P & ![]Q)
check satisfiable (<>P & <>!P)

// ═══════════════════════════════════════════════════════════
// TEMPORAL LTL — siempre, eventualmente, siguiente, hasta
// ═══════════════════════════════════════════════════════════

logic temporal.ltl

// G(P) → P — lo que siempre vale, vale ahora (VÁLIDO)
check valid ([](P) -> P)

// G(P) → F(P) — siempre implica eventualmente (VÁLIDO)
check valid ([](P) -> <>(P))

// F(P) → G(P) — eventualmente NO implica siempre (NO VÁLIDO)
check valid (<>(P) -> [](P))

// Distribución de G (VÁLIDO)
check valid ([](P -> Q) -> ([](P) -> [](Q)))

// G(P) → X(P) — siempre implica siguiente
// BUG CONOCIDO: el tableau no conecta G con X todavía
check valid ([](P) -> next P)

// Satisfacibilidad
check satisfiable ([](P) & <>(Q))
check satisfiable (<>(P) & <>(!P))
check satisfiable (P until Q)
