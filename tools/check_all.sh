#!/usr/bin/env bash
set -euo pipefail

echo "Simla full check"
echo "================"

echo ""
echo "Building C runtimes..."
cd c-simla
make clean
make
cd ..

echo ""
echo "Building shared bytecode runner..."
cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/shared_bytecode_run.c -o c-simla/shared_bytecode_run

echo ""
./tools/conformance_check.sh

echo ""
./tools/error_conformance_check.sh

echo ""
./tools/test_bridge.sh

echo ""
echo "All Simla checks passed"
