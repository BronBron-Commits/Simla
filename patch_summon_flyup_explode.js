import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

// Less frequent summons: about every 14–18 seconds per wizard
s = s.replace(
`        if (now - state.lastSummon > 5000 + Math.abs(Math.sin(state.wanderPhase || 0)) * 1200) {`,
`        if (now - state.lastSummon > 14000 + Math.abs(Math.sin(state.wanderPhase || 0)) * 4000) {`
);

// Shorter lifetime
s = s.replace(
`        life: 28000,`,
`        life: 6500,`
);

// Replace hover behavior with fly-up behavior
s = s.replace(
`        const bob = Math.sin(now * 0.003 + summon.phase) * 1.2;
        summon.group.position.y = 6.5 + bob;
        summon.group.rotation.y += 0.025;`,
`        const rise = Math.min(1, age / 4200);
        const easeRise = rise * rise * (3 - 2 * rise);
        summon.group.position.y = 2.5 + easeRise * 16.0 + Math.sin(now * 0.01 + summon.phase) * 0.45;
        summon.group.rotation.y += 0.055;`
);

// Make pulse only happen once near the end, as the explosion
s = s.replace(
`        if (now - summon.lastPulse > 1200) {
          summon.lastPulse = now;

          for (const state of agents.values()) {
            if (state.group.userData.dead) continue;

            const dist = summon.group.position.distanceTo(state.group.position);

            if (dist > 12) continue;

            if (state.team === summon.team) {
              const maxHp = Number(state.group.userData.maxHp ?? 100);
              const hp = Number(state.group.userData.hp ?? 100);
              state.group.userData.hp = Math.min(maxHp, hp + 8);
              state.group.userData.lastDamageTime = performance.now();
            } else {
              damageAgent(state, 10, "phoenix_burn");
              igniteAgent(state);
            }
          }

          spawnSpellExplosion(summon.group.position);
        }`,
`        if (!summon.exploded && age > 4800) {
          summon.exploded = true;

          for (const state of agents.values()) {
            if (state.group.userData.dead) continue;

            const dist = summon.group.position.distanceTo(state.group.position);
            if (dist > 18) continue;

            if (state.team === summon.team) {
              const maxHp = Number(state.group.userData.maxHp ?? 100);
              const hp = Number(state.group.userData.hp ?? 100);
              state.group.userData.hp = Math.min(maxHp, hp + 18);
              state.group.userData.lastDamageTime = performance.now();
            } else {
              damageAgent(state, 22, "phoenix_explosion");
              igniteAgent(state);
            }
          }

          for (let boom = 0; boom < 5; boom++) {
            spawnSpellExplosion(summon.group.position);
          }

          summon.group.visible = false;
        }`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched phoenix fly-up explosion");
