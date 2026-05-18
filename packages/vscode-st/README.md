# ST Language — VSCode Extension

Full IDE support for **ST (Symbolic Theory Language)** — a multi-profile logical language with classical, modal, intuitionistic, paraconsistent, deontic, epistemic, temporal, and arithmetic backends.

## Quickstart

### Install from .vsix (manual)

```bash
# Build the .vsix
cd packages/vscode-st
npm install
npm run compile
npx @vscode/vsce package --no-dependencies

# Install in VSCode
code --install-extension vscode-st-0.1.0.vsix
```

### Install from Marketplace (pending)

> Marketplace publish requires an Azure DevOps PAT. Run `npx @vscode/vsce publish` once the PAT is configured.

## Features

- **Syntax highlighting** for `.st` files
- **Live diagnostics** — parse and runtime errors underlined as you type
- **Hover info** — logical semantics and documentation on hover
- **Completions** — keywords, operators, snippets, and document symbols
- **Go to definition** — jump to axiom/theorem declarations
- **Folding** — block comments, curly-brace regions
- **Code actions** — quick fixes for missing `logic` header, keyword translations (EN ↔ ES)
- **Status bar** — active logical profile shown bottom-right (click to switch)

## Commands

| Command | Keybinding | Description |
|---------|-----------|-------------|
| `ST: Check formula` | `Ctrl+Shift+K` | Prompt for a formula and check its validity |
| `ST: Try derivation` | — | Derive a conclusion from named premises in the file |
| `ST: Show countermodel` | — | Find a countermodel for a formula |
| `ST: Switch logical profile` | — | Quick-pick a new `logic` profile |
| `ST: Run file` | `Ctrl+Shift+R` | Execute the entire `.st` file |
| `ST: Run selection` | `Ctrl+Shift+E` | Execute the selected text (or current line) |
| `ST: Render to Markdown` | `Ctrl+Shift+M` | Render ST output as Markdown in the output panel |

## Logical Profiles

Configure the default profile in settings (`st.profile`):

| Profile | Description |
|---------|-------------|
| `classical.propositional` | Classical propositional logic |
| `classical.first_order` | First-order logic with quantifiers |
| `modal.k` / `modal.s4` / `modal.s5` | Modal logics K, S4, S5 |
| `intuitionistic.propositional` | Constructive logic (no LEM) |
| `paraconsistent.belnap` | Belnap 4-valued logic (T/F/Both/Neither) |
| `deontic.standard` | Deontic logic (O/P/F aliases) |
| `epistemic.s5` | Epistemic logic with K/B aliases |
| `temporal.ltl` | Linear temporal logic with G/F aliases |
| `arithmetic` | Arithmetic operations and comparisons |

## Configuration

```json
{
  "st.profile": "classical.propositional",
  "st.maxIterations": 1000,
  "st.diagnostics.enableRuntime": true,
  "st.diagnostics.enableParseDiagnostics": true,
  "st.completion.showKeywordsInSpanish": true
}
```

## Example

```st
logic classical.propositional

let P = "It rains"
let Q = "Streets are wet"

axiom rain_implies_wet : P -> Q
axiom it_rains : P

derive Q from {rain_implies_wet, it_rains}
truth_table P -> Q
```

## Screenshots

> Hover info, diagnostics, and completions screenshots coming soon.
> See `./media/hover.png`, `./media/completions.png` (placeholders).

## License

MIT — see [LICENSE](LICENSE)
