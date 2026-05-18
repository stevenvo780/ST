#!/bin/sh
set -e

# Delegate entirely to the Node script.
# Working directory is set to GITHUB_WORKSPACE when running in Actions,
# or to the current directory when run locally.
cd "${GITHUB_WORKSPACE:-.}"

exec node /app/verify.mjs
