import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

s = s.replace(
`        let finalX = baseX + wanderX;
        let finalZ = baseZ + wanderZ;`,
`        let finalX = baseX + wanderX;
        let finalZ = baseZ + wanderZ;

        // teams charge toward the nearest living enemy center
        let enemyCx = 0;
        let enemyCz = 0;
        let enemyCount = 0;

        for (const other of agents.values()) {
          if (other === state) continue;
          if (other.group.userData.dead) continue;
          if (other.team === state.team) continue;

          enemyCx += other.group.position.x;
          enemyCz += other.group.position.z;
          enemyCount++;
        }

        if (enemyCount > 0) {
          enemyCx /= enemyCount;
          enemyCz /= enemyCount;

          const dxEnemy = enemyCx - finalX;
          const dzEnemy = enemyCz - finalZ;
          const distEnemy = Math.hypot(dxEnemy, dzEnemy);

          if (distEnemy > 0.01) {
            const chargeSpeed = state.team === 1 ? 0.42 : 0.36;
            finalX += (dxEnemy / distEnemy) * chargeSpeed;
            finalZ += (dzEnemy / distEnemy) * chargeSpeed;
          }
        }`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched team charging");
