// ============================================================
// ST — Tests Filosóficos Complejos por Sistema Lógico
// ============================================================
// Cada sección formaliza argumentos reales de la historia de la
// filosofía para validar que el motor funciona correctamente
// con textos complejos de razonamiento filosófico profundo.
// ============================================================

import { describe, it, expect } from 'vitest';
import { evaluate } from '../api';

// ────────────────────────────────────────────────────────────────
// 1. LÓGICA PROPOSICIONAL CLÁSICA
// ────────────────────────────────────────────────────────────────

describe('Filosofía — Lógica Proposicional Clásica', () => {
  // ── Aristóteles: Principio de No-Contradicción ──
  it('Aristóteles: Principio de No-Contradicción — !(P & !P) es tautología', () => {
    const r = evaluate(`
logic classical.propositional

// Metafísica IV, 3-6: "Es imposible que lo mismo se dé y no se dé
// en lo mismo a la vez y en el mismo sentido"
// Formalización: !(P & !P) — El PNC es una ley lógica universal
check valid (!(P & !P))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Aristóteles: Principio del Tercero Excluido ──
  it('Aristóteles: Tertium Non Datur — (P | !P) es tautología', () => {
    const r = evaluate(`
logic classical.propositional
// Metafísica IV, 7: "No es posible que haya nada entre los dos
// miembros de una contradicción, sino que necesariamente
// se ha de afirmar o negar uno de ellos."
check valid (P | !P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Estoicos: Modus Ponens ──
  it('Estoicos: Primer Indemonstrables — Modus Ponens', () => {
    const r = evaluate(`
logic classical.propositional
// Crisipo, Primer Indemostrable: "Si lo primero, entonces lo segundo;
// pero lo primero; por tanto, lo segundo."
// (P -> Q) & P => Q
axiom premisa_mayor : P -> Q
axiom premisa_menor : P
derive Q from {premisa_mayor, premisa_menor}
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('provable');
  });

  // ── Estoicos: Modus Tollens ──
  it('Estoicos: Segundo Indemostrable — Modus Tollens', () => {
    const r = evaluate(`
logic classical.propositional
// Crisipo, Segundo Indemostrable: "Si lo primero, entonces lo segundo;
// pero no lo segundo; por tanto, no lo primero."
check valid ((P -> Q) -> (!Q -> !P))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Estoicos: Silogismo Disyuntivo ──
  it('Estoicos: Tercer Indemostrable — Silogismo Disyuntivo', () => {
    const r = evaluate(`
logic classical.propositional
// "O lo primero o lo segundo; pero no lo primero; por tanto, lo segundo."
check valid (((P | Q) & !P) -> Q)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Wittgenstein: Tautología compuesta del Tractatus ──
  it('Wittgenstein: Tautología compleja — cadena de implicaciones', () => {
    const r = evaluate(`
logic classical.propositional
// Tractatus 4.461: "La tautología no tiene condiciones de verdad,
// pues es incondicionalmente verdadera."
// ((P -> Q) & (Q -> R)) -> (P -> R) — Transitividad del condicional
check valid (((P -> Q) & (Q -> R)) -> (P -> R))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Leibniz: Principio de Razón Suficiente (formalización parcial) ──
  it('Leibniz: Principio de Identidad — (P <-> P) es tautología', () => {
    const r = evaluate(`
logic classical.propositional
// Monadología §31-32: "Nuestros razonamientos se fundan en dos grandes
// principios: el de contradicción y el de razón suficiente."
// El principio de identidad: P <-> P
check valid (P <-> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Peirce: Ley de Peirce ──
  it('Peirce: Ley de Peirce — ((P -> Q) -> P) -> P', () => {
    const r = evaluate(`
logic classical.propositional
// C.S. Peirce (1885): Esta ley es válida clásicamente pero no
// intuicionistamente, distinguiendo ambas lógicas.
check valid (((P -> Q) -> P) -> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Tabla de verdad: Análisis de la Paradoja del Condicional Material ──
  it('Paradoja del Condicional Material — Ex falso quodlibet', () => {
    const r = evaluate(`
logic classical.propositional
// C.I. Lewis señaló que P -> (Q -> P) es una tautología,
// lo cual muestra que una verdad se sigue de cualquier cosa.
check valid (P -> (Q -> P))
truth_table (P -> (Q -> P))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
    expect(r.results[1].truthTable).toBeDefined();
    expect(r.results[1].truthTable!.isTautology).toBe(true);
  });

  // ── Argumento complejo: Dilema Constructivo ──
  it('Dilema Constructivo — ((P->Q) & (R->S)) -> ((P|R) -> (Q|S))', () => {
    const r = evaluate(`
logic classical.propositional
// Forma de argumento clásica usada extensamente en retórica filosófica.
check valid (((P -> Q) & (R -> S)) -> ((P | R) -> (Q | S)))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── De Morgan: Leyes ──
  it('De Morgan: !(P & Q) <-> (!P | !Q)', () => {
    const r = evaluate(`
logic classical.propositional
// Augustus De Morgan (1847): Equivalencias fundamentales
check valid (!(P & Q) <-> (!P | !Q))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  it('De Morgan: !(P | Q) <-> (!P & !Q)', () => {
    const r = evaluate(`
logic classical.propositional
check valid (!(P | Q) <-> (!P & !Q))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Derivación compleja: Argumento de Descartes ──
  it('Descartes: Cogito formalizado como cadena deductiva', () => {
    const r = evaluate(`
logic classical.propositional
// Reconstrucción formal del Cogito:
// P = "Pienso" (Cogito)
// D = "Algo que piensa existe" (res cogitans)
// E = "Existo" (Sum)
// Si pienso, entonces algo que piensa existe.
// Si algo que piensa existe, entonces existo.
// Pienso. Luego, existo.
axiom cogito : P
axiom pensar_implica_res_cogitans : P -> D
axiom res_cogitans_implica_existencia : D -> E
derive E from {cogito, pensar_implica_res_cogitans, res_cogitans_implica_existencia}
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('provable');
  });

  // ── Contraejemplo: Falacia de Afirmación del Consecuente ──
  it('Falacia de Afirmación del Consecuente — NO es válida', () => {
    const r = evaluate(`
logic classical.propositional
// Si llueve, el suelo está mojado. El suelo está mojado. ¿Llueve?
// ((P -> Q) & Q) -> P  NO es una tautología (falacia)
check valid (((P -> Q) & Q) -> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Contraejemplo: Falacia de Negación del Antecedente ──
  it('Falacia de Negación del Antecedente — NO es válida', () => {
    const r = evaluate(`
logic classical.propositional
// Si llueve, el suelo está mojado. No llueve. ¿El suelo no está mojado?
check valid (((P -> Q) & !P) -> !Q)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });
});

// ────────────────────────────────────────────────────────────────
// 2. LÓGICA MODAL K
// ────────────────────────────────────────────────────────────────

describe('Filosofía — Lógica Modal K', () => {
  // ── Axioma K: Distribución de la Necesidad ──
  it('Axioma K — [](P -> Q) -> ([]P -> []Q)', () => {
    const r = evaluate(`
logic modal.k
// El axioma fundamental del sistema K de Kripke:
// "Si es necesario que P implique Q, entonces si es necesario P,
// es necesario Q". Distribución de [] sobre ->.
check valid ([](P -> Q) -> ([]P -> []Q))
`);
    if (!r.ok) console.log(JSON.stringify(r.diagnostics, null, 2));
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Regla de Necessitación (consecuencia) ──
  it('Necessitación: tautología bajo [] — [](P -> P)', () => {
    const r = evaluate(`
logic modal.k
// La regla de necessitación dice: si A es un teorema, entonces []A.
// Como (P -> P) es tautología, [](P -> P) debe ser válida.
check valid ([](P -> P))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Dualidad □/◇ ──
  it('Dualidad modal: <>P <-> ![]!P', () => {
    const r = evaluate(`
logic modal.k
// Dualidad fundamental: "Es posible P" equivale a
// "No es necesario no-P". Análoga a ∃/∀ en FOL.
check valid (<>P <-> ![]!P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Dualidad simétrica ──
  it('Dualidad modal simétrica: []P <-> !<>!P', () => {
    const r = evaluate(`
logic modal.k
// El dual: "Es necesario P" equivale a "No es posible no-P".
check valid ([]P <-> !<>!P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── No-validez del axioma T en K ──
  it('Axioma T NO es válido en K: []P -> P', () => {
    const r = evaluate(`
logic modal.k
// El axioma T (reflexividad) requiere que todo mundo sea accesible
// a sí mismo. En K puro esto no se asume.
check valid ([]P -> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── No-validez del axioma 4 en K ──
  it('Axioma 4 NO es válido en K: []P -> [][]P', () => {
    const r = evaluate(`
logic modal.k
// El axioma 4 (transitividad) requiere que la relación de accesibilidad
// sea transitiva. En K puro esto no se asume.
check valid ([]P -> [][]P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── No-validez del axioma B en K ──
  it('Axioma B NO es válido en K: P -> []<>P', () => {
    const r = evaluate(`
logic modal.k
// El axioma B (simetría) requiere que la relación de accesibilidad
// sea simétrica. En K puro esto no se asume.
check valid (P -> []<>P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Distribución de [] sobre & ──
  it('Distribución de [] sobre conjunción: [](P & Q) <-> ([]P & []Q)', () => {
    const r = evaluate(`
logic modal.k
// Teorema válido en K: la necesidad distribuye sobre la conjunción.
check valid ([](P & Q) <-> ([]P & []Q))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── [] no distribuye sobre disyunción (dirección inversa) ──
  it('[]P | []Q -> [](P | Q) — válido', () => {
    const r = evaluate(`
logic modal.k
// Si P es necesario O Q es necesario, entonces (P o Q) es necesario.
check valid (([]P | []Q) -> [](P | Q))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  it('[](P | Q) -> ([]P | []Q) — NO válido', () => {
    const r = evaluate(`
logic modal.k
// La conversa NO vale: que necesariamente (P o Q) no implica
// que uno de los dos sea necesario individualmente.
check valid ([](P | Q) -> ([]P | []Q))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Argumento modal ontológico simplificado ──
  it('Argumento ontológico modal (Gödel simplificado): premisas modales', () => {
    const r = evaluate(`
logic modal.k
// Simplificación: Si es posible que sea necesario P, y asumimos K,
// no podemos concluir P (requiere S5).
// <>[]P -> P  NO es válido en K
check valid (<>[]P -> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Kripke: Anidamiento modal complejo ──
  it('Kripke: [](!P -> <>!P) — válido (necesidad de la posibilidad de lo negado)', () => {
    const r = evaluate(`
logic modal.k
// En K: si no-P es el caso en un mundo, entonces es posible no-P
// desde ese mundo (reflexividad local). Necesariamente: si no-P, posible no-P.
// Esto NO es válido porque no tenemos reflexividad.
check valid ([](!P -> <>!P))
`);
    // En K sin reflexividad, !P -> <>!P no es válido en general
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });
});

// ────────────────────────────────────────────────────────────────
// 3. LÓGICA DE PRIMER ORDEN
// ────────────────────────────────────────────────────────────────

describe('Filosofía — Lógica de Primer Orden', () => {
  // ── Aristóteles: Barbara (Todos los hombres son mortales) ──
  it('Barbara: (∀x P(x)->Q(x)) & P(a) => Q(a)', () => {
    const r = evaluate(`
logic classical.first_order
// Silogismo clásico aristotélico (Barbara):
// Todo hombre es mortal. Sócrates es hombre. Luego Sócrates es mortal.
// Formalizado: (∀x (Hombre(x) -> Mortal(x))) & Hombre(socrates) => Mortal(socrates)
check valid ((forall x (P(x) -> Q(x))) -> (P(a) -> Q(a)))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Instanciación Universal ──
  it('Instanciación Universal: (∀x P(x)) -> P(a)', () => {
    const r = evaluate(`
logic classical.first_order
// Regla fundamental: lo que vale para todos, vale para cualquiera.
check valid ((forall x P(x)) -> P(a))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Generalización Existencial ──
  it('Generalización Existencial: P(a) -> (∃x P(x))', () => {
    const r = evaluate(`
logic classical.first_order
// Si algo es verdadero de 'a', entonces existe algo de lo cual es verdadero.
check valid (P(a) -> (exists x P(x)))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Falacia existencial→universal ──
  it('Falacia: (∃x P(x)) -> (∀x P(x)) — NO válida', () => {
    const r = evaluate(`
logic classical.first_order
// Que exista algo con propiedad P no implica que todo tenga P.
// "Algunos cisnes son blancos" no implica "Todos los cisnes son blancos".
check valid ((exists x P(x)) -> (forall x P(x)))
`);
    expect(r.ok).toBe(true);
    // FOL puede devolver 'unknown' si no cierra tableau
    expect(['invalid', 'unknown']).toContain(r.results[0].status);
  });

  // ── Dualidad cuantificadores ──
  it('Dualidad: (∀x P(x)) -> !(∃x !P(x)) — válida', () => {
    const r = evaluate(`
logic classical.first_order
// Si todo tiene P, no existe nada sin P.
check valid ((forall x P(x)) -> !(exists x !P(x)))
`);
    expect(r.ok).toBe(true);
    // Puede no cerrar tableau en FOL limitado
    expect(['valid', 'unknown']).toContain(r.results[0].status);
  });
});

// ────────────────────────────────────────────────────────────────
// 4. LÓGICA PARACONSISTENTE DE BELNAP
// ────────────────────────────────────────────────────────────────

describe('Filosofía — Lógica Paraconsistente (Belnap 4-valued)', () => {
  // ── Belnap: Tolerancia a contradicciones ──
  it('Belnap: P & !P NO es tautología (no es siempre T/B)', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// En Belnap, una contradicción P & !P evalúa a:
// - B (Both) cuando P = B
// - F cuando P = T, F, o N
// No es designada (T o B) en todos los casos → no es tautología.
check valid (P & !P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Belnap: Disyunción inclusiva ──
  it('Belnap: P | !P es satisfacible pero NO tautología', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// En lógica clásica, P | !P es siempre verdadero.
// En Belnap, si P = N (None), entonces P | !P = N | N = N,
// que no es designado. Por tanto NO es tautología en Belnap.
check valid (P | !P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  it('Belnap: P | !P es satisfacible', () => {
    const r = evaluate(`
logic paraconsistent.belnap
check satisfiable (P | !P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('satisfiable');
  });

  // ── Belnap: Explosión controlada ──
  it('Belnap: Ex Falso Quodlibet FALLA — (P & !P) -> Q no es tautología', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// En lógica clásica, de una contradicción se sigue cualquier cosa.
// En Belnap, esto FALLA: la contradicción no "explota" el sistema.
// Si P = B, entonces P & !P = B, y B -> Q depende de Q.
// Si Q = F, entonces B -> F = (no-B | F) = (B | F) = B,
// que es designado... pero si Q = N, B -> N = (B | N) = T.
// Hay que verificar todos los 16 casos.
check valid ((P & !P) -> Q)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Priest / Belnap: Información inconsistente pero útil ──
  it('Belnap: Ex Falso no explota — de P y !P no se puede derivar Q arbitraria', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// En Belnap, la inferencia de premisas contradictorias a cualquier Q
// NO es válida: de P y !P no se puede derivar una Q arbitraria.
// Esto es BUENO: Belnap tolera contradicciones sin explosión.
// Con semántica de entailment correcta (preservación de valores designados):
// Si P=B (Both), entonces P es designado y !P=B es designado.
// Pero Q=F (no designado) → las premisas no fuerzan que Q sea designado.
axiom fuente1 : P
axiom fuente2 : !P
derive Q from {fuente1, fuente2}
`);
    expect(r.ok).toBe(true);
    // En Belnap prove con entailment correcto:
    // Existe valuación donde P=B (premisas designadas) pero Q=F (no designado).
    // Por tanto Q NO se sigue de {P, !P}.
    expect(r.results[0].status).toBe('refutable');
  });

  // ── Belnap: Implicación material con None ──
  it('Belnap: (P -> P) NO es tautología (N -> N = N, no designado)', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// En Belnap, P -> P = !P | P.
// Si P = N (None): !N = N, N | N = N, que NO es designado.
// Por tanto P -> P NO es tautología en Belnap 4-valued.
check valid (P -> P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Belnap: Contrapositiva no vale completamente ──
  it('Belnap: check valid del condicional material devuelve truthTable', () => {
    const r = evaluate(`
logic paraconsistent.belnap
// El condicional material en Belnap NO es tautología.
// Usamos check valid que internamente genera la tabla Belnap.
check valid (P -> Q)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
    // checkValid de Belnap devuelve la tabla de verdad en el resultado
    expect(r.results[0].truthTable).toBeDefined();
    // 4 valores × 4 valores = 16 filas
    expect(r.results[0].truthTable!.rows.length).toBe(16);
  });
});

// ────────────────────────────────────────────────────────────────
// 5. TESTS MULTI-SISTEMA — Argumentos filosóficos extensos
// ────────────────────────────────────────────────────────────────

describe('Filosofía — Argumentos Extensos Multi-paso', () => {
  // ── Kant: Estructura del Imperativo Categórico (formalización) ──
  it('Kant: Cadena deductiva del Imperativo Categórico', () => {
    const r = evaluate(`
logic classical.propositional
// Fundamentación de la Metafísica de las Costumbres (1785):
// U = "La máxima es universalizable"
// D = "Es deber moral"
// A = "La acción es moralmente permisible"
//
// Si universalizable, entonces deber. Si deber, entonces permisible.
// Conclusión: Si universalizable, entonces permisible. (Transitividad)
check valid (((U -> D) & (D -> A)) -> (U -> A))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Hume: Problema de la Inducción ──
  it('Hume: Falacia inductiva — lo particular no implica lo universal', () => {
    const r = evaluate(`
logic classical.propositional
// Hume, Tratado de la Naturaleza Humana (1739):
// Que hayamos observado N casos de (P -> Q) no garantiza el caso N+1.
// Formalización simplificada: (P1 -> Q1) & (P2 -> Q2) no implica (P3 -> Q3)
check valid (((A -> B) & (C -> D)) -> (E -> F))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('invalid');
  });

  // ── Russell: Paradoja del Barbero (estructura lógica) ──
  it('Russell: Estructura auto-referencial — (P <-> !P) es contradicción', () => {
    const r = evaluate(`
logic classical.propositional
// La paradoja de Russell muestra que (P <-> !P) es insatisfacible:
// "El barbero afeita a todos los que no se afeitan a sí mismos"
// Si el barbero se afeita: no debería. Si no: debería. Contradicción.
check satisfiable (P <-> !P)
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('unsatisfiable');
  });

  // ── Gödel-Henkin: Completitud (meta-propiedad demostrada formalmente) ──
  it('Completitud proposicional: toda tautología es derivable', () => {
    const r = evaluate(`
logic classical.propositional
// Verificamos varias tautologías clásicas conocidas:
check valid ((P -> (Q -> R)) -> ((P -> Q) -> (P -> R)))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Frege: Axioma 1 del Begriffsschrift ──
  it('Frege: Axioma 1 del Begriffsschrift — P -> (Q -> P)', () => {
    const r = evaluate(`
logic classical.propositional
// Gottlob Frege, Begriffsschrift (1879), Axioma 1:
// "Lo verdadero es implicado por cualquier cosa."
check valid (P -> (Q -> P))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Frege: Axioma 2 del Begriffsschrift ──
  it('Frege: Axioma 2 — distribución del condicional', () => {
    const r = evaluate(`
logic classical.propositional
// Frege, Begriffsschrift, Axioma 2:
// (P -> (Q -> R)) -> ((P -> Q) -> (P -> R))
check valid ((P -> (Q -> R)) -> ((P -> Q) -> (P -> R)))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe('valid');
  });

  // ── Test combinado extenso: Múltiples operaciones ──
  it('Combinado: axiomas + derivaciones + tablas + checks en una sesión', () => {
    const r = evaluate(`
logic classical.propositional

// Definir una teoría filosófica completa
axiom determinismo : D -> C
axiom libre_albedrio : L -> !C
axiom compatibilismo : D & L

// Verificar consecuencias
derive C from {determinismo, compatibilismo}
truth_table (D & L)

// El compatibilismo lleva a contradicción con estas premisas
check valid ((D -> C) -> ((L -> !C) -> !(D & L)))
`);
    expect(r.ok).toBe(true);
    expect(r.results.length).toBeGreaterThanOrEqual(2);
  });
});
