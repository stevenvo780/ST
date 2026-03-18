// ============================================================
// ST — First-Order Logic y Silogística Aristotélica (intensivo)
// ============================================================

// ═══════════════════════════════════════════════════════════
// LÓGICA DE PRIMER ORDEN — classical.first_order
// ═══════════════════════════════════════════════════════════
// Nota: check equivalent no soportado en FOL.
// ═══════════════════════════════════════════════════════════

logic classical.first_order

// Instanciación universal básica (VÁLIDO)
check valid (forall x (P(x) -> P(a)))

// Introducción existencial (VÁLIDO)
check valid (P(a) -> exists x P(x))

// Cuantificador vacuo (VÁLIDO)
check valid (forall x (P -> P))

// Negación de cuantificadores (como validez)
check valid (!(forall x P(x)) -> exists x !P(x))
check valid (!(exists x P(x)) -> forall x !P(x))

// Satisfacibilidad
check satisfiable (exists x P(x) & exists x !P(x))
check satisfiable (forall x P(x))

// ═══════════════════════════════════════════════════════════
// SILOGÍSTICA ARISTOTÉLICA — aristotelian.syllogistic
// ═══════════════════════════════════════════════════════════
// Nota: check equivalent no soportado en silogística.
// ═══════════════════════════════════════════════════════════

logic aristotelian.syllogistic

// Barbara: ∀x(M→P) ∧ ∀x(S→M) → ∀x(S→P) (VÁLIDO)
check valid ((forall x (M(x) -> P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x))))

// Celarent: ∀x(M→¬P) ∧ ∀x(S→M) → ∀x(S→¬P) (VÁLIDO)
check valid ((forall x (M(x) -> !P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> !P(x))))

// Darii: ∀x(M→P) ∧ ∃x(S∧M) → ∃x(S∧P) (VÁLIDO)
check valid ((forall x (M(x) -> P(x))) & (exists x (S(x) & M(x))) -> (exists x (S(x) & P(x))))

// Silogismo inválido: conclusión universal de premisa particular (NO VÁLIDO)
check valid ((exists x (M(x) & P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x))))

// Satisfacibilidad
check satisfiable (forall x (M(x) -> P(x)))
check satisfiable (exists x (S(x) & M(x)))
