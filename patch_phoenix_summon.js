import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

// Add summons array
s = s.replace(
`const spellExplosions = [];`,
`const spellExplosions = [];
    const summons = [];`
);

// Add phoenix functions before updateWizardSpells
s = s.replace(
`    function updateWizardSpells() {`,
`    function spawnPhoenixSummon(wizardState) {
      if (!wizardState || wizardState.group.userData.dead) return;

      const team = wizardState.team;
      const base = wizardState.group.position.clone();

      const group = new THREE.Group();
      group.name = "phoenix_summon";
      group.position.set(base.x, base.y + 5.5, base.z);

      const bodyMat = new THREE.MeshBasicMaterial({
        color: "#ff7a18",
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const wingMat = new THREE.MeshBasicMaterial({
        color: "#ffd45a",
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 12),
        bodyMat
      );
      body.name = "phoenix_body";
      group.add(body);

      const leftWing = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 3.4, 4),
        wingMat
      );
      leftWing.name = "phoenix_left_wing";
      leftWing.position.set(-1.4, 0, 0);
      leftWing.rotation.z = Math.PI / 2;
      group.add(leftWing);

      const rightWing = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 3.4, 4),
        wingMat
      );
      rightWing.name = "phoenix_right_wing";
      rightWing.position.set(1.4, 0, 0);
      rightWing.rotation.z = -Math.PI / 2;
      group.add(rightWing);

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 18, 12),
        new THREE.MeshBasicMaterial({
          color: "#ff4422",
          transparent: true,
          opacity: 0.16,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      aura.name = "phoenix_aura";
      group.add(aura);

      const light = new THREE.PointLight("#ff8a22", 3.0, 18);
      light.name = "phoenix_light";
      group.add(light);

      root.add(group);

      summons.push({
        type: "phoenix",
        team,
        group,
        born: performance.now(),
        life: 18000,
        lastPulse: 0,
        phase: Math.random() * Math.PI * 2
      });

      spawnSpellExplosion(group.position);
    }

    function updateSummons() {
      const now = performance.now();

      for (let i = summons.length - 1; i >= 0; i--) {
        const summon = summons[i];
        const age = now - summon.born;
        const t = age / summon.life;

        if (t >= 1) {
          spawnSpellExplosion(summon.group.position);
          root.remove(summon.group);
          summon.group.traverse(child => {
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose?.());
            } else {
              child.material?.dispose?.();
            }
          });
          summons.splice(i, 1);
          continue;
        }

        const bob = Math.sin(now * 0.003 + summon.phase) * 1.2;
        summon.group.position.y = 6.5 + bob;
        summon.group.rotation.y += 0.025;

        const leftWing = summon.group.getObjectByName("phoenix_left_wing");
        const rightWing = summon.group.getObjectByName("phoenix_right_wing");
        const aura = summon.group.getObjectByName("phoenix_aura");

        const flap = Math.sin(now * 0.012 + summon.phase);

        if (leftWing) leftWing.rotation.z = Math.PI / 2 + flap * 0.45;
        if (rightWing) rightWing.rotation.z = -Math.PI / 2 - flap * 0.45;

        if (aura) {
          const pulse = 1.0 + Math.abs(Math.sin(now * 0.006)) * 0.35;
          aura.scale.setScalar(pulse);
          aura.material.opacity = 0.10 + Math.abs(Math.sin(now * 0.006)) * 0.12;
        }

        if (now - summon.lastPulse > 1200) {
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
        }
      }
    }

    function updateWizardSpells() {`
);

// Give wizards rare summon cooldown inside wizard loop
s = s.replace(
`        if (!state.lastSpell) state.lastSpell = 0;

        if (now - state.lastSpell > 1800 + (state.wanderPhase || 0) * 250) {`,
`        if (!state.lastSpell) state.lastSpell = 0;
        if (!state.lastSummon) state.lastSummon = now + Math.random() * 6000;

        if (now - state.lastSummon > 16000 + (state.wanderPhase || 0) * 1000) {
          state.lastSummon = now;
          spawnPhoenixSummon(state);
        }

        if (now - state.lastSpell > 1800 + (state.wanderPhase || 0) * 250) {`
);

// Call summons in animate loop
s = s.replace(
`      updateWizardSpells();
      updateArcherArrows();
      updateSpellExplosions();`,
`      updateWizardSpells();
      updateArcherArrows();
      updateSummons();
      updateSpellExplosions();`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched phoenix summons");
