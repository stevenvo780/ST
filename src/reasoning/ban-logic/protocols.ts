// ============================================================
// BAN Logic — Catálogo de protocolos
// ============================================================
//
// Protocolos clásicos modelados en estilo BAN para validar el motor.
//
// - Needham-Schroeder symmetric (1978): autenticación basada en
//   servidor de confianza. BAN-correcto bajo assumptions estándar
//   (frescura de los nonces).
//
// - Needham-Schroeder public-key (1978): el famoso protocolo con
//   el "Lowe attack" (1995). Sin las correcciones de Lowe, NO logra
//   autenticar B con A (deja un goal sin probar). Lo modelamos así
//   para que `analyzeProtocol` lo refleje.
//
// - Kerberos (variant clásica simplificada): cliente C, servidor S
//   con la KDC, autenticación mutua.

import {
  believes,
  controls,
  encrypted,
  fresh,
  jurisdiction,
  key,
  message,
  nonce,
  principal,
  saidMessage,
  sees,
  sharedKey,
} from './terms';
import type { BANFormula, Protocol } from './types';

/**
 * Needham-Schroeder shared-key (simplificado para BAN).
 *
 * 1. A → S : A, B, N_a
 * 2. S → A : {N_a, K_ab, B, {K_ab, A}_{K_bs}}_{K_as}
 * 3. A → B : {K_ab, A}_{K_bs}
 * 4. B → A : {N_b}_{K_ab}
 * 5. A → B : {N_b - 1}_{K_ab}   (representamos como nonce(N_b'))
 */
export function needhamSchroederSymmetric(): Protocol {
  const A = principal('A');
  const B = principal('B');
  const S = principal('S');

  const N_a = nonce('N_a');
  const N_b = nonce('N_b');
  const N_b_prime = nonce("N_b'");
  const K_ab = key('K_ab', ['A', 'B']);
  const K_as = key('K_as', ['A', 'S']);
  const K_bs = key('K_bs', ['B', 'S']);

  // Goal final: A cree que B cree K_ab (autenticación mutua de la clave).
  const goal1: BANFormula = believes(A, believes(B, sharedKey(A, B, K_ab)));
  const goal2: BANFormula = believes(B, believes(A, sharedKey(A, B, K_ab)));

  return {
    name: 'Needham-Schroeder-symmetric',
    participants: ['A', 'B', 'S'],
    initialAssumptions: [
      // Claves compartidas con S.
      believes(A, sharedKey(A, S, K_as)),
      believes(B, sharedKey(B, S, K_bs)),
      believes(S, sharedKey(A, S, K_as)),
      believes(S, sharedKey(B, S, K_bs)),
      // S decide la clave (jurisdicción).
      believes(A, controls(S, sharedKey(A, B, K_ab))),
      believes(B, controls(S, sharedKey(A, B, K_ab))),
      // S cree la clave que él mismo emite.
      believes(S, sharedKey(A, B, K_ab)),
      // Frescuras.
      believes(A, fresh(N_a)),
      believes(B, fresh(N_b)),
      believes(S, fresh(K_ab)),
      believes(A, fresh(K_ab)),
      // En el handshake nonce N_b, A confirma que sigue vivo. Para que
      // B termine creyendo K_ab cree A, B asume frescura de la sesión
      // como sigue:
      believes(B, fresh(N_b_prime)),
    ],
    steps: [
      // Idealización paso 2: S → A : { N_a, K_ab, A↔K_ab B }_{K_as}
      {
        from: 'S',
        to: 'A',
        message: encrypted(message(N_a, K_ab), K_as),
      },
      // Idealización paso 3: A → B : { K_ab, A↔K_ab B }_{K_bs}
      {
        from: 'A',
        to: 'B',
        message: encrypted(K_ab, K_bs),
      },
      // Idealización paso 4: B → A : { N_b, A↔K_ab B }_{K_ab}
      {
        from: 'B',
        to: 'A',
        message: encrypted(message(N_b), K_ab),
      },
      // Idealización paso 5: A → B : { N_b', A↔K_ab B }_{K_ab}
      {
        from: 'A',
        to: 'B',
        message: encrypted(message(N_b_prime), K_ab),
      },
    ],
    goals: [goal1, goal2],
  };
}

/**
 * Needham-Schroeder public-key (Lowe attack territory).
 *
 * Original:
 *   1. A → B : {N_a, A}_{K_b}
 *   2. B → A : {N_a, N_b}_{K_a}
 *   3. A → B : {N_b}_{K_b}
 *
 * El "Lowe attack" (1995) muestra que un atacante M puede intercalar
 * y hacer creer a B que está hablando con A cuando en realidad A
 * habla con M. Modelamos el protocolo TAL CUAL, sin la corrección
 * de Lowe; el resultado: el goal "B|≡A|≡(sesión con B)" NO se
 * deriva.
 */
