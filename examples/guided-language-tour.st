// ============================================================
// ST Example — Recorrido guiado del lenguaje
// ============================================================
// Este archivo muestra, paso a paso, cómo combinar:
// - aliases lógicos con let
// - descripciones semánticas
// - derive, analyze y explain
// - if / for / while
// - funciones
// - theory blocks
// ============================================================

logic classical.propositional

print "=== guided-language-tour ==="
print "1) Definimos hechos y reglas con nombres legibles"

let regla = "Si estudio, apruebo" : (E -> A)
let hecho = "Estudio hoy" : E

print regla
print hecho

print "2) Derivamos una conclusión desde aliases"
derive A from {regla, hecho}

print "3) Analizamos la inferencia completa"
analyze {E, E -> A} -> A

print "4) Pedimos una explicación adicional"
explain (E -> A)

print "5) Ramificamos según propiedades lógicas"
if valid (P | !P) {
  print "tautología detectada"
} else if satisfiable (P & Q) {
  print "solo satisfacible"
} else {
  print "rama final"
}

print "6) Recorremos varios casos"
for Caso in { P, Q, (R -> R) } {
  print Caso
}

print "7) Simulamos un cambio de estado con while"
set estado = P
while satisfiable estado {
  print "iteración while"
  set estado = P & !P
}

print "8) Encapsulamos pasos repetibles en una función"
fn revisar(X) {
  print "revisando fórmula"
  print X
  check satisfiable X
  return X
}

revisar((P -> Q))

print "9) Agrupamos conocimiento dentro de una teoría"
theory CursoLogica {
  let regla_base = E -> A
  private let nota_interna = R & S
  axiom avance : E -> A
  theorem identidad : (P -> P)
}

print CursoLogica.regla_base
print CursoLogica.avance

print "10) El script termina con una verificación final"
check valid (A -> A)
