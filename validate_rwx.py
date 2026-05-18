#!/usr/bin/env python3
"""
Validate that everythingtextured_dragon3.rwx matches dragon3.rwx pattern.
"""
import re
from pathlib import Path

def analyze_rwx_structure(filepath, name="File"):
    """Analyze RWX file structure and extract key metrics."""
    print(f"\n{'='*60}")
    print(f"Analyzing: {name}")
    print(f"{'='*60}")
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    print(f"Total lines: {len(lines):,}")
    
    # Find materials
    materials = {}
    in_material = None
    material_start_line = {}
    
    for i, line in enumerate(lines, 1):
        # Check for layer markers
        m_match = re.search(r'#Layer:\s*Material-(\d+)', line)
        if m_match:
            mat_num = m_match.group(1)
            in_material = mat_num
            material_start_line[mat_num] = i
            print(f"\nMaterial-{mat_num}: starts at line {i}")
            materials[mat_num] = {'start': i, 'tex_header': None, 'texbegin': None, 'texend': None, 'faces': 0}
        
        if in_material:
            # Check for Texture line (header)
            if re.search(r'^\s*Texture\s+', line, re.IGNORECASE):
                tex = re.search(r'Texture\s+(.+)', line, re.IGNORECASE)
                if tex and not materials[in_material]['tex_header']:
                    materials[in_material]['tex_header'] = i
                    print(f"  - Texture header at line {i}: {line.strip()}")
            
            # Check for #texbegin
            if re.match(r'#texbegin\s+Material-', line):
                if not materials[in_material]['texbegin']:
                    materials[in_material]['texbegin'] = i
                    # Check indentation
                    indent = len(line) - len(line.lstrip())
                    print(f"  - #texbegin at line {i}, indentation: {indent} spaces")
            
            # Check for #texend
            if re.match(r'#texend\s+Material-', line):
                if not materials[in_material]['texend']:
                    materials[in_material]['texend'] = i
                    indent = len(line) - len(line.lstrip())
                    print(f"  - #texend at line {i}, indentation: {indent} spaces")
            
            # Count faces after texend
            if materials[in_material]['texend'] and materials[in_material]['texend'] < i:
                if re.match(r'\s+(Quad|Triangle)\s+', line):
                    materials[in_material]['faces'] += 1
    
    print(f"\n{'='*60}")
    print(f"Summary for {name}:")
    print(f"{'='*60}")
    print(f"Total unique materials: {len(materials)}")
    print(f"Material numbers: {sorted([int(m) for m in materials.keys()])}")
    
    # Check for issues
    issues = []
    for mat_num in sorted(materials.keys(), key=int):
        m = materials[mat_num]
        if not m['texbegin']:
            issues.append(f"Material-{mat_num}: Missing #texbegin")
        if not m['texend']:
            issues.append(f"Material-{mat_num}: Missing #texend")
        if not m['faces']:
            issues.append(f"Material-{mat_num}: No faces found after #texend")
        if m['tex_header'] and m['texbegin'] and m['tex_header'] > m['texbegin']:
            issues.append(f"Material-{mat_num}: Texture header AFTER #texbegin (line {m['tex_header']} > {m['texbegin']})")
    
    if issues:
        print("\nISSUES FOUND:")
        for issue in issues:
            print(f"  ❌ {issue}")
    else:
        print("\n✅ All checks passed")
    
    return materials, len(lines), issues

# Analyze both files
dragon3_path = Path(r"c:\Projects\Simla\examples\dragon3.rwx")
generated_path = Path(r"c:\Projects\Simla\aw\everythingtextured_dragon3.rwx")

dragon3_mats, dragon3_lines, dragon3_issues = analyze_rwx_structure(dragon3_path, "dragon3.rwx (REFERENCE)")
gen_mats, gen_lines, gen_issues = analyze_rwx_structure(generated_path, "everythingtextured_dragon3.rwx (GENERATED)")

print(f"\n\n{'='*60}")
print("COMPARISON")
print(f"{'='*60}")
print(f"dragon3.rwx: {dragon3_lines:,} lines, {len(dragon3_mats)} materials")
print(f"Generated:   {gen_lines:,} lines, {len(gen_mats)} materials")

if dragon3_issues or gen_issues:
    print("\n⚠️  Issues detected in one or both files!")
else:
    print("\n✅ Both files appear structurally valid")
