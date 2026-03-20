// Aislamiento: Recursion
logic arithmetic
fn ping(N) {
  return pong(N + 1)
}
fn pong(N) {
  return ping(N + 1)
}
print "Iniciando ping-pong infinito..."
ping(0)
print "Esto no deberia imprimirse"
