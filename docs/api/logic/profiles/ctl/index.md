# `logic/profiles/ctl/index.ts`

============================================================ ST CTL — punto de entrada público del perfil. ============================================================ API:   modelCheckCTL(M, φ)   → Map<stateId, holds>   satisfiesCTL(M, φ)    → boolean (φ vale en todos los iniciales)   generateWitness(M, φ, state) → string[] | null   ctlToString(φ)        → notación textual La estructura de Kripke se asume finita. El algoritmo de labelling es O(|φ| · (|S| + |R|)). ============================================================
