import { describe, expect, it } from 'vitest';
import { analyzeConflict1UIP, NO_ANTECEDENT } from '../../solver/cdcl-v2';

describe('analyzeConflict1UIP', () => {
  it('produces empty learned + btLevel=-1 when conflict at root level (DL=0)', () => {
    const r = analyzeConflict1UIP(0, {
      clauses: [new Int32Array([1, 2])],
      trail: [1, 2],
      currentLevel: 0,
      varLevel: new Int32Array([0, 0, 0]),
      varAnte: new Int32Array([NO_ANTECEDENT, NO_ANTECEDENT, NO_ANTECEDENT]),
    });
    expect(r.learned.length).toBe(0);
    expect(r.btLevel).toBe(-1);
  });

  it('learns the negation of a unique decision when conflict at DL=1 with single var at current level', () => {
    // Escenario: a (decisión nivel 1) propaga b en nivel 1 vía cláusula (¬a, b).
    // Otra cláusula (¬a, ¬b) entra en conflicto al estar a, b ambas true.
    // Trail: [a@1, b@1]. Antecedent de b = clauses[0]. Antecedent de a = -1.
    // Conflicto en clauses[1] = (¬a, ¬b).
    //
    // 1UIP analysis:
    //   - Empezamos por (¬a, ¬b): seen={a,b}, counter=2 (ambas DL=1).
    //   - Trail back: b → counter=1, varAnte[b]=clauses[0]=(¬a,b). addLits sin var b ⇒ a ya está seen, skip.
    //   - Trail back: a → counter=0, assertLit = -a.
    // Aprendido: [-a]. btLevel=0.
    const r = analyzeConflict1UIP(1, {
      clauses: [
        new Int32Array([-1, 2]), // antecedente de b
        new Int32Array([-1, -2]), // conflicto
      ],
      trail: [1, 2],
      currentLevel: 1,
      // a en nivel 1, b en nivel 1
      varLevel: new Int32Array([-1, 1, 1]),
      varAnte: new Int32Array([NO_ANTECEDENT, NO_ANTECEDENT, 0]),
    });
    expect(Array.from(r.learned)).toEqual([-1]);
    expect(r.btLevel).toBe(0);
    expect(r.bumped).toContain(1);
    expect(r.bumped).toContain(2);
  });

  it('returns a non-trivial learned clause spanning multiple decision levels', () => {
    // Vars: 1, 2 decisiones; 3 propagada por (¬1, ¬2, 3); conflicto en (¬2, ¬3).
    // Trail: [1@1, 2@2, 3@2]. Conflicto: (¬2, ¬3).
    // Análisis:
    //   - Empezar por (¬2, ¬3): seen={2,3}, counter=2 (ambos DL=2).
    //   - Trail back desde 3 (top): seen[3]=1 → counter=1. varAnte[3] = (¬1,¬2,3),
    //     addLits sin var 3: 1 está sin marcar y DL=1 ≠ 2 ⇒ outLits=[-1], btLevel=1.
    //     2 ya está marcada, skip.
    //   - Trail back: 2 → counter=0, assertLit = -2.
    // Aprendido: [-2, -1]. btLevel=1.
    const r = analyzeConflict1UIP(1, {
      clauses: [
        new Int32Array([-1, -2, 3]), // antecedente de 3
        new Int32Array([-2, -3]), // conflicto
      ],
      trail: [1, 2, 3],
      currentLevel: 2,
      varLevel: new Int32Array([-1, 1, 2, 2]),
      varAnte: new Int32Array([NO_ANTECEDENT, NO_ANTECEDENT, NO_ANTECEDENT, 0]),
    });
    const lits = Array.from(r.learned);
    expect(lits).toContain(-2);
    expect(lits).toContain(-1);
    expect(lits[0]).toBe(-2); // asserting lit primero
    expect(r.btLevel).toBe(1);
    // bumped debe haber tocado las tres variables
    expect(new Set(r.bumped)).toEqual(new Set([1, 2, 3]));
  });
});
