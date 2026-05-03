import fs from "fs";

let s = fs.readFileSync("simla3d_first_person.html", "utf8");

// Start summon cooldown immediately instead of waiting random delay
s = s.replace(
`        if (!state.lastSummon) state.lastSummon = now + Math.random() * 6000;`,
`        if (!state.lastSummon) state.lastSummon = 0;`
);

// Summon every 5-ish seconds instead of 16-ish seconds
s = s.replace(
`        if (now - state.lastSummon > 16000 + (state.wanderPhase || 0) * 1000) {`,
`        if (now - state.lastSummon > 5000 + Math.abs(Math.sin(state.wanderPhase || 0)) * 1200) {`
);

// Make phoenix last longer
s = s.replace(
`        life: 18000,`,
`        life: 28000,`
);

fs.writeFileSync("simla3d_first_person.html", s);
console.log("patched more frequent phoenix summons");
