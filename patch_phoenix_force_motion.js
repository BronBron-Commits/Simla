import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

// Store launch position on summon
s = s.replace(
`        group,
        born: performance.now(),`,
`        group,
        start: group.position.clone(),
        born: performance.now(),`
);

// Replace phoenix motion block with forced launch motion
s = s.replace(
/        const rise = Math\.min\(1, age \/ 3600\);[\s\S]*?        summon\.group\.scale\.setScalar\(summonScale\);/,
`        const rise = Math.min(1, age / 3600);
        const easeRise = rise * rise * (3 - 2 * rise);

        const start = summon.start || summon.group.position;
        const spiral = age * 0.006 + summon.phase;

        summon.group.position.set(
          start.x + Math.cos(spiral) * rise * 4.5,
          start.y + easeRise * 32.0,
          start.z + Math.sin(spiral) * rise * 4.5
        );

        summon.group.rotation.y += 0.22;
        summon.group.rotation.z = Math.sin(age * 0.018) * 0.75;

        const summonScale = 0.6 + rise * 2.8;
        summon.group.scale.setScalar(summonScale);

        if (age % 180 < 35) {
          spawnSpellExplosion(summon.group.position);
        }`
);

// Make sure updateSummons is actually called
if (!s.includes("updateSummons();")) {
  s = s.replace(
`      updateWizardSpells();`,
`      updateWizardSpells();
      updateSummons();`
  );
}

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched phoenix forced upward motion");
