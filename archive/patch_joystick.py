from pathlib import Path

p = Path("sim3d.html")
s = p.read_text()

# Add joystick CSS
s = s.replace(
'''    #hud { position: fixed; top: 12px; left: 12px; background: #0009; padding: 10px; border-radius: 8px; }''',
'''    #hud { position: fixed; top: 12px; left: 12px; background: #0009; padding: 10px; border-radius: 8px; }
    #joy {
      position: fixed;
      left: 24px;
      bottom: 24px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: #ffffff18;
      border: 2px solid #ffffff44;
      touch-action: none;
    }
    #knob {
      position: absolute;
      left: 45px;
      top: 45px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #66ccffcc;
      box-shadow: 0 0 18px #66ccff88;
      touch-action: none;
    }'''
)

# Add joystick HTML
s = s.replace(
'''  <canvas id="view"></canvas>''',
'''  <canvas id="view"></canvas>
  <div id="joy"><div id="knob"></div></div>'''
)

# Remove old touchmove block if present
start = s.find('    let touchX = 0;')
if start != -1:
    end = s.find('    const cubeVerts', start)
    s = s[:start] + s[end:]

# Insert joystick JS before cubeVerts
insert = '''    let inputX = 0;
    let inputY = 0;

    const joy = document.getElementById("joy");
    const knob = document.getElementById("knob");

    function setJoystick(clientX, clientY) {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = clientX - cx;
      let dy = clientY - cy;

      const max = rect.width * 0.35;
      const len = Math.hypot(dx, dy);

      if (len > max) {
        dx = dx / len * max;
        dy = dy / len * max;
      }

      inputX = dx / max;
      inputY = dy / max;

      knob.style.left = `${45 + dx}px`;
      knob.style.top = `${45 + dy}px`;
    }

    function resetJoystick() {
      inputX = 0;
      inputY = 0;
      knob.style.left = "45px";
      knob.style.top = "45px";
    }

    joy.addEventListener("pointerdown", e => {
      joy.setPointerCapture(e.pointerId);
      setJoystick(e.clientX, e.clientY);
    });

    joy.addEventListener("pointermove", e => {
      if (e.buttons) setJoystick(e.clientX, e.clientY);
    });

    joy.addEventListener("pointerup", resetJoystick);
    joy.addEventListener("pointercancel", resetJoystick);

'''

s = s.replace('    const cubeVerts = [', insert + '    const cubeVerts = [')

# Replace run input
s = s.replace(
'''      const step = run(bytecode, {
        tick: time,
        inputX: touchX,
        inputY: touchY
      });''',
'''      const step = run(bytecode, {
        tick: time,
        inputX,
        inputY
      });'''
)

p.write_text(s)
print("Added on-screen joystick")
