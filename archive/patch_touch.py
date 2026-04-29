from pathlib import Path

p = Path("sim3d.html")
s = p.read_text()

if "touchX" not in s:
    s = s.replace(
'''    resize();''',
'''    resize();

    let touchX = 0;
    let touchY = 0;

    addEventListener("touchmove", e => {
      const t = e.touches[0];
      const nx = t.clientX / innerWidth;
      const ny = t.clientY / innerHeight;

      touchX = (nx - 0.5) * 2;
      touchY = (ny - 0.5) * 2;
    });'''
    )

s = s.replace(
'''run(bytecode, { tick: time });''',
'''run(bytecode, {
        tick: time,
        inputX: touchX,
        inputY: touchY
      });'''
)

p.write_text(s)
print("Added touch input")
