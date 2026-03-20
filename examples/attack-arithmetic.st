// Aislamiento: Forzando al Evaluador Aritmetico
logic arithmetic

fn loop(N) {
  if valid N > 0 {
    let next = N + 1
    return loop(next)
  }
  return 0
}

print "Atacando al evaluador aritmetico..."
let tramp = loop(1)
check valid tramp > 0

