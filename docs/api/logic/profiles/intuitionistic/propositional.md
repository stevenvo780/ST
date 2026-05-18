# `logic/profiles/intuitionistic/propositional.ts`

============================================================ ST Intuitionistic Propositional — Kripke directo ============================================================ Lógica intuicionista (IPC): sin ley del tercero excluido, sin doble negación eliminación. Implementación: enumeración exhaustiva de modelos Kripke finitos (preórdenes con persistencia de átomos). Para fórmulas proposicionales con n átomos, generamos todos los preórdenes de tamaño ≤ k y todas las valuaciones persistentes, verificando si la fórmula se fuerza en la raíz. Corrección: IPC es completa respecto a frames finitos (teorema de completitud de Kripke). ============================================================

## `IntuitionisticPropositional`

> Class · `logic/profiles/intuitionistic/propositional.ts:323`

```ts
export class IntuitionisticPropositional implements LogicProfile
```

