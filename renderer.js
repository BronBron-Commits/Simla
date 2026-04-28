export function render(ctx, commands) {
  if (!ctx) return;

  ctx.clearRect(0, 0, 800, 600);

  for (const cmd of commands) {
    if (!cmd) continue;

    const [type, x, y, a, b, r, g, bl] = cmd;

    if (type === "circle") {
      const radius = a;
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "rect") {
      const w = a, h = b;
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(x, y, w, h);
    }
  }
}
