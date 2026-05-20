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
run_test c-simla/typed_object_test.sim 1
run_test c-simla/typed_node_test.sim 1
run_test c-simla/typed_vec3_test.sim 1

echo "All C Simλ tests passed"
