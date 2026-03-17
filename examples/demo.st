// ST Demo — Script de demostración
// Este es el criterio de éxito del Logic Core (02_LOGIC_CORE.md)

logic classical.propositional

// Declarar axiomas
axiom a1 = P -> Q
axiom a2 = P

// Derivar Q por Modus Ponens
derive Q from {a1, a2}

// Verificar tautología: contraposición
check valid ((P -> Q) -> (!Q -> !P))

// Verificar que P -> Q no es tautología
check valid (P -> Q)

// Tabla de verdad de P & Q
truth_table (P & Q)

// Buscar contramodelo para P -> Q
countermodel (P -> Q)

// Verificar equivalencia: De Morgan
check equivalent (!(P & Q)), (!P | !Q)

// Verificar satisfacibilidad
check satisfiable (P & Q & !R)
