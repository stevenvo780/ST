// ============================================================
// BAN Logic — Reglas de inferencia
// ============================================================
//
// 10 reglas estándar BAN (1989) operando sobre un estado de creencias.
// Cada regla intenta producir UNA nueva fórmula a partir del estado.
// Si la regla no aplica, devuelve null.
//
// Convención: cada regla recibe `state` (lista de fórmulas conocidas)
// y un foco opcional `beliefP` (el principal P sobre cuyo punto de
// vista estamos razonando, si la regla lo necesita).
//
// Reglas:
//   R1  message-meaning (shared key)
//       P|≡ A↔K B  ,  P◁ {X}_K     ⇒  P|≡ A|~ X
//   R2  message-meaning (public key)
//       P|≡ |→K Q  ,  P◁ {X}_{K^-1} ⇒  P|≡ Q|~ X
//       (modelamos con encryption con key inversa; ver más abajo)
//   R3  message-meaning (shared secret)
//       P|≡ A⇌Y B  ,  P◁ <X>_Y     ⇒  P|≡ A|~ X
//   R4  nonce-verification
//       P|≡ #X  ,  P|≡ Q|~ X       ⇒  P|≡ Q|≡ X
//   R5  jurisdiction
//       P|≡ Q|⇒ X  ,  P|≡ Q|≡ X    ⇒  P|≡ X
//   R6  belief-conjunction (descomposición y composición)
//       P|≡ (X ∧ Y)                ⇒  P|≡ X  ,  P|≡ Y
//   R7  said-conjunction
//       P|≡ Q|~ (X ∧ Y)            ⇒  P|≡ Q|~ X  ,  P|≡ Q|~ Y
//   R8  freshness-propagation
//       P|≡ #X                     ⇒  P|≡ #(X, Y) (cuando X aparece en compound)
//   R9  seeing-compound (descomposición de mensajes vistos)
//       P◁ <X, Y>                  ⇒  P◁ X , P◁ Y
//   R10 seeing-encrypted (cuando P tiene la clave)
//       P◁ {X}_K  ,  P|≡ A↔K P     ⇒  P◁ X
//
// Implementación: cada `applyXxx` busca un par de fórmulas en `state`
// que satisfaga las premisas y devuelve la conclusión. Para enumerar
// todas las nuevas creencias, ver `saturate()` en `analyze.ts`.

import { formulaEquals, hasFormula, termEquals } from './terms';
import type { BANFormula, BANTerm } from './types';

/**
 * R1 — Message-meaning (shared key).
 *
 * Si P cree A↔K B y P ve {X}_K, entonces P cree que A dijo X
 * (asumiendo P ≠ originador, y la clave es genuinamente compartida
 * solo entre A y B + posibles autoridades).
 *
 * Devuelve la primera derivación posible o null. La variante que enumera
 * TODAS está en `saturate()`.
 */
export function applyMessageMeaningShared(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  const p = beliefP.principal;

  // Buscar premisa 1: P |≡ A↔K B
  if (beliefP.about.kind !== 'sharedKey') return null;
  const sk = beliefP.about;

  // Buscar premisa 2: P ◁ {X}_K en el state
  for (const f of state) {
    if (f.kind !== 'sees') continue;
    if (!termEquals(f.principal, p)) continue;
    if (f.what.kind !== 'encrypted') continue;
    if (!termEquals(f.what.key, sk.key)) continue;

    // Conclusión: P |≡ A |~ X  (donde A es el OTRO participante, no P)
    // Si P es uno de los participantes de la clave, A es el otro.
    // Si P no participa de la clave, BAN dice "alguien con esa clave
    // dijo X" → tomamos sk.a por defecto.
    const other: BANTerm = termEquals(p, sk.a) ? sk.b : termEquals(p, sk.b) ? sk.a : sk.a;
    return {
      kind: 'believes',
      principal: p,
      about: { kind: 'said-message', principal: other, what: f.what.message },
    };
  }
  return null;
}

/**
 * R2 — Message-meaning (public key).
 *
 * Si P cree |→K Q y P ve {X}_{K^-1} (cifrado con la clave privada de Q),
 * entonces P cree que Q dijo X.
 *
 * Modelo: tratamos `encrypted(X, privateKey_Q)` como "Q firmó X".
 * Convención de naming: si la clave pública se llama K, la privada
 * compartirá el nombre con sufijo "_inv" o es identificable porque
 * el atributo `shared` corresponde a Q.
 *
 * Para simplificar el motor, modelamos firma como `encrypted(X, K)` donde
 * K es la clave pública y publicKey(Q, K). El "sentido directo" en
 * la verdad: solo Q pudo haber producido ese ciphertext porque solo
 * Q tiene la inversa. Así que la regla R2 dice: si P|≡|→K Q y P◁{X}_K
 * entonces P|≡ Q|~ X. Esto es la versión "firma con clave pública".
 */
