from pathlib import Path

spacing = 0.9
count = 16

def arch_module(z):
    out = []

    def cube(x,y,sx,sy,rot):
        out.append(
f'''      (list "type" "cube"
        "x" {x}
        "y" {y}
        "z" {z}
        "sx" {sx}
        "sy" {sy}
        "sz" 1
        "rotZ" {rot}
        "r" 230
        "g" 230
        "b" 240
      )'''
        )

    out.append(
f'''      (list "type" "cube"
        "x" -6
        "y" 2
        "z" {z}
        "sx" 1.2
        "sy" 5
        "sz" 1.2
        "r" 180
        "g" 180
        "b" 190
      )'''
    )

    out.append(
f'''      (list "type" "cube"
        "x" 6
        "y" 2
        "z" {z}
        "sx" 1.2
        "sy" 5
        "sz" 1.2
        "r" 180
        "g" 180
        "b" 190
      )'''
    )

    segs = [
        ( 5.93,0.90,1.1,0.45,-1.42),
        ( 5.73,1.77,1.1,0.45,-1.27),
        ( 5.40,2.61,1.1,0.45,-1.12),
        ( 4.95,3.39,1.1,0.45,-0.97),
        ( 4.39,4.09,1.1,0.45,-0.82),
        ( 3.73,4.69,1.1,0.45,-0.67),
        ( 2.99,5.20,1.1,0.45,-0.52),
        ( 2.17,5.59,1.1,0.45,-0.37),
        ( 1.31,5.85,1.1,0.45,-0.22),
        ( 0.00,6.00,1.1,0.45, 0.00),
        (-1.31,5.85,1.1,0.45, 0.22),
        (-2.17,5.59,1.1,0.45, 0.37),
        (-2.99,5.20,1.1,0.45, 0.52),
        (-3.73,4.69,1.1,0.45, 0.67),
        (-4.39,4.09,1.1,0.45, 0.82),
        (-4.95,3.39,1.1,0.45, 0.97),
        (-5.40,2.61,1.1,0.45, 1.12),
        (-5.73,1.77,1.1,0.45, 1.27),
        (-5.93,0.90,1.1,0.45, 1.42),
    ]

    for s in segs:
        cube(*s)

    return "\n\n".join(out)

mods = []

for i in range(count):
    z = round(-(i * spacing), 2)
    mods.append(arch_module(z))

scene = f'''
(begin
  (list
    "objects"
    (list

      (list
        "type" "cube"
        "x" 0
        "y" -1
        "z" -8
        "sx" 220
        "sy" 1
        "sz" 220
        "r" 70
        "g" 70
        "b" 70
      )

{chr(10).join(mods)}

    )
  )
)
'''

Path("examples/building/arch_hallway_16.sim").write_text(scene)

print("rebuilt evenly spaced hallway")
