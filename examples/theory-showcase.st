// ============================================================
// ST Example — Theory blocks, encapsulación e herencia
// ============================================================

logic classical.propositional

print "=== theory-showcase ==="

theory Base {
  let alias = P -> Q
  private let secreto = R & S
  axiom regla : P -> Q
}

theory Extendida extends Base {
  theorem cierre : P -> Q
}

print Base.alias
print Extendida.alias
print Extendida.regla
check valid (P | !P)