export function applyMessageMeaningPublic(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  const p = beliefP.principal;
  if (beliefP.about.kind !== 'publicKey') return null;
  const pk = beliefP.about;

  for (const f of state) {
    if (f.kind !== 'sees') continue;
    if (!termEquals(f.principal, p)) continue;
    if (f.what.kind !== 'encrypted') continue;
    if (!termEquals(f.what.key, pk.key)) continue;

    return {
      kind: 'believes',
      principal: p,
      about: { kind: 'said-message', principal: pk.principal, what: f.what.message },
    };
  }
  return null;
}

/**
 * R3 — Message-meaning (shared secret).
 *
 * Si P cree A⇌Y B y P ve un mensaje compound que combina X con Y
 * (modelo `compound([X, Y])`), entonces P cree que A dijo X.
 */
export function applyMessageMeaningSecret(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  const p = beliefP.principal;
  if (beliefP.about.kind !== 'sharedSecret') return null;
  const ss = beliefP.about;

  for (const f of state) {
    if (f.kind !== 'sees') continue;
    if (!termEquals(f.principal, p)) continue;
    if (f.what.kind !== 'compound') continue;
    if (f.what.parts.length < 2) continue;
    // El último parte debe ser el secreto Y; el resto es X.
    const last = f.what.parts[f.what.parts.length - 1];
    if (!last || !termEquals(last, ss.secret)) continue;

    const xParts = f.what.parts.slice(0, -1);
    const x: BANTerm =
      xParts.length === 1 && xParts[0] ? xParts[0] : { kind: 'message', content: xParts };
    const other: BANTerm = termEquals(p, ss.a) ? ss.b : ss.a;
    return {
      kind: 'believes',
      principal: p,
      about: { kind: 'said-message', principal: other, what: x },
    };
  }
  return null;
}

/**
 * R4 — Nonce-verification.
 *
 * Si P cree que X es fresco y P cree que Q dijo X, entonces P cree
 * que Q realmente cree X (porque sólo lo pudo haber dicho recientemente).
 */
export function applyNonceVerification(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  const p = beliefP.principal;

  // Caso A: beliefP es "P |≡ Q |~ X"
  if (beliefP.about.kind === 'said-message') {
    const sm = beliefP.about;
    // Buscar P |≡ #X en state
    for (const f of state) {
      if (f.kind !== 'believes') continue;
      if (!termEquals(f.principal, p)) continue;
      if (f.about.kind !== 'fresh') continue;
      if (!termEquals(f.about.what, sm.what)) continue;

      return {
        kind: 'believes',
        principal: p,
        about: {
          kind: 'believes',
          principal: sm.principal,
          about: { kind: 'sees', principal: sm.principal, what: sm.what },
        },
      };
    }
  }

  // Caso B: beliefP es "P |≡ #X". Buscar said-message.
  if (beliefP.about.kind === 'fresh') {
    const xf = beliefP.about.what;
    for (const f of state) {
      if (f.kind !== 'believes') continue;
      if (!termEquals(f.principal, p)) continue;
      if (f.about.kind !== 'said-message') continue;
      if (!termEquals(f.about.what, xf)) continue;

      return {
        kind: 'believes',
        principal: p,
        about: {
          kind: 'believes',
          principal: f.about.principal,
          about: { kind: 'sees', principal: f.about.principal, what: xf },
        },
      };
    }
  }
  return null;
}

/**
 * R5 — Jurisdiction.
 *
 * Si P cree que Q tiene jurisdicción sobre X (P|≡ Q|⇒ X) y P cree
 * que Q cree X (P|≡ Q|≡ X), entonces P cree X.
 */
export function applyJurisdiction(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  const p = beliefP.principal;

  // Caso A: beliefP es la jurisdicción "P |≡ Q |⇒ X"
  if (beliefP.about.kind === 'controls' || beliefP.about.kind === 'jurisdiction') {
    const ctrl = beliefP.about;
    const q = ctrl.principal;
    const stmt = ctrl.kind === 'controls' ? ctrl.statement : ctrl.over;
    // Buscar P |≡ Q |≡ stmt
    for (const f of state) {
      if (f.kind !== 'believes') continue;
      if (!termEquals(f.principal, p)) continue;
      if (f.about.kind !== 'believes') continue;
      if (!termEquals(f.about.principal, q)) continue;
      if (!formulaEquals(f.about.about, stmt)) continue;

      return { kind: 'believes', principal: p, about: stmt };
    }
  }

  // Caso B: beliefP es "P |≡ Q |≡ X"; buscar la jurisdicción.
  if (beliefP.about.kind === 'believes') {
    const inner = beliefP.about;
    const q = inner.principal;
    const stmt = inner.about;
    for (const f of state) {
      if (f.kind !== 'believes') continue;
      if (!termEquals(f.principal, p)) continue;
      const a = f.about;
      const isCtrl = a.kind === 'controls' || a.kind === 'jurisdiction';
      if (!isCtrl) continue;
      if (!termEquals(a.principal, q)) continue;
      const aStmt = a.kind === 'controls' ? a.statement : a.over;
      if (!formulaEquals(aStmt, stmt)) continue;

      return { kind: 'believes', principal: p, about: stmt };
    }
  }
  return null;
}

