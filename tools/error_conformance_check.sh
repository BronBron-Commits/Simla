#!/usr/bin/env bash
set -euo pipefail

echo "Simla error conformance check"
echo "============================="

fail=0

for f in tests/errors/*.sim; do
  name="$(basename "$f" .sim)"

  echo ""
  echo "ERROR TEST: $name"

  js_status=0
  c_status=0
  bc_status=0

  node tools/run_js_vm.js "$f" >/dev/null 2>&1 || js_status=$?
  ./c-simla/simla "$f" >/dev/null 2>&1 || c_status=$?
  ./c-simla/compile_test "$f" >/dev/null 2>&1 || bc_status=$?

  echo "  JS VM status:      $js_status"
  echo "  C Interp status:   $c_status"
  echo "  C Bytecode status: $bc_status"

  if [ "$js_status" -eq 0 ] || [ "$c_status" -eq 0 ] || [ "$bc_status" -eq 0 ]; then
    echo "    FAIL: expected all runtimes to reject invalid program"
    fail=1
  else
    echo "    OK"
  fi
done

echo ""
if [ "$fail" -ne 0 ]; then
  echo "Error conformance FAILED"
  exit 1
fi

echo "All runtimes reject invalid programs"
