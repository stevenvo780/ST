// ============================================================
// ST Example — Complex Aristotelian Syllogisms
// ============================================================
// Probar los límites del perfil aristotélico.
// NOTA: El motor actual está limitado a silogismos de UN SOLO PASO
// (2 premisas -> 1 conclusión). Para cadenas largas, se deben
// usar teoremas intermedios.
// ============================================================

logic aristotelian.syllogistic

print "=== Jerarquía Taxonómica (Cadena de Barbara) ==="

axiom a1 = Human -> Primate
axiom a2 = Primate -> Mammal
axiom a3 = Mammal -> Vertebrate
axiom a4 = Vertebrate -> Animal
axiom a5 = Animal -> LivingBeing
axiom a6 = LivingBeing -> Entity

axiom a7 = Greek -> Human
axiom a8 = Athenian -> Greek

// Esto FALLARÁ si intentamos derivarlo directamente de toda la base
print "Intento de derivación directa (saltando niveles) - Debería fallar:"
derive Athenian -> Entity from {a1, a2, a3, a4, a5, a6, a7, a8}

// Forma correcta: Paso a paso (Sorites)
print "Derivación paso a paso (Sorites):"

derive Athenian -> Human from {a7, a8}

derive Greek -> Primate from {a7, a1}

derive Human -> Mammal from {a1, a2}

check valid ((Human -> Primate) & (Greek -> Human) -> (Greek -> Primate))
check valid ((Primate -> Mammal) & (Human -> Primate) -> (Human -> Mammal))
check valid ((Greek -> Human) & (Human -> Mammal) -> (Greek -> Mammal))

print "=== Test de Silogística Finalizado ==="
