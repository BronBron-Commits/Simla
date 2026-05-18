#!/usr/bin/env python3
"""
Show what's around Material-001 #texend in the generated file.
"""

with open(r"c:\Projects\Simla\aw\everythingtextured_dragon3.rwx", 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Look around line 1671909 where #texend Material-001 is
print("Lines 1671900-1671925:")
for i in range(1671899, 1671925):
    if i < len(lines):
        # Show line number and content
        print(f"{i+1:7d}: {lines[i].rstrip()}")
