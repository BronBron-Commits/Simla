#!/usr/bin/env bash
set -euo pipefail

echo "Simla conformance check"
echo "======================="

fail=0

normalize() {
  sed 's/^Result: //' | tail -1 | tr -d '\r'
}

ensure_c_runtime() {
  local output="$1"
  shift

  if [ -x "$output" ]; then
    return
  fi

  echo "Building missing runtime: $output"
  cc -Wall -Wextra -std=c11 "$@" -o "$output"
}

ensure_c_runtime ./c-simla/simla c-simla/simla.c
ensure_c_runtime ./c-simla/compile_test c-simla/vm.c c-simla/compile_test.c
ensure_c_runtime ./c-simla/shared_bytecode_run c-simla/vm.c c-simla/shared_bytecode_run.c

run_c_interp() {
  ./c-simla/simla "$1" 2>/dev/null | normalize
}

run_c_bytecode() {
  ./c-simla/compile_test "$1" 2>/dev/null | normalize
}

run_js_vm() {
  node tools/run_js_vm.js "$1" 2>/dev/null | normalize
}

for f in tests/spec/*.sim; do
  name="$(basename "$f" .sim)"
  golden="tests/golden/$name.out"

  echo ""
  echo "TEST: $name"

  expected="$(cat "$golden" | tr -d '\r')"

  js_out="$(run_js_vm "$f" || echo "__ERROR__")"
  c_interp_out="$(run_c_interp "$f" || echo "__ERROR__")"
  c_bc_out="$(run_c_bytecode "$f" || echo "__ERROR__")"

  echo "  Expected:    $expected"
  echo "  JS VM:       $js_out"
  echo "  C Interp:    $c_interp_out"
  echo "  C Bytecode:  $c_bc_out"

  test_fail=0

  if [ "$js_out" != "$expected" ]; then
    echo "    FAIL: JS != expected"
    test_fail=1
  fi

  if [ "$c_interp_out" != "$expected" ]; then
    echo "    FAIL: C interp != expected"
    test_fail=1
  fi

  if [ "$c_bc_out" != "$expected" ]; then
    echo "    FAIL: C bytecode != expected"
    test_fail=1
  fi

  if [ "$js_out" != "$c_interp_out" ] || [ "$js_out" != "$c_bc_out" ]; then
    echo "    FAIL: runtimes disagree"
    test_fail=1
  fi

  if [ "$test_fail" -eq 0 ]; then
    echo "    OK"
  else
    fail=1
  fi
done

echo ""
echo "SHARED BYTECODE BRIDGE TEST"

bridge_fixtures=(
  "c-simla/bytecode_test.sim"
  "c-simla/bytecode_vars.sim"
  "c-simla/bytecode_if.sim"
  "c-simla/bytecode_list.sim"
  "c-simla/bytecode_len.sim"
  "c-simla/bytecode_fn.sim"
  "c-simla/filter_test.sim"
  "c-simla/reduce_test.sim"
)

for fixture in "${bridge_fixtures[@]}"; do
  tmp_bc="$(mktemp)"

  if ! node tools/emit_shared_bytecode.js "$fixture" "$tmp_bc" 2>/dev/null; then
    echo "  Fixture:     $fixture"
    echo "    FAIL: shared bytecode emit failed"
    rm -f "$tmp_bc"
    fail=1
    continue
  fi

  js_shared_out="$(node tools/run_shared_bytecode.js "$tmp_bc" 2>/dev/null | normalize || echo "__ERROR__")"
  c_shared_out="$(./c-simla/shared_bytecode_run "$tmp_bc" 2>/dev/null | normalize || echo "__ERROR__")"
  c_native_out="$(run_c_bytecode "$fixture" || echo "__ERROR__")"

  echo "  Fixture:     $fixture"
  echo "  JS Shared:   $js_shared_out"
  echo "  C Shared:    $c_shared_out"
  echo "  C Native BC: $c_native_out"

  if [ "$js_shared_out" != "$c_shared_out" ] || [ "$js_shared_out" != "$c_native_out" ]; then
    echo "    FAIL: shared bytecode bridge mismatch"
    fail=1
  else
    echo "    OK"
  fi

  rm -f "$tmp_bc"
done

echo ""
if [ "$fail" -ne 0 ]; then
  echo "Conformance FAILED"
  exit 1
fi

echo "All runtimes match spec"
