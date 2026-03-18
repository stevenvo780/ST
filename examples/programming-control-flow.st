// ============================================================
// ST Example — Programación, control de flujo y funciones
// ============================================================

logic classical.propositional

print "=== programming-control-flow ==="

let base = P -> Q
print base

if valid (P | !P) {
  print "tautologia ok"
} else {
  print "tautologia fail"
}

if invalid P {
  print "invalid ok"
}

for F in { P, Q, R } {
  print F
}

set cond = P
while satisfiable cond {
  print "while once"
  set cond = P & !P
}

fn revisar(X, Y) {
  print X
  print Y
  check valid (Y | !Y)
  return X & Y
}

revisar(P, Q)
