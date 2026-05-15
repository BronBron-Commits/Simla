#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PASS=0
FAIL=0

for f in \
  c-simla/bytecode_test.sim \
  c-simla/bytecode_vars.sim \
  c-simla/bytecode_if.sim \
  c-simla/bytecode_list.sim \
  c-simla/bytecode_len.sim \
  c-simla/bytecode_fn.sim \
  c-simla/filter_test.sim \
  c-simla/reduce_test.sim; do

  if ! node tools/emit_shared_bytecode.js "$f" /tmp/bridge.sbc 2>/dev/null; then
    echo "EMIT_FAIL  $f"
    FAIL=$((FAIL + 1))
    continue
  fi

  js="$(node tools/run_shared_bytecode.js /tmp/bridge.sbc 2>/dev/null || echo __ERROR__)"
  c="$(./c-simla/shared_bytecode_run /tmp/bridge.sbc 2>/dev/null || echo __ERROR__)"

  if [ "$js" = "$c" ]; then
    echo "OK         $f  ->  $js"
    PASS=$((PASS + 1))
  else
    echo "MISMATCH   $f  JS=[$js]  C=[$c]"
    FAIL=$((FAIL + 1))
  fi
done

rm -f /tmp/bridge.sbc
echo ""
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
