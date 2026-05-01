#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./simla.sh <file.sim>"
  exit 1
fi

mkdir -p .tmp

TMP_FILE=".tmp/simla-expanded.sim"

node tools/expand_imports.js "$1" > "$TMP_FILE"
node tools/run_js_vm.js "$TMP_FILE"
