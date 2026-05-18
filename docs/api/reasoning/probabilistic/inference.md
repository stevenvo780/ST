# `reasoning/probabilistic/inference.ts`

============================================================ Probabilistic Programming — Inference engines ============================================================ Cuatro backends:   1. `enumerate`         — enumeración exacta para programas con                            soporte discreto finito. Recorre el                            árbol de ramificaciones, multiplica                            probabilidades y agrega por valor de                            retorno. Exacto, costo O(|soporte|).   2. `rejectionSample`   — muestreo simple del prior; descarta                            trazas con `observe(false)`. Sesgo 0,                            varianza alta si la aceptación es baja.   3. `importanceSample`  — muestreo del prior con pesos                            log-acumulados; usa `factor()` y el                            log-pdf de las observes "soft" como                            log-weight. Reporta ESS para diagnóstico.   4. `metropolisHastings` — single-site MCMC: re-muestrea uno de                            los sample sites por iteración y acepta                            según ratio de pesos. Devuelve cadena                            tras burn-in y thinning. Todos usan el mismo `PProgram<T>` y el mismo `Sampler` interface.

## Contents

- [`enumerate`](#enumerate) — Function
- [`rejectionSample`](#rejectionsample) — Function
- [`importanceSample`](#importancesample) — Function
- [`metropolisHastings`](#metropolishastings) — Function

## `enumerate`

> Function · `reasoning/probabilistic/inference.ts:163`

Enumera todas las trayectorias del programa, multiplicando la
probabilidad de cada decisión discreta y descartando ramas con
`observe(false)`. Soporta `factor(logW)` agregando exp(logW) al
peso. No soporta distribuciones continuas (uniform, normal) ni
`poisson` — lanza error si las encuentra.

`maxStates` protege de explosión combinatoria: corta la
enumeración cuando el número de ramas pendientes la supera.

```ts
export function enumerate<T>(program: PProgram<T>, maxStates = 100_000): PosteriorSummary<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `PProgram<T>` | no |  |
| `maxStates` | `any` | yes |  |

### Returns

`PosteriorSummary<T>` — 


## `rejectionSample`

> Function · `reasoning/probabilistic/inference.ts:291`

Muestrea N trazas del prior; cualquier traza con `observe(false)`
o `factor(-Infinity)` se descarta y se reintenta.

`factor(logW)` con `logW < 0` se trata como aceptación
probabilística: con prob `exp(logW)` la traza se acepta, en
caso contrario se descarta. `logW > 0` es legal pero raro;
se acepta siempre (rejection no maneja pesos > 1).

```ts
export function rejectionSample<T>( program: PProgram<T>, opts: InferenceOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `PProgram<T>` | no |  |
| `opts` | `InferenceOptions` | yes |  |

### Returns

`PosteriorSummary<T>` — 


## `importanceSample`

> Function · `reasoning/probabilistic/inference.ts:356`

Muestrea trazas del prior y acumula log-pesos de `observe`
(treated as -Infinity si false, 0 si true) y `factor`. Devuelve
los samples + sus pesos normalizados; el histograma y mean/std
reflejan estos pesos.

Reporta ESS = (Σwᵢ)² / Σwᵢ² como diagnóstico de degeneración.

```ts
export function importanceSample<T>( program: PProgram<T>, opts: InferenceOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `PProgram<T>` | no |  |
| `opts` | `InferenceOptions` | yes |  |

### Returns

`PosteriorSummary<T>` — 


## `metropolisHastings`

> Function · `reasoning/probabilistic/inference.ts:452`

MCMC Metropolis-Hastings sobre el espacio de trazas del programa.

Convenciones:
  - `burnIn` itera sin contar (default 1000).
  - `thin` toma 1 de cada N (default 1).
  - Single-site: en cada iteración, re-muestrea UN sample site
    (elegido uniforme) y re-ejecuta. Si el número de sample sites
    cambia entre trazas, igual funciona (re-ejecutamos forzando
    el valor anterior en los sites que coinciden).
  - Reporta `acceptanceRate` para diagnóstico.

```ts
export function metropolisHastings<T>( program: PProgram<T>, opts: InferenceOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `program` | `PProgram<T>` | no |  |
| `opts` | `InferenceOptions` | yes |  |

### Returns

`PosteriorSummary<T>` — 

