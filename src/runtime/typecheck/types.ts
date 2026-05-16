// ============================================================
// ST TypeChecker — Tipos de error tipado
// ============================================================

import type { SourceLocation } from '../../types';

export interface TypeError {
  code: string;       // ej 'TC001'
  severity: 'error' | 'warning';
  message: string;    // mensaje humano
  suggestion?: string; // "did you mean..."
  location: SourceLocation;
}

// Perfil considerado "modal" (permite □ ◇)
export const MODAL_PROFILES = new Set<string>([
  'modal.k',
  'modal.t',
  'modal.s4',
  'modal.s5',
  'epistemic.s5',
  'deontic.standard',
]);

// Perfil considerado "temporal" (permite temporal_next, temporal_until)
export const TEMPORAL_PROFILES = new Set<string>([
  'temporal.ltl',
]);

// Perfil considerado "first-order" (permite forall, exists, predicate)
export const FIRST_ORDER_PROFILES = new Set<string>([
  'classical.first_order',
  'classical.first-order',
  'aristotelian.syllogistic',
]);

// Perfil con soporte aritmético
export const ARITHMETIC_PROFILES = new Set<string>([
  'arithmetic',
]);

// Nombres de perfil normalizados
export type ProfileName = string;
