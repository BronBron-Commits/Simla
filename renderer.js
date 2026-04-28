export function render(commands) {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cmd of commands) {
    const [type, ...args] = cmd;

    if (type === "rect") {
      const [x, y, w, h, r=0, g=0, b=0] = args;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, w, h);
    }

    if (type === "circle") {
      const [x, y, radius, r=0, g=0, b=0] = args;

      ctx.fillStyle = `rgb(${r},${g},${b})`;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (type === "rotate") {
      const [angle, inner] = args;

      ctx.save();
      ctx.translate(400, 300);
      ctx.rotate(angle);
      ctx.translate(-400, -300);

      render([inner]);

      ctx.restore();
    }

    if (type === "translate") {
      const [tx, ty, inner] = args;

      ctx.save();
      ctx.translate(tx, ty);

      render([inner]);

      ctx.restore();
    }
  }
}
