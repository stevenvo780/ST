// ST Text Layer Demo
// Criterio de éxito del Text Layer (04_TEXT_LAYER.md)

logic classical.propositional

// Declarar un pasaje con anchor a un documento
let p = passage([[clase-logica.md#b8]])

// Formalizar el pasaje como una implicación
let phi = formalize p as (P -> Q)

// Declarar un claim basado en la formalización
claim c1 = phi

// Registrar soporte: el claim c1 está soportado por el pasaje p
support c1 <- p

// Registrar nivel de confianza
confidence c1 = 0.84

// Registrar contexto interpretativo
context c1 = "El pasaje b8 de clase-logica sugiere que si P entonces Q"

// Ahora podemos razonar sobre la formalización
axiom base = P -> Q
axiom premisa = P
derive Q from {base, premisa}
