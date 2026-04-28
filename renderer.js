export function render(ctx, commands) {
  if (!ctx) return;

  ctx.clearRect(0, 0, 800, 600);

  for (const cmd of commands) {
    if (!cmd) continue;

    const [type, x, y, w, h, r, g, b] = cmd;

    if (type === "circle") {
      const [_, cx, cy, rad, cr, cg, cb] = cmd;
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "rect") {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, w, h);
    }
  }
}
