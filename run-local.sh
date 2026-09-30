#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
export PATH="$PWD/.local-tools/node-v22.16.0-linux-x64/bin:$PWD/.local-tools/pnpm/node_modules/.bin:$PATH"
if ! command -v node >/dev/null || ! command -v pnpm >/dev/null; then
  echo 'Faltan Node.js o pnpm locales. Consulta README.md.' >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  exec pnpm start --hostname 127.0.0.1 --port 3000
fi
exec pnpm "$@"
