#!/usr/bin/env python3
"""
Rebuild RWX file to match dragon3.rwx format exactly.
Fixes the issues where:
1. Material-001 has no faces
2. Faces are in wrong location (inside #texbegin instead of after #texend)
"""

import re
from collections import defaultdict

input_file = r"c:\Projects\Simla\aw\everythingtextured_dragon3.rwx"
output_file = r"c:\Projects\Simla\aw\everythingtextured_dragon3_FIXED.rwx"

print("Reading broken RWX file...")
with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines):,}")

# Parse the structure: extract materials with their vertices and faces
materials = {}  # { material_num: { 'diffuse': str, 'texture': str, 'vertices': [], 'faces': [] } }
current_material = None
in_vertex_block = False
vertex_count = 0
face_count = 0

print("Parsing RWX structure...")
for line_num, line in enumerate(lines, 1):
    stripped = line.rstrip()
    
    # Check for material header
    m = re.search(r'#Layer:\s*Material-(\d+)', stripped)
    if m:
        mat_num = m.group(1)
        current_material = mat_num
        materials[mat_num] = {
            'diffuse': '1.0',
            'texture': None,
            'vertices': [],
            'faces': []
        }
        print(f"  Found Material-{mat_num} at line {line_num:,}")
        in_vertex_block = False
        continue
    
    if current_material:
        # Check for Diffuse
        d = re.match(r'\s*Diffuse\s+(.+)', stripped, re.IGNORECASE)
        if d:
            materials[current_material]['diffuse'] = d.group(1).strip()
            continue
        
        # Check for Texture
        t = re.match(r'\s*Texture\s+(.+)', stripped, re.IGNORECASE)
        if t:
            materials[current_material]['texture'] = t.group(1).strip()
            continue
        
        # Check for #texbegin
        if re.match(r'#texbegin', stripped):
            in_vertex_block = True
            continue
        
        # Check for #texend
        if re.match(r'#texend', stripped):
            in_vertex_block = False
            continue
        
        # If we're in vertex block, collect vertices
        if in_vertex_block and re.match(r'\s*Vertex\s+', stripped, re.IGNORECASE):
            materials[current_material]['vertices'].append(stripped)
            vertex_count += 1
            continue
        
        # Collect faces (Triangle, Quad, Polygon)
        if re.match(r'\s*(Triangle|Quad|Polygon)\s+', stripped, re.IGNORECASE):
            materials[current_material]['faces'].append(stripped)
            face_count += 1
            continue

print(f"\nExtracted {vertex_count:,} vertices, {face_count:,} faces across {len(materials)} materials")
for mat_num in sorted(materials.keys(), key=int):
    m = materials[mat_num]
    print(f"  Material-{mat_num}: {len(m['vertices']):5,} vertices, {len(m['faces']):5,} faces, tex={m['texture']}")

# Now rebuild the file in correct format
print("\nRebuilding RWX in correct dragon3 format...")
output_lines = [
    "ModelBegin",
    "  ClumpBegin"
]

# Write each material as nested ClumpBegin/ClumpEnd
for mat_num in sorted(materials.keys(), key=int):
    m = materials[mat_num]
    mat_num_str = mat_num.zfill(3)  # Pad for consistent formatting
    
    output_lines.append(f"    ClumpBegin #Layer: Material-{mat_num}")
    output_lines.append(f"      Diffuse {m['diffuse']}")
    
    if m['texture']:
        output_lines.append(f"      Texture {m['texture']}")
    
    # Write vertex block
    output_lines.append(f"#texbegin Material-{mat_num}")
    output_lines.extend([f"      {line}" for line in m['vertices']])
    output_lines.append(f"#texend Material-{mat_num}")
    
    # Write faces AFTER #texend
    output_lines.extend([f"      {line}" for line in m['faces']])
    
    output_lines.append("    ClumpEnd")

output_lines.extend([
    "  ClumpEnd",
    "ModelEnd"
])

print(f"\nWriting corrected RWX ({len(output_lines):,} lines)...")
with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(output_lines))

print(f"✅ Wrote: {output_file}")

# Verify by checking face counts
print("\nVerifying output...")
with open(output_file, 'r', encoding='utf-8') as f:
    out_lines = f.readlines()

out_materials = 0
out_faces = 0
for line in out_lines:
    if re.search(r'#Layer:\s*Material-', line):
        out_materials += 1
    if re.match(r'\s*(Triangle|Quad|Polygon)\s+', line):
        out_faces += 1

print(f"Output verification:")
print(f"  Materials: {out_materials}")
print(f"  Faces: {out_faces:,}")
print(f"  Original faces: {face_count:,}")
if out_faces == face_count:
    print("  ✅ Face count matches!")
else:
    print(f"  ⚠️  Face count mismatch! Expected {face_count:,}, got {out_faces:,}")
