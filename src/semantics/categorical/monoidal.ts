// ============================================================
// ST Categorical — Monoidal Category (FinSet con producto ×)
// ============================================================
// Construcción concreta de la categoría monoidal estricta
// (FinSet, ×, 1) donde 1 = {*} y A×B se define elemento a elemento.
// Verifica unitor izquierdo / derecho y asociador por igualdad
// estricta sobre los carriers (suficiente porque elegimos los
// nombres canónicos: "*∥x" se mapea a "x", etc.).
// ============================================================

import type { MonoidalCategory } from './types';
import { FinSet, mkFinSetMor, type FinSetMor, type FinSetObj } from './fin-set';

/**
 * Construye la categoría monoidal (FinSet, ×, 1). Recibe la lista
 * de objetos generadores; añade automáticamente la unidad 1.
 *
 * Esta versión es estricta hasta isomorfismo canónico: los unitores
 * y asociador se comprueban por igualdad estructural de los
 * elementos serializados (`x` vs `*∥x` vs `x∥*`), siguiendo la
 * convención `mkProductObj`. En lugar de verificar conmutatividad
 * de diagramas complejos, comparamos los carriers normalizados.
 */
export function FinSetMonoidal(
  objs: ReadonlyArray<FinSetObj>,
  generators: ReadonlyArray<FinSetMor> = [],
): MonoidalCategory<FinSetObj, FinSetMor> {
  const unit: FinSetObj = { name: '1', elements: ['*'] };
  const allObjs = [unit, ...objs];

  // Cerramos productos relevantes para que verifyAssociator/unitors
  // puedan buscar objetos producto sin construir uno nuevo cada vez.
  const objsByName = new Map<string, FinSetObj>();
  for (const o of allObjs) objsByName.set(o.name, o);

  function productObj(a: FinSetObj, b: FinSetObj): FinSetObj {
    const name = `${a.name}×${b.name}`;
    const cached = objsByName.get(name);
    if (cached) return cached;
    const elements: string[] = [];
    for (const x of a.elements) {
      for (const y of b.elements) {
        elements.push(`${x}∥${y}`);
      }
    }
    const o: FinSetObj = { name, elements };
    objsByName.set(name, o);
    return o;
  }

  // Generar tensorial de unidades y de generators para asegurar
  // que la categoría base tenga las identidades para esos objetos.
  const expandedObjs: FinSetObj[] = [...allObjs];
  for (const a of allObjs) {
    for (const b of allObjs) {
      const p = productObj(a, b);
      if (!expandedObjs.some((o) => o.name === p.name)) expandedObjs.push(p);
    }
  }

  const baseCat = FinSet(expandedObjs, generators);

  function tensor(a: FinSetObj, b: FinSetObj): FinSetObj {
    return productObj(a, b);
  }

  function tensorMor(f: FinSetMor, g: FinSetMor): FinSetMor {
    // f×g : A×B → A'×B', (a,b) ↦ (f(a), g(b))
    const aObj = Array.from(baseCat.objects).find((o) => o.name === f.src);
    const bObj = Array.from(baseCat.objects).find((o) => o.name === g.src);
    const aTgt = Array.from(baseCat.objects).find((o) => o.name === f.tgt);
    const bTgt = Array.from(baseCat.objects).find((o) => o.name === g.tgt);
    if (!aObj || !bObj || !aTgt || !bTgt) throw new Error(`FinSetMonoidal tensorMor: unknown object in ${f.id} or ${g.id}`);
    const prodSrc = productObj(aObj, bObj);
    const prodTgt = productObj(aTgt, bTgt);
    const table: Record<string, string> = {};
    for (const x of aObj.elements) {
      for (const y of bObj.elements) {
        table[`${x}∥${y}`] = `${f.fn.get(x) ?? ''}∥${g.fn.get(y) ?? ''}`;
      }
    }
    // Asegurar que los objetos producto existan en la categoría base.
    if (!baseCat.objects.has(prodSrc) || !baseCat.objects.has(prodTgt)) {
      // No deberían faltar con expandedObjs, pero como salvaguarda
      // devolvemos un morfismo standalone.
    }
    return mkFinSetMor(
      `${f.id.split(':').pop()}×${g.id.split(':').pop()}`,
      prodSrc,
      prodTgt,
      table,
    );
  }

  function verifyLeftUnitor(): boolean {
    // 1⊗A debe ser isomorfo a A. Concretamente: el carrier de 1×A es
    // { "*∥a" | a∈A }, en biyección con A vía "*∥a" ↔ a.
    for (const a of allObjs) {
      const oneA = tensor(unit, a);
      if (oneA.elements.length !== a.elements.length) return false;
      // Cada elemento "*∥a" debe corresponder con un a en A.
      const matches = oneA.elements.every((el) => {
        const [u, x] = el.split('∥');
        return u === '*' && a.elements.includes(x ?? '');
      });
      if (!matches) return false;
    }
    return true;
  }

  function verifyRightUnitor(): boolean {
    for (const a of allObjs) {
      const aOne = tensor(a, unit);
      if (aOne.elements.length !== a.elements.length) return false;
      const matches = aOne.elements.every((el) => {
        const [x, u] = el.split('∥');
        return u === '*' && a.elements.includes(x ?? '');
      });
      if (!matches) return false;
    }
    return true;
  }

  function verifyAssociator(): boolean {
    // (A⊗B)⊗C y A⊗(B⊗C) deben tener carriers en biyección canónica.
    for (const a of allObjs) {
      for (const b of allObjs) {
        for (const c of allObjs) {
          const lhs = tensor(tensor(a, b), c);
          const rhs = tensor(a, tensor(b, c));
          if (lhs.elements.length !== rhs.elements.length) return false;
          // Asociador: "(x∥y)∥z" ↔ "x∥(y∥z)". Como nuestro encoding es
          // strings con ∥ izquierda-asociativo, normalizamos quitando
          // separadores y comparando.
          const lset = new Set(lhs.elements.map((s) => s.replaceAll('∥', '|')));
          const rset = new Set(rhs.elements.map((s) => s.replaceAll('∥', '|')));
          if (lset.size !== rset.size) return false;
          for (const s of lset) if (!rset.has(s)) return false;
        }
      }
    }
    return true;
  }

  return {
    ...baseCat,
    name: 'FinSet⊗',
    unit,
    tensor,
    tensorMor,
    verifyLeftUnitor,
    verifyRightUnitor,
    verifyAssociator,
  };
}
