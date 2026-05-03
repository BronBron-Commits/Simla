import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

// Inject team stacking center pull
s = s.replace(
`        let finalX = baseX + wanderX;
        let finalZ = baseZ + wanderZ;

        // simple crowd avoidance`,
`        let finalX = baseX + wanderX;
        let finalZ = baseZ + wanderZ;

        // enemy team stacks together
        if (state.team === 1) {
          let cx = 0;
          let cz = 0;
          let count = 0;

          for (const other of agents.values()) {
            if (other.team !== 1 || other.group.userData.dead) continue;
            cx += other.group.position.x;
            cz += other.group.position.z;
            count++;
          }

          if (count > 0) {
            cx /= count;
            cz /= count;

            finalX = finalX * 0.72 + cx * 0.28;
            finalZ = finalZ * 0.72 + cz * 0.28;
          }
        }

        // simple crowd avoidance`
);

// Reduce avoidance for same enemy team
s = s.replace(
`          if (distSq > 0.0001 && distSq < 4.0) {
            const dist = Math.sqrt(distSq);
            const push = (2.0 - dist) * 0.35;`,
`          const sameEnemyTeam = state.team === 1 && other.team === 1;
          const avoidRadius = sameEnemyTeam ? 0.6 : 2.0;
          const avoidStrength = sameEnemyTeam ? 0.08 : 0.35;

          if (distSq > 0.0001 && distSq < avoidRadius * avoidRadius) {
            const dist = Math.sqrt(distSq);
            const push = (avoidRadius - dist) * avoidStrength;`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched enemy stacking");
