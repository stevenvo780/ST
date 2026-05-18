# @stevenvo780/st-mcp

MCP server que expone las tools core de [ST](https://github.com/stevenvo780/ST)
(`st_check`, `st_derive`, `st_countermodel`, `st_formalize`) sobre 11 perfiles
lógicos a cualquier cliente compatible con el
[Model Context Protocol](https://modelcontextprotocol.io): Claude Code,
Cursor, ChatGPT (con MCP habilitado), Continue, Zed, etc.

El transport por defecto es **stdio**, lanzado como subproceso por el cliente.

## Instalación rápida

No es necesario instalar nada localmente — los clientes MCP usan `npx -y`
para lanzar el server bajo demanda. La primera invocación bajará el paquete
y a partir de ahí queda cacheado.

### Claude Code / Claude Desktop

Editar `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) o `%APPDATA%\Claude\claude_desktop_config.json` (Windows) y añadir:

```json
{
  "mcpServers": {
    "st-mcp": {
      "command": "npx",
      "args": ["-y", "@stevenvo780/st-mcp"]
    }
  }
}
```

Reiniciar Claude. Las 4 tools aparecerán automáticamente en el selector.

### Cursor

`Settings → MCP → + Add new MCP server`:

```json
{
  "name": "st-mcp",
  "command": "npx",
  "args": ["-y", "@stevenvo780/st-mcp"]
}
```

### Cualquier cliente MCP

```bash
npx -y @stevenvo780/st-mcp
# habla JSON-RPC sobre stdin/stdout siguiendo la spec MCP.
```

## Tools expuestas

| Tool              | Para qué                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `st_check`        | ¿Es esta fórmula válida (tautología/teorema) en el perfil X?        |
| `st_derive`       | ¿Se puede derivar esta conclusión a partir de estos axiomas?         |
| `st_countermodel` | Dame una valuación que falsifique esta fórmula (si no es tautología).|
| `st_formalize`    | Registra y valida una formalización propuesta de un texto natural.  |

### Ejemplos de invocación

**`st_check`**

```jsonc
{
  "name": "st_check",
  "arguments": {
    "formula": "((P -> Q) & P) -> Q",
    "profile": "classical.propositional"
  }
}
```

Respuesta (`structuredContent`):

```jsonc
{
  "ok": true,
  "profile": "classical.propositional",
  "formula": "((P -> Q) & P) -> Q",
  "status": "valid",
  "valid": true,
  "summary": "((P -> Q) & P) -> Q es VALIDA (tautologia)"
}
```

**`st_derive`**

```jsonc
{
  "name": "st_derive",
  "arguments": {
    "axioms": ["P -> Q", "P"],
    "conclusion": "Q",
    "profile": "classical.propositional"
  }
}
```

**`st_countermodel`**

```jsonc
{
  "name": "st_countermodel",
  "arguments": {
    "formula": "(P -> Q)",
    "profile": "classical.propositional"
  }
}
```

Respuesta:

```jsonc
{
  "ok": true,
  "found": true,
  "model": { "type": "propositional", "valuation": { "P": true, "Q": false } },
  "summary": "Contramodelo encontrado para (P -> Q)\n  ← P=V, Q=F"
}
```

**`st_formalize`**

```jsonc
{
  "name": "st_formalize",
  "arguments": {
    "text": "Si llueve, entonces el suelo está mojado.",
    "formula": "(P -> Q)",
    "anchor": "weather.md#rain"
  }
}
```

## Perfiles lógicos soportados

`classical.propositional`, `classical.first_order`, `modal.k`,
`paraconsistent.belnap`, `deontic.standard`, `epistemic.s5`,
`aristotelian.syllogistic`, `intuitionistic.propositional`, `temporal.ltl`,
`probabilistic.basic`, `arithmetic`.

## Sintaxis ST básica

| Operador      | Notación   | Ejemplo            |
| ------------- | ---------- | ------------------ |
| Negación      | `!` o `¬`  | `!P`               |
| Conjunción    | `&`        | `(P & Q)`          |
| Disyunción    | `\|`       | `(P \| Q)`         |
| Implicación   | `->`       | `(P -> Q)`         |
| Bicondicional | `<->`      | `(P <-> Q)`        |
| Universal     | `forall`   | `forall x. P(x)`   |
| Existencial   | `exists`   | `exists x. P(x)`   |
| Necesidad     | `[]`       | `[] P`             |
| Posibilidad   | `<>`       | `<> P`             |

## Desarrollo

```bash
cd packages/st-mcp
npm install
npm test          # vitest, ~10 tests
npm run build     # compila a dist/
node ./dist/cli.js --version
```

## Licencia

MIT — ver [`LICENSE`](./LICENSE).

## Enlaces

- Repo principal de ST: <https://github.com/stevenvo780/ST>
- ST en npm: <https://www.npmjs.com/package/@stevenvo780/st-lang>
- Model Context Protocol: <https://modelcontextprotocol.io>
