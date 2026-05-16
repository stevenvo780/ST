# ST Benchmark Suite

Suite formal de performance para detectar regresiones entre commits.
Usa [vitest bench](https://vitest.dev/guide/features.html#benchmarking) con baselines persistidos.

## Archivos

| Archivo | Workload |
|---------|---------|
| `parser.bench.ts` | Throughput del lexer/parser por tamaño de programa |
| `cdcl.bench.ts` | SAT solver CDCL: triviales, 3-SAT, PHP, cadenas de implicación |
| `profiles.bench.ts` | Eval end-to-end por perfil lógico (los 11 perfiles) |
| `text-layer.bench.ts` | ProtocolHandler, anchors, claims, formalizaciones |
| `end-to-end.bench.ts` | Simulación de workspace Agora: teorías completas via API pública |
| `results.json` | Último run (generado por `npm run bench`) |
| `baselines.json` | Referencia para comparación (actualizar deliberadamente) |

## Comandos

```bash
# Correr benchmarks (genera results.json)
npm run bench

# Guardar resultados como nueva baseline
npm run bench:save

# Comparar último run contra baseline
npm run bench:compare

# Con umbrales custom (warn 15%, fail 30%)
node scripts/bench/compare.mjs --warn 15 --fail 30

# Reporte en JSON además de tabla
node scripts/bench/compare.mjs --json
```

## Cuándo actualizar baselines

- Cuando un cambio intencional mejora performance: `npm run bench:save`
- Cuando un cambio introduce regresión aceptable (ej. nueva feature con overhead): `npm run bench:save` + nota en el commit
- NUNCA actualizar baselines para ocultar regresiones no intencionadas

## Exit codes del comparador

| Código | Significado |
|--------|-------------|
| `0` | Sin regresiones severas |
| `1` | Al menos 1 bench superó el umbral de fallo (default: 25%) |
| `2` | Error de I/O (faltan archivos) |

## Configuración

Los benchmarks se configuran en `vitest.bench.config.ts`.
Los umbrales de warning/fail son parámetros del script comparador, no del runner.

## En CI

```yaml
- run: npm run bench
- run: npm run bench:compare
```

Si el comparador retorna exit code 1, el CI falla. Actualizar baselines es un acto deliberado que requiere `npm run bench:save` + commit.
