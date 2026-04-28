export function render(commands) {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of commands) {
    const [type, ...args] = cmd;

    if (type === "circle") {
      const [x, y, r, cr=255, cg=255, cb=255] = args;
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "rect") {
      const [x, y, w, h, cr=255, cg=255, cb=255] = args;
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.fillRect(x, y, w, h);
    }
  }
}
