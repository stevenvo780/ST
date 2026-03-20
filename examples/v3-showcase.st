// ================================================================
// ST v3 Showcase — define, unfold, fold, source, interpret,
//                  glossary, render glossary/analysis
// ================================================================

logic classical.propositional

// ── 1. Fuente bibliográfica ──────────────────────────────────

source Aristotle {
  author "Aristóteles"
  work "Organon"
  year 350
  section "Analytica Priora"
}

source Frege {
  author "Gottlob Frege"
  work "Begriffsschrift"
  year 1879
}

// ── 2. Definiciones formales ─────────────────────────────────

// Definición simple (sin parámetros)
define Mortal := P -> Q
description "Todo hombre es mortal"

// Definición paramétrica
define Implies(x, y) := x -> y
description "Implicación material"

// Definiciones compuestas
define Syllogism := (P -> Q) & (Q -> R) -> (P -> R)
description "Silogismo hipotético: transitividad de la implicación"

define Contradiction := P & !P
description "Contradicción: fórmula siempre falsa"

// ── 3. Axiomas usando definiciones ───────────────────────────

axiom A1 : Mortal
axiom A2 : P

// ── 4. Derivación con definiciones ───────────────────────────

derive Q from {A1, A2}

// ── 5. Verificaciones sobre definiciones ─────────────────────

// La definición paramétrica: Implies(P, P) expande a P -> P (tautología)
check valid Implies(P, P)

// El silogismo hipotético es una tautología
check valid Syllogism

// La contradicción es insatisfacible
check satisfiable Contradiction

// ── 6. Unfold / Fold ─────────────────────────────────────────

// Desplegar: muestra la fórmula subyacente de una definición
unfold Mortal

// Plegar: identifica la definición que corresponde a una fórmula
fold (P -> Q)

// ── 7. Interpretaciones ──────────────────────────────────────

interpret "todo hombre es mortal" as P -> Q
interpret "Sócrates es hombre" as P

// ── 8. Glosario ──────────────────────────────────────────────

glossary

// ── 9. Render glossary (Markdown) ────────────────────────────

render glossary as markdown

// ── 10. Render analysis (documento completo) ─────────────────

render analysis as markdown
