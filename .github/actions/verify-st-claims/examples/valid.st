;; profile: classical.propositional

// Teoremas válidos en lógica proposicional clásica
logic classical.propositional

// Ley de identidad
check valid (P -> P)

// Modus Ponens
axiom mp1 = P -> Q
axiom mp2 = P
derive Q from {mp1, mp2}

// Tautología modal: □p → p es válida en S4 y T, pero este archivo
// usa proposicional clásico, donde P -> P es trivialmente válido.
check valid (P <-> !!P)
