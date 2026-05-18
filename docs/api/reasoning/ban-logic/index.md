# `reasoning/ban-logic/index.ts`

============================================================ BAN Logic — Barrel export ============================================================ Burrows-Abadi-Needham logic para verificación de protocolos criptográficos de autenticación. API pública:   - Constructores de términos y fórmulas (`principal`, `key`, ...)   - Reglas de inferencia (R1-R10 y variantes)   - `saturate(initial)` para cerrar un estado bajo las reglas   - `analyzeProtocol(p)` para evaluar goals de un Protocol   - Protocolos pre-armados: Needham-Schroeder symmetric / PK / Kerberos
