# @stevenvo780/st-cli

ST proof assistant CLI — powered by [@stevenvo780/st-lang](https://www.npmjs.com/package/@stevenvo780/st-lang).

## Install

```bash
# One-off (no install)
npx @stevenvo780/st-cli check proof.st

# Global install
npm install -g @stevenvo780/st-cli
st --help
```

## Commands

```
Usage: st <command> [options]

Commands:
  check <file>            Verify a .st file against its logical profile
  derive <formula>        Attempt derivation of a formula
  countermodel <formula>  Show countermodel if formula is invalid
  formalize <text>        Convert natural language to an ST formula
  export <file>           Export a .st proof to coq|lean|tptp|json
  repl                    Start an interactive REPL

Global options:
  --profile <slug>    Logical profile (see table below)
  --json              Machine-readable JSON output
  -v, --verbose       Verbose logs
  -h, --help          Show help
  -V, --version       Show version
```

## Example workflow

```bash
# 1. Write a proof file
cat > proof.st << 'EOF'
;; profile: classical.propositional
axiom modus_ponens : P -> Q
axiom premise      : P
derive Q from modus_ponens, premise
EOF

# 2. Check it
st check proof.st

# 3. Attempt derivation inline
st derive "P -> P"

# 4. Export to Lean 4
st export proof.st --to lean

# 5. Start interactive REPL
st repl --profile modal.s4
```

## Supported profiles

| Slug | Description |
|------|-------------|
| `classical.propositional` | Classical propositional logic (default) |
| `classical.fol` | Classical first-order logic |
| `modal.k` | Modal logic K |
| `modal.t` | Modal logic T |
| `modal.b` | Modal logic B |
| `modal.s4` | Modal logic S4 |
| `modal.s5` | Modal logic S5 (= alethic) |
| `modal.d` | Deontic modal logic D |
| `intuitionistic.nj` | Intuitionistic logic (NJ natural deduction) |
| `paraconsistent.belnap` | Belnap 4-valued paraconsistent logic |
| `relevant` | Relevant logic |
| `linear` | Linear logic |

## st-cli vs st-mcp

| | `@stevenvo780/st-cli` | `@stevenvo780/st-mcp` |
|---|---|---|
| Use case | Terminal, scripts, CI | AI assistants (Claude, Cursor) |
| Interface | CLI flags | MCP JSON-RPC |
| Interactive | `st repl` | Via AI chat |
| Export | coq, lean, tptp, json | json |

## .st file format

```
;; profile: modal.s4          ← optional header
;; description: Example proof

logic modal.s4                 ← or let CLI add this

axiom reflexivity : []P -> P
claim goal       : []P -> P from reflexivity
```

## License

MIT
