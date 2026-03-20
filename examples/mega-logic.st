// ============================================================
// ST Mega Logic — The ultimate stress test
// ============================================================
// Probar todos los perfiles en un solo archivo con
// operaciones pesadas y casos complejos.
// ============================================================

print "--- ST Mega Logic Test Starting ---"

// 1. CLASSICAL PROPOSITIONAL (Combinatoria 14 átomos)
logic classical.propositional
print "[PROPOSITIONAL] Testing 14 variables..."
let f_prop = A & B & C & D & E & F & G & H & I & J & K & L & M & N
check satisfiable f_prop

// 2. MODAL LOGIC (Profundidad de mundo 50)
logic modal.k
print "[MODAL] Testing modal depth chain..."
let f_modal = <>A & []<>B & [][]<>C & [][][]<>D & [][][][]<>E
check satisfiable f_modal

// 3. FIRST-ORDER LOGIC (Quantifiers & Identity)
logic classical.first_order
print "[FOL] Testing identity and quantifiers..."
check valid (forall x (forall y (x = y -> (P(x) -> P(y)))))
check valid (exists x (forall y (P(x,y)))) -> (forall y (exists x (P(x,y))))

// 4. ARITHMETIC (Loops & Set)
logic arithmetic
print "[ARITHMETIC] Nested loops (10x10)..."
let counter = 0
for i in {1,2,3,4,5,6,7,8,9,10} {
  for j in {1,2,3,4,5,6,7,8,9,10} {
    set counter = counter + 1
  }
}
print counter

// 5. INTUITIONISTIC
logic intuitionistic.propositional
print "[INTUITIONISTIC] Double negation elimination (fails as expected)..."
check valid !!P -> P

// 6. DEONTIC (Chisholm's Paradox)
logic deontic.standard
print "[DEONTIC] Chisholm's Paradox analysis..."
axiom a1 = O(A) // Obligatorio ir
axiom a2 = O(A -> B) // Si va, avisar
axiom a3 = !A -> O(!B) // Si no va, no avisar
axiom a4 = !A // No va
check satisfiable (A & B & !A & !B) // Debería ser insatisfacible si se unen

// 7. PARACONSISTENT
logic paraconsistent.belnap
print "[BELNAP] Four-valued logic check..."
check equivalent (P & !P), !P // En Belnap, P & !P no es falso necesariamente
truth_table P & !P

// 8. TEXT LAYER
print "[TEXT LAYER] Final formalization..."
let doc = passage([[mega_logic_ref.md]])
let f_text = formalize doc as P
render theory

print "--- ST Mega Logic Test Finished ---"
