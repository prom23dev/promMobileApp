#!/bin/sh
set -eu
task_npm_prefix="$(npm config get prefix)"
task_runtime="/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
if [ -x "$task_runtime/node" ]; then
  PATH="$task_runtime:$PATH"
  export PATH
  npm_config_prefix="$task_npm_prefix"
  export npm_config_prefix
fi
exec npm "$@"
