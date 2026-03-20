// ============================================================
// ST ATTACK SCRIPT — Buscando el Segmentation Fault
// ============================================================

print "=== ATAQUE 1: Referencias Circulares ==="
logic classical.propositional
// Si el intérprete sustituye A por B, y B por A, ¿entrará en un bucle infinito?
let A = B & P
let B = A & Q
print "Intentando evaluar una referencia circular:"
check valid A

print "\n=== ATAQUE 2: El Modelo Infinito (FOL) ==="
logic classical.first_order
// Axiomas de un orden estricto sin elemento máximo.
// Esto REQUIERE un dominio infinito.
// 1. Irreflexivo: forall x !R(x,x)
// 2. Transitivo: forall x forall y forall z ((R(x,y) & R(y,z)) -> R(x,z))
// 3. Serial (siempre hay uno mayor): forall x exists y R(x,y)
// En un tableau ingenuo, esto genera constantes c1, c2, c3... infinitamente.
print "Intentando encontrar un modelo para un dominio infinito..."
let infinite_model = (forall x (!R(x,x))) & (forall x (forall y (forall z (((R(x,y) & R(y,z)) -> R(x,z)))))) & (forall x (exists y (R(x,y))))
check satisfiable infinite_model

print "\n=== ATAQUE 3: Agujero Negro Recursivo ==="
logic arithmetic
// Recursión mutua sin salida
fn ping(N) {
  return pong(N + 1)
}
fn pong(N) {
  return ping(N + 1)
}
print "Iniciando ping-pong infinito..."
ping(0)

print "\n=== ATAQUE 4: Colisión de Scopes ==="
logic classical.propositional
let X = P -> Q
theory Trampa {
  let X = A & B
  axiom ax1 = X
}
// ¿Qué "X" usará aquí si forzamos la resolución?
print Trampa.ax1
check equivalent Trampa.X, X

print "\n=== SUPERVIVENCIA COMPLETA ==="

