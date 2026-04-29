#!/usr/bin/env bash
set -euo pipefail

echo "Simla conformance check"
echo "======================="

fail=0

normalize() {
  sed 's/^Result: //' | tail -1 | tr -d '\r'
}

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
if [ "$fail" -ne 0 ]; then
  echo "Conformance FAILED"
  exit 1
fi

echo "All runtimes match spec"
