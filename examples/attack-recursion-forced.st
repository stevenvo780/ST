// Aislamiento: Recursion Forzada
logic arithmetic
fn ping(N) {
  return pong(N + 1)
}
fn pong(N) {
  return ping(N + 1)
}
print "Forzando evaluacion de ping-pong infinito..."
let trampa = ping(0)
print trampa
