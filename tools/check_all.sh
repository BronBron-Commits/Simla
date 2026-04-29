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
./tools/conformance_check.sh

echo ""
./tools/error_conformance_check.sh

echo ""
echo "All Simla checks passed"