/**
 * R10 — Seeing encrypted: si P tiene la clave, ver {X}_K implica ver X.
 */
export function applySeeingEncrypted(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  // beliefP suele ser "P ◁ {X}_K"
  if (beliefP.kind !== 'sees') return null;
  if (beliefP.what.kind !== 'encrypted') return null;
  const p = beliefP.principal;
  const k = beliefP.what.key;
  // Buscar: P |≡ A↔K B donde P ∈ {A,B}, o publicKey de P, o P es authority.
  for (const f of state) {
    if (f.kind !== 'believes') continue;
    if (!termEquals(f.principal, p)) continue;
    if (f.about.kind !== 'sharedKey') continue;
    if (!termEquals(f.about.key, k)) continue;
    if (!termEquals(f.about.a, p) && !termEquals(f.about.b, p)) continue;
    return { kind: 'sees', principal: p, what: beliefP.what.message };
  }
  return null;
}

/**
 * Decomposición de "ver compound": P ◁ <X1,...,Xn>  ⇒  P ◁ Xi  (todos).
 * Devuelve la primera Xi que NO esté ya en state (para evitar duplicados).
 */
export function applySeesCompound(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'sees') return null;
  const p = beliefP.principal;
  const parts =
    beliefP.what.kind === 'message'
      ? beliefP.what.content
      : beliefP.what.kind === 'compound'
        ? beliefP.what.parts
        : null;
  if (!parts) return null;
  for (const part of parts) {
    const cand: BANFormula = { kind: 'sees', principal: p, what: part };
    if (!hasFormula(state, cand)) return cand;
  }
  return null;
}

/**
 * Belief-conjunction descomposición.
 */
export function applyBeliefConjunction(beliefP: BANFormula): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  if (beliefP.about.kind !== 'formula-and') return null;
  // Devolvemos solo la izquierda; la derecha la captura saturate en otra pasada.
  return { kind: 'believes', principal: beliefP.principal, about: beliefP.about.left };
}

export function applyBeliefConjunctionRight(beliefP: BANFormula): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  if (beliefP.about.kind !== 'formula-and') return null;
  return { kind: 'believes', principal: beliefP.principal, about: beliefP.about.right };
}

/**
 * Said-conjunction descomposición.
 */
export function applySaidConjunction(beliefP: BANFormula): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  if (beliefP.about.kind !== 'said') return null;
  if (beliefP.about.what.kind !== 'formula-and') return null;
  return {
    kind: 'believes',
    principal: beliefP.principal,
    about: { kind: 'said', principal: beliefP.about.principal, what: beliefP.about.what.left },
  };
}

/**
 * Propagación de frescura: si P|≡#X y X aparece dentro de un compound C
 * que está en state, entonces P|≡#C.
 */
export function applyFreshnessPropagation(
  state: ReadonlyArray<BANFormula>,
  beliefP: BANFormula,
): BANFormula | null {
  if (beliefP.kind !== 'believes') return null;
  if (beliefP.about.kind !== 'fresh') return null;
  const p = beliefP.principal;
  const xf = beliefP.about.what;

  // Buscar compounds vistos por P que contengan xf.
  for (const f of state) {
    if (f.kind !== 'sees') continue;
    if (!termEquals(f.principal, p)) continue;
    const parts =
      f.what.kind === 'message' ? f.what.content : f.what.kind === 'compound' ? f.what.parts : null;
    if (!parts) continue;
    if (!parts.some((part) => termEquals(part, xf))) continue;
    const candidate: BANFormula = {
      kind: 'believes',
      principal: p,
      about: { kind: 'fresh', what: f.what },
    };
    if (!hasFormula(state, candidate)) return candidate;
  }
  return null;
}

export const RULES_REGISTRY = {
  R1_messageMeaningShared: applyMessageMeaningShared,
  R2_messageMeaningPublic: applyMessageMeaningPublic,
  R3_messageMeaningSecret: applyMessageMeaningSecret,
  R4_nonceVerification: applyNonceVerification,
  R5_jurisdiction: applyJurisdiction,
  R10_seeingEncrypted: applySeeingEncrypted,
} as const;
