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

axiom a1 = All Human is Primate
axiom a2 = All Primate is Mammal
axiom a3 = All Mammal is Vertebrate
axiom a4 = All Vertebrate is Animal
axiom a5 = All Animal is LivingBeing
axiom a6 = All LivingBeing is Entity

axiom a7 = All Greek is Human
axiom a8 = All Athenian is Greek

// Esto FALLARÁ si intentamos derivarlo directamente de toda la base
print "Intento de derivación directa (saltando niveles) - Debería fallar:"
derive All Athenian is Entity from {a1, a2, a3, a4, a5, a6, a7, a8}

// Forma correcta: Paso a paso (Sorites)
print "Derivación paso a paso (Sorites):"

theorem t1 = All Athenian is Human
derive t1 from {a7, a8} // Barbara (Figura 1)

theorem t2 = All Athenian is Primate
derive t2 from {t1, a1} // Barbara

theorem t3 = All Athenian is Mammal
derive t3 from {t2, a2} // Barbara

theorem t4 = All Athenian is Entity
// Podemos saltar si tenemos las dos premisas correctas
// Pero aquí necesitamos cerrar la cadena. 
// Para efectos del test, probemos una derivación de largo alcance:
derive All Athenian is Entity from {t3, a3, a4, a5, a6} 
// El motor buscará entre las premisas dadas dos que cierren el silogismo.
// Si t3 es "Athenian is Mammal" y a3 es "Mammal is Vertebrate", 
// el motor puede derivar "Athenian is Vertebrate", pero NO "Entity" directamente.

print "=== Test de Silogística Finalizado ==="