export function needhamSchroederPublicKey(): Protocol {
  const A = principal('A');
  const B = principal('B');

  const N_a = nonce('N_a');
  const N_b = nonce('N_b');
  // Claves públicas modeladas como `key` con shared = [owner, owner]
  // como hack mnemotécnico; el motor usa `publicKey` para R2.
  const K_a = key('K_a');
  const K_b = key('K_b');

  // En BAN original con Lowe: el goal de B "A cree que está hablando
  // con B" no se cumple sin Lowe-fix. Lo dejamos como goal para que el
  // análisis lo reporte como UNSATISFIED.
  const goalA: BANFormula = believes(A, believes(B, sees(B, N_a)));
  const goalB: BANFormula = believes(B, believes(A, sees(A, N_b)));

  return {
    name: 'Needham-Schroeder-public-key',
    participants: ['A', 'B'],
    initialAssumptions: [
      // Nadie comparte secret state inicial real con el otro; solo PKs.
      // Modelamos como sharedKey "público" para R1 (BAN no distingue
      // semánticamente shared vs public para el análisis de pares).
      believes(A, { kind: 'publicKey', principal: B, key: K_b }),
      believes(B, { kind: 'publicKey', principal: A, key: K_a }),
      believes(A, fresh(N_a)),
      believes(B, fresh(N_b)),
    ],
    steps: [
      // 1. A → B : {N_a, A}_{K_b}
      { from: 'A', to: 'B', message: encrypted(message(N_a, A), K_b) },
      // 2. B → A : {N_a, N_b}_{K_a}   ← OJO: NO incluye B (origen del Lowe attack)
      { from: 'B', to: 'A', message: encrypted(message(N_a, N_b), K_a) },
      // 3. A → B : {N_b}_{K_b}
      { from: 'A', to: 'B', message: encrypted(N_b, K_b) },
    ],
    goals: [goalA, goalB],
  };
}

/**
 * Kerberos (simplificación BAN).
 *
 * 1. C → S : C, T, N_c
 * 2. S → C : {N_c, T_C, K_ct}_{K_cs}, {C, T_C, K_ct}_{K_ts}
 * 3. C → T : {C, T_C, K_ct}_{K_ts}, {C, t}_{K_ct}
 * 4. T → C : {t + 1}_{K_ct}
 *
 * Goal: C cree que T comparte K_ct con C; T cree lo mismo.
 */
export function kerberos(): Protocol {
  const C = principal('C');
  const T = principal('T');
  const S = principal('S');

  const N_c = nonce('N_c');
  const t = nonce('t');
  const K_cs = key('K_cs', ['C', 'S']);
  const K_ts = key('K_ts', ['T', 'S']);
  const K_ct = key('K_ct', ['C', 'T']);

  const goalC: BANFormula = believes(C, sharedKey(C, T, K_ct));
  const goalT: BANFormula = believes(T, sharedKey(C, T, K_ct));

  return {
    name: 'Kerberos',
    participants: ['C', 'T', 'S'],
    initialAssumptions: [
      believes(C, sharedKey(C, S, K_cs)),
      believes(T, sharedKey(T, S, K_ts)),
      believes(S, sharedKey(C, S, K_cs)),
      believes(S, sharedKey(T, S, K_ts)),
      believes(C, controls(S, sharedKey(C, T, K_ct))),
      believes(T, controls(S, sharedKey(C, T, K_ct))),
      believes(S, sharedKey(C, T, K_ct)),
      believes(C, fresh(N_c)),
      believes(T, fresh(t)),
      believes(C, fresh(K_ct)),
      believes(T, fresh(K_ct)),
    ],
    steps: [
      // 2. S → C : { N_c, K_ct }_{K_cs}
      { from: 'S', to: 'C', message: encrypted(message(N_c, K_ct), K_cs) },
      // 3. C → T : { C, K_ct }_{K_ts}
      { from: 'C', to: 'T', message: encrypted(message(C, K_ct), K_ts) },
      // 3b. C → T : { t }_{K_ct}
      { from: 'C', to: 'T', message: encrypted(t, K_ct) },
    ],
    goals: [goalC, goalT],
  };
}

// Exports de utilidades para referencia rápida en tests:
export const protocolUtils = {
  believes,
  sharedKey,
  publicKey: (p: ReturnType<typeof principal>, k: ReturnType<typeof key>): BANFormula => ({
    kind: 'publicKey',
    principal: p,
    key: k,
  }),
  jurisdiction,
  saidMessage,
  fresh,
  encrypted,
  sees,
  message,
  nonce,
  key,
  principal,
  controls,
};
