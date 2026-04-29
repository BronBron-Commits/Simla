#!/usr/bin/env bash
set -e

python3 c-simla/generate_combat_cases.py

cc -Wall -Wextra -std=c11 -o c-simla/simla c-simla/simla.c
cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/compile_test.c -o c-simla/compile_test

while read -r file expected; do
  [ -z "$file" ] && continue

  interp="$(./c-simla/simla "$file" | grep "Result:" | tail -1)"
  bytecode="$(./c-simla/compile_test "$file" | grep "Result:" | tail -1)"
  js="$(node c-simla/js_parity_check.mjs "$file" | grep "Result:" | tail -1)"

  echo "$file"
  echo "  C Interpreter: $interp"
  echo "  C Bytecode:    $bytecode"
  echo "  JS VM:         $js"

  if [ "$interp" != "Result: $expected" ]; then
    echo "FAILED: expected Result: $expected"
    exit 1
  fi

  if [ "$interp" != "$bytecode" ]; then
    echo "FAILED: C interpreter/bytecode mismatch"
    exit 1
  fi

  if [ "$interp" != "$js" ]; then
    echo "FAILED: C/JS mismatch"
    exit 1
  fi

  echo "  OK"
done < c-simla/combat_cases.txt

echo "Full runtime parity matrix OK"
