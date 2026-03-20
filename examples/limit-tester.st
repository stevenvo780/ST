// ============================================================
// ST Limit Tester — Pruebas de Estrés y Límites del Lenguaje
// ============================================================

logic classical.propositional

print "=== 1. CLASSICAL PROPOSITIONAL STRESS ==="

// 1.1 Combinatoria: 13 átomos (2^13 = 8,192 combinaciones)
print "Probando fórmula con 13 átomos..."
let f13 = A & B & C & D & E & F & G & H & I & J & K & L & M
check satisfiable f13

// 1.2 Profundidad de anidamiento: 100 niveles de negación
print "Probando anidamiento de 100 niveles de negación..."
let f_deep = !(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!(!P))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
check equivalent f_deep, P

// 1.3 Cadena de implicaciones larga (50 pasos)
print "Generando cadena de implicaciones de 50 pasos..."
axiom a1 = P1 -> P2
axiom a2 = P2 -> P3
axiom a3 = P3 -> P4
axiom a4 = P4 -> P5
axiom a5 = P5 -> P6
axiom a6 = P6 -> P7
axiom a7 = P7 -> P8
axiom a8 = P8 -> P9
axiom a9 = P9 -> P10
axiom a10 = P10 -> P11
axiom a11 = P11 -> P12
axiom a12 = P12 -> P13
axiom a13 = P13 -> P14
axiom a14 = P14 -> P15
axiom a15 = P15 -> P16
axiom a16 = P16 -> P17
axiom a17 = P17 -> P18
axiom a18 = P18 -> P19
axiom a19 = P19 -> P20
axiom a20 = P20 -> P21
axiom a21 = P21 -> P22
axiom a22 = P22 -> P23
axiom a23 = P23 -> P24
axiom a24 = P24 -> P25
axiom a25 = P25 -> P26
axiom a26 = P26 -> P27
axiom a27 = P27 -> P28
axiom a28 = P28 -> P29
axiom a29 = P29 -> P30
axiom a30 = P30 -> P31
axiom a31 = P31 -> P32
axiom a32 = P32 -> P33
axiom a33 = P33 -> P34
axiom a34 = P34 -> P35
axiom a35 = P35 -> P36
axiom a36 = P36 -> P37
axiom a37 = P37 -> P38
axiom a38 = P38 -> P39
axiom a39 = P39 -> P40
axiom a40 = P40 -> P41
axiom a41 = P41 -> P42
axiom a42 = P42 -> P43
axiom a43 = P43 -> P44
axiom a44 = P44 -> P45
axiom a45 = P45 -> P46
axiom a46 = P46 -> P47
axiom a47 = P47 -> P48
axiom a48 = P48 -> P49
axiom a49 = P49 -> P50
axiom base = P1
derive P50 from {a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24, a25, a26, a27, a28, a29, a30, a31, a32, a33, a34, a35, a36, a37, a38, a39, a40, a41, a42, a43, a44, a45, a46, a47, a48, a49, base}

print "=== 2. MODAL LOGIC STRESS ==="
logic modal.k

// 2.1 Anidamiento modal profundo
print "Probando anidamiento de 50 niveles de Box []"
let f_modal = [][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][](P -> P)
check valid f_modal

print "=== 3. ARITHMETIC & RECURSION STRESS ==="
logic arithmetic

// 3.1 Recursión: Factorial (ST no soporta operadores aritméticos en if conditions directamente, 
// pero soporta logic arithmetic para check valid)

fn factorial(N) {
  if valid N <= 1 {
    return 1
  }
  let prev = N - 1
  let sub = factorial(prev)
  return N * sub
}

// Nota: Actualmente el motor puede tener limitaciones con expresiones complejas en return
// Probemos una versión más simple de recursión si falla la anterior.
print "Probando recursión simple..."
fn countdown(N) {
  print N
  if valid N <= 0 {
    return 0
  }
  let next = N - 1
  countdown(next)
  return 0
}

countdown(10)

print "=== 4. FIRST ORDER LOGIC STRESS ==="
logic classical.first_order

// 4.1 Muchos cuantificadores
print "Probando 10 cuantificadores anidados..."
let f_fol = forall x1 (exists y1 (forall x2 (exists y2 (forall x3 (exists y3 (forall x4 (exists y4 (forall x5 (exists y5 P(x1,y1,x2,y2,x3,y3,x4,y4,x5,y5))))))))))
print f_fol

print "=== 5. TEXT LAYER STRESS ==="
logic classical.propositional

let doc = passage([[documento_largo.md]])
for i in {1, 2, 3, 4, 5, 6, 7, 8, 9, 10} {
  // En ST los nombres en let deben ser estáticos usualmente, 
  // pero probemos si el lexer/parser aguanta muchas declaraciones seguidas
  print "Declarando formalizaciones..."
}

let f1 = formalize doc as P1
let f2 = formalize doc as P2
let f3 = formalize doc as P3
let f4 = formalize doc as P4
let f5 = formalize doc as P5
let f6 = formalize doc as P6
let f7 = formalize doc as P7
let f8 = formalize doc as P8
let f9 = formalize doc as P9
let f10 = formalize doc as P10

render theory

print "=== TEST FINALIZADO ==="
