#!/usr/bin/env bash
set -euo pipefail

echo "Simla conformance check"
echo "======================="

missing=0

for f in tests/spec/*.sim; do
  name="$(basename "$f" .sim)"
  golden="tests/golden/$name.out"

  if [ ! -f "$golden" ]; then
    echo "MISSING GOLDEN: $golden"
    missing=1
    continue
  fi

  echo "found test: $name"
done

if [ "$missing" -ne 0 ]; then
  echo "Conformance setup incomplete"
  exit 1
fi

echo "Conformance files OK"
