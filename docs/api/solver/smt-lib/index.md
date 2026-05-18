# `solver/smt-lib/index.ts`

============================================================ SMT-LIB v2 — Barrel ============================================================ Parser + emitter de scripts SMT-LIB v2 con soporte para los comandos estándar (set-logic, declare-fun, assert, check-sat, push/pop, etc.) y los constructores de término privilegiados (let, forall, exists, match, annotated). Complementa al serializador específico de ST en `src/runtime/smt/serializer.ts` permitiendo leer archivos `.smt2` y reemitirlos canónicamente.
