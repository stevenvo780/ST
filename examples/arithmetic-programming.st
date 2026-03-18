// ============================================================
// ST Example — Perfil arithmetic + programación
// ============================================================

logic arithmetic

print "=== arithmetic-programming ==="

check valid 2 + 3 < 10
check valid (2 * 3) >= 6
check satisfiable 10 % 3 > 0

explain 2 + 3 * 4
explain 10 > 5

let X = 2 + 3
print X
set X = 2 * 5
print X

if valid 8 / 2 >= 4 {
  print "division ok"
} else {
  print "division fail"
}

for N in { 1, 2, 3 } {
  print N
}

set LOOP = 1
while satisfiable LOOP {
  print "loop arithmetic"
  set LOOP = 0
}

fn calcular(A, B) {
  print A
  print B
  explain A + B
  return A + B
}

calcular(4, 5)
countermodel 5 < 3
