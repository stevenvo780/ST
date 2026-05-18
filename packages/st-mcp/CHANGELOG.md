# Changelog — @stevenvo780/st-mcp

## 0.1.0 — 2026-05-18

Primer release.

- MCP server stdio que expone 4 tools de ST:
  - `st_check` — verifica validez de una fórmula bajo un perfil.
  - `st_derive` — intenta derivar una conclusión a partir de axiomas.
  - `st_countermodel` — busca un modelo que falsifique la fórmula.
  - `st_formalize` — registra y valida una formalización propuesta de un texto.
- Soporta los 11 perfiles lógicos publicados por `@stevenvo780/st-lang@^4.14.0`.
- API programática (`createServer`, `runCheck`, `runDerive`, …) para integrar
  los runners directo sin pasar por MCP.
- Tests con vitest contra runners y end-to-end vía `InMemoryTransport`.
