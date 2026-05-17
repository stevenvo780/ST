// ============================================================
// ST Mathlib — Lemas estándar
// Afirmaciones reutilizables con criterio de aplicabilidad.
// ============================================================

import type { AlgebraicStructure, Lemma } from './types';

function hasOps(structure: AlgebraicStructure<unknown>, ...names: string[]): boolean {
  return names.every((n) => structure.operations.has(n));
}

export const STANDARD_LEMMAS: Lemma[] = [
  {
    name: 'group.identity_unique',
    statement: 'En un grupo, la identidad es única.',
    applicableTo: (s) => hasOps(s, 'op'),
    proof: "Si e y e' son ambas identidades, e = e · e' = e'.",
  },
  {
    name: 'group.inverse_unique',
    statement: 'En un grupo, el inverso de cada elemento es único.',
    applicableTo: (s) => hasOps(s, 'op'),
    proof: 'Si b y c son inversos de a, b = b · e = b · (a · c) = (b · a) · c = e · c = c.',
  },
  {
    name: 'group.cancellation_left',
    statement: 'a · b = a · c ⇒ b = c.',
    applicableTo: (s) => hasOps(s, 'op'),
    proof: 'Multiplicando a la izquierda por a⁻¹.',
  },
  {
    name: 'group.inverse_of_product',
    statement: '(a · b)⁻¹ = b⁻¹ · a⁻¹.',
    applicableTo: (s) => hasOps(s, 'op'),
    proof: 'Por verificación directa: (a · b)(b⁻¹ · a⁻¹) = a · (b · b⁻¹) · a⁻¹ = a · a⁻¹ = e.',
  },
  {
    name: 'group.double_inverse',
    statement: '(a⁻¹)⁻¹ = a.',
    applicableTo: (s) => hasOps(s, 'op'),
    proof: 'El inverso de a⁻¹ es a, porque a⁻¹ · a = e.',
  },
  {
    name: 'ring.zero_times_anything',
    statement: '0 · a = a · 0 = 0.',
    applicableTo: (s) => hasOps(s, 'add', 'mul'),
    proof: '0 · a = (0 + 0) · a = 0 · a + 0 · a; cancelando, 0 · a = 0.',
  },
  {
    name: 'ring.neg_one_times',
    statement: '(-1) · a = -a.',
    applicableTo: (s) => hasOps(s, 'add', 'mul'),
    proof: 'a + (-1) · a = (1 + -1) · a = 0 · a = 0, así que (-1) · a = -a.',
  },
  {
    name: 'ring.neg_neg',
    statement: '-(-a) = a.',
    applicableTo: (s) => hasOps(s, 'add'),
    proof: 'Propiedad del grupo abeliano aditivo.',
  },
  {
    name: 'order.reflexive_implies_self_join',
    statement: 'En un poset reflexivo, sup{a,a} = a.',
    applicableTo: (s) => hasOps(s, 'leq') || s.axioms.some((ax) => ax.name === 'reflexive'),
  },
  {
    name: 'field.no_zero_divisors',
    statement: 'En un campo, a · b = 0 ⇒ a = 0 ∨ b = 0.',
    applicableTo: (s) => hasOps(s, 'add', 'mul'),
    proof: 'Si a ≠ 0, multiplicando por a⁻¹ se obtiene b = 0.',
  },
];
