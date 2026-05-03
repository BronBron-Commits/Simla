import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

if (s.includes("function updateWarriorMelee")) {
  console.log("melee already installed, skipping");
  process.exit(0);
}

const insert = `

    // ===== WARRIOR MELEE SYSTEM =====

    function nearestEnemyAgentTo(x, z, team, maxRange = Infinity) {
      let best = null;
      let bestDist = maxRange;

      for (const other of agents.values()) {
        if (other.team === team) continue;
        if (other.group.userData.dead) continue;

        const dx = other.group.position.x - x;
        const dz = other.group.position.z - z;
        const dist = Math.hypot(dx, dz);

        if (dist < bestDist) {
          bestDist = dist;
          best = other;
        }
      }

      return best;
    }

    function spawnMeleeSlash(pos, team) {
      const mat = new THREE.MeshBasicMaterial({
        color: team === 0 ? "#ff5555" : "#55aaff",
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const slash = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.035, 8, 32, Math.PI * 1.25),
        mat
      );

      slash.position.copy(pos);
      slash.position.y += 0.8;
      slash.rotation.x = Math.PI / 2;
      root.add(slash);

      spellExplosions.push({
        mesh: slash,
        vx: 0,
        vy: 0,
        vz: 0,
        born: performance.now(),
        life: 260
      });
    }

    function updateWarriorMelee() {
      const now = performance.now();

      for (const state of agents.values()) {
        if (state.group.userData.dead) continue;

        const role = String(state.group.userData.role || "");
        if (role !== "warrior") continue;

        if (!state.lastMelee) state.lastMelee = 0;

        const target = nearestEnemyAgentTo(
          state.group.position.x,
          state.group.position.z,
          state.team,
          2.2
        );

        if (!target) continue;

        const dx = target.group.position.x - state.group.position.x;
        const dz = target.group.position.z - state.group.position.z;
        state.group.rotation.y = Math.atan2(dx, dz);

        if (now - state.lastMelee > 850) {
          state.lastMelee = now;

          damageAgent(target, 14, "warrior_melee");
          spawnMeleeSlash(target.group.position, state.team);
        }
      }
    }
`;

// inject BEFORE animate()
s = s.replace(
  "function animate() {",
  insert + "\n\n    function animate() {"
);

// hook into loop
s = s.replace(
  "updateWizardSpells();",
  "updateWarriorMelee();\n      updateWizardSpells();"
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("clean melee patch applied");
