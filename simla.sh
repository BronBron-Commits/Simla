#!/usr/bin/env bash
set -e

if [ $# -lt 1 ]; then
  echo "usage: simla <file.sim>"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "error: file not found: $1"
  exit 1
fi

node tools/run_js_vm.js "$1"
