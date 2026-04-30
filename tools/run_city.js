import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";
import fs from "fs";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

function get(list, key, fallback = undefined) {
  if (!Array.isArray(list)) return fallback;
  for (let i = 0; i < list.length; i += 2) {
    if (list[i] === key) return list[i + 1];
  }
  return fallback;
}

function citizenLine(e) {
  return `citizen ${get(e, "id")} tile=${get(e, "tile")} home=${get(e, "home")} job=${get(e, "job")} money=$${get(e, "money")} mode=${get(e, "mode")}`;
}

const file = process.argv[2] || "examples/city_sim.sim";
const steps = Number(process.argv[3] || 20);

const code = fs.readFileSync(file, "utf8");
const ast = parse(tokenize(code));
const bytecode = compile(ast);

let state = [
  "tick", 0,
  "entities", [
    ["id",100,"type","home","tile",2],
    ["id",101,"type","home","tile",7],
    ["id",102,"type","home","tile",24],
    ["id",103,"type","home","tile",31],

    ["id",200,"type","job","tile",16],
    ["id",201,"type","job","tile",20],
    ["id",202,"type","job","tile",28],
    ["id",203,"type","job","tile",34],

    ["id",1,"type","citizen","tile",2,"home",2,"job",16,"money",0,"mode","morning"],
    ["id",2,"type","citizen","tile",3,"home",2,"job",20,"money",0,"mode","morning"],
    ["id",3,"type","citizen","tile",7,"home",7,"job",16,"money",0,"mode","morning"],
    ["id",4,"type","citizen","tile",8,"home",7,"job",28,"money",0,"mode","morning"],
    ["id",5,"type","citizen","tile",24,"home",24,"job",34,"money",0,"mode","morning"],
    ["id",6,"type","citizen","tile",25,"home",24,"job",20,"money",0,"mode","morning"],
    ["id",7,"type","citizen","tile",31,"home",31,"job",28,"money",0,"mode","morning"],
    ["id",8,"type","citizen","tile",32,"home",31,"job",34,"money",0,"mode","morning"],
    ["id",9,"type","citizen","tile",1,"home",2,"job",16,"money",0,"mode","morning"],
    ["id",10,"type","citizen","tile",6,"home",7,"job",20,"money",0,"mode","morning"]
  ]
];

for (let i = 0; i < steps; i++) {
  const result = run(bytecode, { state }).result;
  state = get(result, "state", state);

  const tick = get(state, "tick");
  const phase = get(state, "phase", "unknown");
  const entities = get(state, "entities", []);
  const citizens = entities.filter(e => get(e, "type") === "citizen");
  const totalMoney = citizens.reduce((sum, e) => sum + get(e, "money", 0), 0);

  console.log(`\n=== TICK ${tick} phase=${phase} totalMoney=$${totalMoney} ===`);
  for (const c of citizens) {
    console.log(citizenLine(c));
  }
}
