#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLES_DIR="$ROOT_DIR/examples"

if [[ ! -d "$EXAMPLES_DIR" ]]; then
  echo "No se encontró el directorio de ejemplos: $EXAMPLES_DIR" >&2
  exit 1
fi

if [[ -f "$ROOT_DIR/dist/cli/index.js" ]]; then
  ST_CMD=(node "$ROOT_DIR/dist/cli/index.js")
elif command -v st >/dev/null 2>&1; then
  ST_CMD=(st)
else
  echo "No encontré un runner de ST. Ejecuta 'npm run build' o instala 'st'." >&2
  exit 1
fi

mapfile -t example_files < <(find "$EXAMPLES_DIR" -maxdepth 1 -type f -name '*.st' | sort)

if [[ ${#example_files[@]} -eq 0 ]]; then
  echo "No hay ejemplos .st para ejecutar." >&2
  exit 1
fi

printf 'Runner: %s\n' "${ST_CMD[*]}"
printf 'Ejemplos encontrados: %d\n\n' "${#example_files[@]}"

failures=0
for file in "${example_files[@]}"; do
  name="$(basename "$file")"
  printf '>>> %s\n' "$name"
  if "${ST_CMD[@]}" run "$file"; then
    printf '✓ %s\n\n' "$name"
  else
    printf '✗ %s\n\n' "$name" >&2
    failures=$((failures + 1))
  fi
done

if [[ $failures -gt 0 ]]; then
  printf 'Fallaron %d ejemplo(s).\n' "$failures" >&2
  exit 1
fi

printf 'Todos los ejemplos (%d) ejecutaron correctamente.\n' "${#example_files[@]}"
