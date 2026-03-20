// ============================================================
// ST Theory Collision — Breaking the Scope
// ============================================================

logic classical.propositional

theory BaseClassical {
  let A = P -> Q
  axiom axiom1 : P
}

logic arithmetic

theory ArithmeticExtender extends BaseClassical {
  // ¿Qué pasa con A? ¿Se puede usar en un contexto aritmético?
  let B = 10 + 5
  
  // Intento de colisión: Usar un let proposicional en un check aritmético
  print "Probando colisión de tipos Base.A en ArithmeticExtender"
  print BaseClassical.A
}

print "--- Ejecutando Teoría de Colisión ---"
render theory
print ArithmeticExtender.B

// Un paso más allá: Forzar al motor a evaluar una fórmula proposicional como aritmética
check valid (BaseClassical.A + 1) > 0
