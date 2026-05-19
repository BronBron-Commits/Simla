#!/usr/bin/env python3
"""Rebuild RWX - skip Material-059 (corrupted, no vertices)"""

import re
from pathlib import Path

input_file = r"c:\Projects\Simla\aw\everythingtextured_dragon3_BROKEN.rwx"
output_file = r"c:\Projects\Simla\aw\everythingtextured_dragon3.rwx"

print("Parsing broken RWX (skipping Material-059)...")
with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

materials = {}
current_material = None
in_vertex_block = False
vertex_count = 0
face_count = 0

for line_num, line in enumerate(lines, 1):
    stripped = line.rstrip()
    
    m = re.search(r'#Layer:\s*Material-(\d+)', stripped)
    if m:
        mat_num = m.group(1)
        # SKIP Material-059
        if mat_num == '059':
            current_material = None
            continue
        
        current_material = mat_num
        materials[mat_num] = {
            'diffuse': '1.0',
            'texture': None,
            'vertices': [],
            'faces': []
        }
        in_vertex_block = False
        continue
    
    if current_material:
        d = re.match(r'\s*Diffuse\s+(.+)', stripped, re.IGNORECASE)
        if d:
            materials[current_material]['diffuse'] = d.group(1).strip()
            continue
        
        t = re.match(r'\s*Texture\s+(.+)', stripped, re.IGNORECASE)
        if t:
            materials[current_material]['texture'] = t.group(1).strip()
            continue
        
        if re.match(r'#texbegin', stripped):
            in_vertex_block = True
            continue
        
        if re.match(r'#texend', stripped):
            in_vertex_block = False
            continue
        
        if in_vertex_block and re.match(r'\s*Vertex\s+', stripped, re.IGNORECASE):
            materials[current_material]['vertices'].append(stripped)
            vertex_count += 1
            continue
        
        if re.match(r'\s*(Triangle|Quad|Polygon)\s+', stripped, re.IGNORECASE):
            materials[current_material]['faces'].append(stripped)
            face_count += 1
            continue

print(f"Extracted {vertex_count:,} vertices, {face_count:,} faces across {len(materials)} materials")

output_lines = [
    "ModelBegin",
    "  ClumpBegin"
]

for mat_num in sorted(materials.keys(), key=int):
    m = materials[mat_num]
    
    output_lines.append(f"    ClumpBegin #Layer: Material-{mat_num}")
    output_lines.append(f"      Diffuse {m['diffuse']}")
    
    if m['texture']:
        output_lines.append(f"      Texture {m['texture']}")
    
    output_lines.append(f"#texbegin Material-{mat_num}")
    output_lines.extend([f"      {line}" for line in m['vertices']])
    output_lines.append(f"#texend Material-{mat_num}")
    
    output_lines.extend([f"      {line}" for line in m['faces']])
    
    output_lines.append("    ClumpEnd")

output_lines.extend([
    "  ClumpEnd",
    "ModelEnd"
])

print(f"Writing corrected RWX (58 materials, {len(output_lines):,} lines)...")
with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(output_lines))

size_mb = Path(output_file).stat().st_size / (1024*1024)
print(f"✅ Wrote: {size_mb:.2f} MB")
