// ============================================================
// ST — Text Layer completo y complejo
// ============================================================
// Prueba exhaustiva de la capa textual: passages, formalize,
// claim, support, confidence, context + derivaciones.
// ============================================================

logic classical.propositional

// ═══════════════════════════════════════════════════════════
// PASO 1: Declarar pasajes de un documento de filosofía
// ═══════════════════════════════════════════════════════════

let p1 = passage([[kant-critica.md#prolegomenos]])
let p2 = passage([[kant-critica.md#estetica-trascendental]])
let p3 = passage([[kant-critica.md#analitica-conceptos]])
let p4 = passage([[hume-investigacion.md#causalidad]])

// ═══════════════════════════════════════════════════════════
// PASO 2: Formalizar los pasajes
// ═══════════════════════════════════════════════════════════

// "Si hay intuición pura, entonces es posible juicio sintético a priori"
let f1 = formalize p1 as (I -> J)

// "Si hay juicio sintético a priori, entonces la geometría es posible"
let f2 = formalize p2 as (J -> G)

// "Hay intuición pura (espacio/tiempo)"
let f3 = formalize p3 as (I)

// "Si solo hay impresiones, no hay conexión necesaria" (Hume)
let f4 = formalize p4 as (H -> !N)

// ═══════════════════════════════════════════════════════════
// PASO 3: Claims, soporte, confianza y contexto
// ═══════════════════════════════════════════════════════════

claim c1 = f1
claim c2 = f2
claim c3 = f3
claim c4 = f4

support c1 <- p1
support c2 <- p2
support c3 <- p3
support c4 <- p4

confidence c1 = 0.92
confidence c2 = 0.88
confidence c3 = 0.95
confidence c4 = 0.80

context c1 = "Kant establece que la intuición pura fundamenta los juicios sintéticos a priori"
context c2 = "En la Estética Trascendental, espacio como forma pura habilita la geometría"
context c3 = "La Analítica de Conceptos presupone las formas puras de la sensibilidad"
context c4 = "Hume niega la conexión necesaria basándose solo en impresiones"

// ═══════════════════════════════════════════════════════════
// PASO 4: Derivación formal del argumento kantiano
// ═══════════════════════════════════════════════════════════

axiom kant1 = I -> J
axiom kant2 = J -> G
axiom kant3 = I

// Kant concluye: la geometría es posible
derive G from {kant1, kant2, kant3}

// Verificar que la cadena es tautológica
check valid (((I -> J) & (J -> G) & I) -> G)

// ═══════════════════════════════════════════════════════════
// PASO 5: Contra-argumento humeano
// ═══════════════════════════════════════════════════════════

axiom hume1 = H -> !N
axiom hume2 = N -> !H
axiom hume3 = H

// Hume concluye: no hay conexión necesaria
derive !N from {hume1, hume3}

// Verificar contrapositiva de Hume
check valid ((H -> !N) <-> (N -> !H))

// Tabla de verdad del conflicto
truth_table ((I -> J) & (H -> !N))
