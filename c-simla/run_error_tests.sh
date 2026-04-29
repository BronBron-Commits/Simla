#!/usr/bin/env bash
set -e

cc -Wall -Wextra -std=c11 -o c-simla/simla c-simla/simla.c
cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/compile_test.c -o c-simla/compile_test

run_error_case() {
  runtime="$1"
  cmd="$2"
  file="$3"

  echo "Running expected-error case: $runtime $file"

  set +e
  output="$($cmd "$file" 2>&1)"
  code="$?"
  set -e

  if [ "$code" -eq 0 ]; then
    echo "FAILED: expected non-zero exit"
    echo "$output"
    exit 1
  fi

  echo "OK: failed as expected"
}

run_error_case "C interpreter" "./c-simla/simla" "c-simla/spec/errors/invalid_nth.sim"
run_error_case "C interpreter" "./c-simla/simla" "c-simla/spec/errors/unknown_symbol.sim"
run_error_case "C interpreter" "./c-simla/simla" "c-simla/spec/errors/wrong_arity.sim"

run_error_case "C bytecode" "./c-simla/compile_test" "c-simla/spec/errors/invalid_nth.sim"
run_error_case "C bytecode" "./c-simla/compile_test" "c-simla/spec/errors/wrong_arity.sim"

echo "All error tests passed"
