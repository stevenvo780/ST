# `logic/profiles/sequent-lk/cut-elimination.ts`

============================================================ LK — Eliminacion de cortes (Hauptsatz de Gentzen, 1934) ============================================================ El teorema fundamental dice que toda derivacion LK puede transformarse en una sin cortes. La prueba procede por induccion lexicografica sobre (rango, grado) del cut superior:   * rango = altura del cut en el arbol   * grado = profundidad de la formula cortada La implementacion aqui combina dos estrategias:   1. Reducciones "principales": cuando la formula cortada es      principal en ambas premisas, se aplica la regla de      reduccion correspondiente al conectivo (notable: ∧/∨/→/¬).   2. Reduccion estructural: para casos en que la reescritura      directa no aplica (ej. cuts internos en sub-derivaciones      con weakenings/contractions implicitas), reusamos el      prover cut-free `proveLK` como oraculo: por el Hauptsatz,      si el secuente es derivable con cortes, lo es sin ellos,      y `proveLK` es completo para LK clasico cut-free. El resultado garantiza `hasCut(out) === false` cuando la entrada es valida y derivable.

## `eliminateCut`

> Function · `logic/profiles/sequent-lk/cut-elimination.ts:194`

Elimina todos los cortes de la derivacion. Devuelve una derivacion
estructuralmente equivalente al mismo secuente sin nodos `cut`.

Implementacion: eliminamos primero los cortes interiores (de las
hojas hacia la raiz) y luego reducimos el cut de la raiz aplicando
la regla principal correspondiente.

```ts
export function eliminateCut(proof: LKProof): LKProof
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LKProof` | no |  |

### Returns

`LKProof` — 

