#!/usr/bin/env bash
set -e

cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/compile_test.c -o c-simla/compile_test

run_test() {
  file="$1"
  expected="$2"

  echo "Running bytecode $file"
  output="$(./c-simla/compile_test "$file")"

  echo "$output" | grep "Result: $expected" >/dev/null || {
    echo "FAILED: $file"
    echo "Expected: Result: $expected"
    echo "$output"
    exit 1
  }

  echo "OK: $file -> $expected"
}

run_test c-simla/bytecode_test.sim 14
run_test c-simla/bytecode_vars.sim 5
run_test c-simla/bytecode_if.sim 1
run_test c-simla/bytecode_list.sim 40
run_test c-simla/bytecode_len.sim 4

echo "All C Simλ bytecode tests passed"
