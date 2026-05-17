// ============================================================
// ST Anti-Unification — Barrel de exportaciones
// ============================================================

export type { Term, AntiUnificationResult, FreshSupply } from './types';

export { antiUnify, defaultFreshSupply } from './anti-unify';

export { termEquals, termKey, varsOf, applySubst, termSize, v, f, c } from './term-utils';

export { antiUnifyMany, antiUnifyManyDetailed, generalizationOrder } from './many';

export type { AntiUnificationManyResult } from './many';
