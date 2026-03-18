#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Build"
npm run build

echo
echo "==> Test suites"
mapfile -t test_files < <(find src/tests -maxdepth 1 -type f -name '*.test.ts' | sort)

if [[ ${#test_files[@]} -eq 0 ]]; then
  echo "No se encontraron suites en src/tests" >&2
  exit 1
fi

for test_file in "${test_files[@]}"; do
  echo "--- $test_file"
  timeout 60s npx vitest run "$test_file" --reporter=dot
  echo
done

echo "==> Examples"
bash "$ROOT_DIR/scripts/run-all-examples.sh"

echo
echo "Validación exhaustiva completada."
