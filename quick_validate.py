#!/usr/bin/env python3
"""Quick validation of corrected RWX"""

import re
from pathlib import Path

rwx_file = Path(r'c:\Projects\Simla\aw\everythingtextured_dragon3.rwx')

print("Validating corrected RWX...")
with open(rwx_file, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

materials = {}
issues = []
vertex_count = 0
face_count = 0

for line_num, line in enumerate(lines, 1):
    stripped = line.rstrip()
    
    # Material header
    m = re.search(r'#Layer:\s*Material-(\d+)', stripped)
    if m:
        mat_num = m.group(1)
        materials[mat_num] = {'vertices': 0, 'faces': 0, 'has_texbegin': False, 'has_texend': False}
        continue
    
    if materials:
        last_mat = list(materials.keys())[-1]
        
        if re.match(r'#texbegin', stripped):
            materials[last_mat]['has_texbegin'] = True
        
        if re.match(r'#texend', stripped):
            materials[last_mat]['has_texend'] = True
        
        if re.match(r'\s*Vertex\s+', stripped, re.IGNORECASE):
            materials[last_mat]['vertices'] += 1
            vertex_count += 1
        
        if re.match(r'\s*(Triangle|Quad|Polygon)\s+', stripped, re.IGNORECASE):
            materials[last_mat]['faces'] += 1
            face_count += 1

print(f"\n✅ Total: {len(materials)} materials, {vertex_count:,} vertices, {face_count:,} faces")

# Check for issues
for mat_num in sorted(materials.keys(), key=int):
    m = materials[mat_num]
    if not m['has_texbegin']:
        issues.append(f"Material-{mat_num}: Missing #texbegin")
    if not m['has_texend']:
        issues.append(f"Material-{mat_num}: Missing #texend")
    if m['vertices'] == 0 and m['faces'] > 0:
        issues.append(f"Material-{mat_num}: Has {m['faces']} faces but no vertices!")
    if m['faces'] == 0:
        issues.append(f"Material-{mat_num}: No faces!")

if issues:
    print(f"\n❌ ISSUES FOUND ({len(issues)}):")
    for issue in issues[:10]:
        print(f"   {issue}")
else:
    print("\n✅ All materials valid - every material has vertices AND faces!")
    print(f"\nSample materials:")
    for mat_num in sorted(materials.keys(), key=int)[:3]:
        m = materials[mat_num]
        print(f"  Material-{mat_num}: {m['vertices']:,} vertices, {m['faces']:,} faces")
