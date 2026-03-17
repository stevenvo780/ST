// ST Contramodel Demo
// Demuestra la búsqueda de contramodelos

logic classical.propositional

// Este es un argumento inválido: afirmación del consecuente
// P -> Q, Q |- P   (falacia)
axiom a1 = P -> Q
axiom a2 = Q

// Intentar derivar P (debería fallar)
derive P from {a1, a2}

// Verificar que P -> Q no es tautología
countermodel (P -> Q)

// Pero la contraposición sí es tautología
check valid ((P -> Q) -> (!Q -> !P))

// Tabla de verdad para visualizar
truth_table (P -> Q)

// Silogismo hipotético: (P->Q) & (Q->R) -> (P->R) es tautología
check valid (((P -> Q) & (Q -> R)) -> (P -> R))
