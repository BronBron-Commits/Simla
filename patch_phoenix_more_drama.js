import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

s = s.replace(
`        const rise = Math.min(1, age / 4200);
        const easeRise = rise * rise * (3 - 2 * rise);
        summon.group.position.y = 2.5 + easeRise * 16.0 + Math.sin(now * 0.01 + summon.phase) * 0.45;
        summon.group.rotation.y += 0.055;`,
`        const rise = Math.min(1, age / 3600);
        const easeRise = 1 - Math.pow(1 - rise, 3);

        summon.group.position.y =
          1.2 +
          easeRise * 30.0 +
          Math.sin(now * 0.018 + summon.phase) * 1.1;

        summon.group.rotation.y += 0.13;
        summon.group.rotation.z = Math.sin(now * 0.009 + summon.phase) * 0.35;

        const summonScale = 0.8 + rise * 2.2;
        summon.group.scale.setScalar(summonScale);`
);

s = s.replace(
`        if (leftWing) leftWing.rotation.z = Math.PI / 2 + flap * 0.45;
        if (rightWing) rightWing.rotation.z = -Math.PI / 2 - flap * 0.45;`,
`        if (leftWing) {
          leftWing.rotation.z = Math.PI / 2 + flap * 1.05;
          leftWing.rotation.x = flap * 0.45;
        }

        if (rightWing) {
          rightWing.rotation.z = -Math.PI / 2 - flap * 1.05;
          rightWing.rotation.x = -flap * 0.45;
        }`
);

s = s.replace(
`        if (!summon.exploded && age > 4800) {`,
`        if (!summon.exploded && age > 4100) {`
);

s = s.replace(
`          for (let boom = 0; boom < 5; boom++) {
            spawnSpellExplosion(summon.group.position);
          }`,
`          for (let boom = 0; boom < 12; boom++) {
            spawnSpellExplosion(summon.group.position);
          }`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched phoenix dramatic rise");
