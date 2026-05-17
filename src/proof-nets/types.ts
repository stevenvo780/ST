// ============================================================
// Proof Nets — Tipos para MLL (Multiplicative Linear Logic)
// ============================================================
//
// Proof nets de Girard: representación gráfica de pruebas en
// linear logic sin "bureaucracy" de orden estructural.
//
// Para MLL puro sólo aparecen dos conectivos:
//   ⊗  (tensor)  — multiplicativo positivo
//   ⅋  (par)     — multiplicativo negativo
//
// Los átomos llevan polaridad explícita (A vs A⊥); la dualidad
// satisface (A⊥)⊥ = A, (A⊗B)⊥ = A⊥ ⅋ B⊥, (A⅋B)⊥ = A⊥ ⊗ B⊥.
//
// Un nodo del net es la ocurrencia de una fórmula en algún punto
// del grafo. Un link une nodos con la semántica habitual:
//   axiom    : dos nodos duales, frescos como hojas del net.
//   cut      : dos nodos duales, no aportan a la conclusión.
//   tensor   : tres nodos {premisa-izq, premisa-der, conclusión}.
//   par      : tres nodos {premisa-izq, premisa-der, conclusión}.
//
// Las conclusiones del net son los ids de los nodos que viven en
// el "borde": ni premisa de tensor/par, ni participan en un cut.

export type Polarity = 'pos' | 'neg';

export type MLLFormula =
  | { kind: 'atom'; name: string; polarity: Polarity }
  | { kind: 'tensor'; left: MLLFormula; right: MLLFormula }
  | { kind: 'par'; left: MLLFormula; right: MLLFormula };

export type LinkKind = 'axiom' | 'cut' | 'tensor' | 'par';

// Ports siempre se almacenan en orden canónico:
//   axiom  : [nodoA, nodoA⊥]   (orden libre, son simétricos)
//   cut    : [nodoA, nodoA⊥]   (orden libre, son simétricos)
//   tensor : [premisaIzq, premisaDer, conclusión]
//   par    : [premisaIzq, premisaDer, conclusión]
export interface ProofNetLink {
  kind: LinkKind;
  ports: number[];
}

export interface ProofNetNode {
  id: number;
  formula: MLLFormula;
}

export interface ProofNet {
  nodes: ProofNetNode[];
  links: ProofNetLink[];
  conclusions: number[];
}

// ---------- Constructores convenientes para fórmulas ----------

export const atomPos = (name: string): MLLFormula => ({
  kind: 'atom',
  name,
  polarity: 'pos',
});

export const atomNeg = (name: string): MLLFormula => ({
  kind: 'atom',
  name,
  polarity: 'neg',
});

export const tensor = (left: MLLFormula, right: MLLFormula): MLLFormula => ({
  kind: 'tensor',
  left,
  right,
});

export const par = (left: MLLFormula, right: MLLFormula): MLLFormula => ({
  kind: 'par',
  left,
  right,
});

// Dualidad lineal: involutiva, distribuye De Morgan sobre ⊗ / ⅋.
export function dual(f: MLLFormula): MLLFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: f.name, polarity: f.polarity === 'pos' ? 'neg' : 'pos' };
    case 'tensor':
      return { kind: 'par', left: dual(f.left), right: dual(f.right) };
    case 'par':
      return { kind: 'tensor', left: dual(f.left), right: dual(f.right) };
  }
}

export function formulaEquals(a: MLLFormula, b: MLLFormula): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'atom':
      return a.name === (b as typeof a).name && a.polarity === (b as typeof a).polarity;
    case 'tensor':
    case 'par': {
      const bb = b as typeof a;
      return formulaEquals(a.left, bb.left) && formulaEquals(a.right, bb.right);
    }
  }
}

export function formulaToString(f: MLLFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.polarity === 'pos' ? f.name : `${f.name}⊥`;
    case 'tensor':
      return `(${formulaToString(f.left)} ⊗ ${formulaToString(f.right)})`;
    case 'par':
      return `(${formulaToString(f.left)} ⅋ ${formulaToString(f.right)})`;
  }
}
