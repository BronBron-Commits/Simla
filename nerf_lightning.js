import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

s = s.replace(
  `const damage = Math.round(30 * (1 - dist / 8)) + 8;`,
  `const damage = Math.round(6 * (1 - dist / 8)) + 2;`
);

s = s.replace(
  `const push = 1.2 * (1 - dist / 8);`,
  `const push = 0.25 * (1 - dist / 8);`
);

s = s.replace(
  `if (dist <= 8) {`,
  `if (dist <= 5) {`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("nerfed lightning damage/push/radius");
