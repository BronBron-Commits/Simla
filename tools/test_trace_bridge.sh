#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PASS=0
FAIL=0

ensure_c_runtime() {
  local output="$1"
  shift

  if [ -x "$output" ]; then
    return
  fi

  echo "Building missing runtime: $output"
  cc -Wall -Wextra -std=c11 "$@" -o "$output"
}

ensure_c_runtime ./c-simla/shared_bytecode_run c-simla/vm.c c-simla/shared_bytecode_run.c

for f in \
  c-simla/bytecode_test.sim \
  c-simla/bytecode_vars.sim \
  c-simla/bytecode_if.sim \
  c-simla/bytecode_list.sim \
  c-simla/bytecode_len.sim \
  c-simla/bytecode_fn.sim \
  c-simla/filter_test.sim \
  c-simla/reduce_test.sim; do

  tmp_bc="$(mktemp)"
  tmp_js="$(mktemp)"
  tmp_c="$(mktemp)"
  tmp_diff="$(mktemp)"

  if ! node tools/emit_shared_bytecode.js "$f" "$tmp_bc" 2>/dev/null; then
    echo "EMIT_FAIL  $f"
    FAIL=$((FAIL + 1))
    rm -f "$tmp_bc" "$tmp_js" "$tmp_c" "$tmp_diff"
    continue
  fi

  if ! node tools/run_shared_bytecode.js "$tmp_bc" --trace >/dev/null 2>"$tmp_js"; then
    echo "JS_FAIL    $f"
    FAIL=$((FAIL + 1))
    rm -f "$tmp_bc" "$tmp_js" "$tmp_c" "$tmp_diff"
    continue
  fi

  if ! ./c-simla/shared_bytecode_run "$tmp_bc" --trace >/dev/null 2>"$tmp_c"; then
    echo "C_FAIL     $f"
    FAIL=$((FAIL + 1))
    rm -f "$tmp_bc" "$tmp_js" "$tmp_c" "$tmp_diff"
    continue
  fi

  if diff -u "$tmp_js" "$tmp_c" >"$tmp_diff"; then
    echo "OK         $f"
    PASS=$((PASS + 1))
  else
    echo "MISMATCH   $f"
    sed 's/^/  /' "$tmp_diff"
    FAIL=$((FAIL + 1))
  fi

  rm -f "$tmp_bc" "$tmp_js" "$tmp_c" "$tmp_diff"
done

echo ""
echo "$PASS passed, $FAIL failed"
test "$FAIL" -eq 0
