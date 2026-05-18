# Changelog

## [0.1.0] — 2026-05-18

### Added
- Initial release of `@stevenvo780/vscode-st`
- Syntax highlighting for `.st` files (TextMate grammar)
- LSP server with diagnostics, hover, completions, go-to-definition, code actions, folding, signature help
- Command palette: **ST: Check formula**, **ST: Try derivation**, **ST: Show countermodel**, **ST: Switch logical profile**
- Commands: **ST: Run file**, **ST: Run selection**, **ST: Render to Markdown**
- Snippets for common ST patterns (axiom, theorem, derive, theory, templates for each profile)
- Status bar item showing active logical profile (click to switch)
- Keybindings: `Ctrl+Shift+R` (run file), `Ctrl+Shift+E` (run selection), `Ctrl+Shift+K` (check), `Ctrl+Shift+M` (render)
- Language configuration: brackets, auto-closing pairs, indentation rules, folding markers
- File icons (light/dark themes)
- Ships `@stevenvo780/st-lang@^4.14.0` from npm (no local vendor copy)
