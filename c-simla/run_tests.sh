#!/usr/bin/env bash
set -e

cc -Wall -Wextra -std=c11 -o c-simla/simla c-simla/simla.c

run_test() {
  file="$1"
  expected="$2"

  echo "Running $file"
  output="$(./c-simla/simla "$file")"

  echo "$output" | grep "Result: $expected" >/dev/null || {
    echo "FAILED: $file"
    echo "Expected: Result: $expected"
    echo "$output"
    exit 1
  }

  echo "OK: $file -> $expected"
}

run_test c-simla/closure_test.sim 8
run_test c-simla/list_test.sim 40
run_test c-simla/map_test.sim 5
run_test c-simla/filter_test.sim 2
run_test c-simla/reduce_test.sim 10

echo "All C Simλ tests passed"
