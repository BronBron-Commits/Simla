/**
 * tools/parse_rwx.js
 *
 * Parses an RWX ASCII file (Renderware Exchange Format as used by Deltaworlds /
 * Active Worlds) and returns a flat array of scene objects that are compatible
 * with the Simla3D viewer's pairsToObj() contract.
 *
 * Supported commands
 * ─────────────────
 * Structure  : ModelBegin/End, ClumpBegin/End, ProtoBegin/End,
 *              ProtoInstance, ProtoInstanceGeometry
 * Geometry   : Vertex, Triangle, Quad, Polygon,
 *              Block, Cone, Cylinder, Disc, Hemisphere, Sphere
 * Transforms : Identity, Translate, Rotate, Scale, Transform,
 *              TransformBegin, TransformEnd
 * Materials  : MaterialBegin, MaterialEnd, MaterialMode,
 *              Surface, Color, Ambient, Diffuse, Specular,
 *              Opacity, Texture, TextureMode
 * Misc       : Tag, Collision, #-comments, #!-extensions (ignored)
 *
 * Output format  (each object is the Simla3D "pairs" list as a plain JS object)
 * ─────────────────────────────────────────────────────────────────────────────
 * { type, id, vertices[], faces[], color, texture, opacity,
 *   ambient, diffuse, specular, materialMode,
 *   matrix4 (flat 16-element row-major), tag }
 *
 * Primitive commands (Block, Sphere, …) emit objects with type = primitive
 * so the viewer can hand them to Three.js geometry helpers.
 */

// ─── tiny math helpers ──────────────────────────────────────────────────────

function identityMat() {
  // row-major 4×4
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}

function cloneMat(m) { return m.slice(); }

function multiplyMat(a, b) {
  const r = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[row*4+k] * b[k*4+col];
      r[row*4+col] = v;
    }
  }
  return r;
}

function translateMat(m, x, y, z) {
  const t = identityMat();
  t[3]  = x;
  t[7]  = y;
  t[11] = z;
  return multiplyMat(t, m);
}

function scaleMat(m, sx, sy, sz) {
  const s = identityMat();
  s[0] = sx; s[5] = sy; s[10] = sz;
  return multiplyMat(s, m);
}

function rotateMat(m, ax, ay, az, deg) {
  const rad = deg * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const len = Math.sqrt(ax*ax + ay*ay + az*az) || 1;
  ax /= len; ay /= len; az /= len;
  const r = [
    c + ax*ax*(1-c),   ax*ay*(1-c) - az*s, ax*az*(1-c) + ay*s, 0,
    ay*ax*(1-c) + az*s, c + ay*ay*(1-c),   ay*az*(1-c) - ax*s, 0,
    az*ax*(1-c) - ay*s, az*ay*(1-c) + ax*s, c + az*az*(1-c),   0,
    0, 0, 0, 1
  ];
  return multiplyMat(r, m);
}

function applyMat(m, x, y, z) {
  return {
    x: m[0]*x + m[1]*y + m[2]*z  + m[3],
    y: m[4]*x + m[5]*y + m[6]*z  + m[7],
    z: m[8]*x + m[9]*y + m[10]*z + m[11]
  };
}

// ─── tokeniser ──────────────────────────────────────────────────────────────

function tokeniseLine(line) {
  // Strip trailing comments that are NOT #! extensions
  // "#!" at the start of a token = extension keyword, keep the rest of the line
  const excl = line.match(/^(.*?)\s+(#![^#\s].*)$/i);
  let ext = null;
  let base = line;
  if (excl) {
    base = excl[1];
    ext  = excl[2];
  } else {
    // plain # comment – drop
    const ci = line.indexOf("#");
    if (ci !== -1) base = line.slice(0, ci);
  }
  return { tokens: base.trim().split(/\s+/).filter(Boolean), ext };
}

// ─── default material state ──────────────────────────────────────────────────

function defaultMat() {
  return {
    color:        "#cccccc",
    ambient:      0.5,
    diffuse:      0.5,
    specular:     0.0,
    opacity:      1.0,
    texture:      null,
    textureMode:  "lit",
    materialMode: "null",
    tag:          0
  };
}

// ─── fan-triangulate a polygon list  ─────────────────────────────────────────

function fanTriangulate(indices) {
  const tris = [];
  for (let i = 1; i < indices.length - 1; i++) {
    tris.push([indices[0], indices[i], indices[i+1]]);
  }
  return tris;
}

// ─── colour helper ──────────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  const c = v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

// ─── main parser ─────────────────────────────────────────────────────────────

export function parseRWX(src) {
  const lines = src.split(/\r?\n/);

  // prototype registry
  const prototypes = {};   // name → { vertices, faces, mat }

  // output scene objects
  const objects = [];
  let   objCounter = 0;

  // clump / proto stacks
  const clumpStack   = [];
  const matStack     = [];
  const xformStack   = [];

  let currentMat   = defaultMat();
  let currentXform = identityMat();

  // active clump
  let clump = null;

  // proto recording
  let proto        = null;
  let protoName    = null;
  let protoDepth   = 0;   // track nested structure inside proto

  function newClump() {
    return {
      id:       "clump_" + (++objCounter),
      vertices: [],         // { x, y, z, u, v }
      faces:    [],         // { indices (0-based), tag }
      mat:      { ...currentMat },
      xform:    cloneMat(currentXform),
      children: []
    };
  }

  function pushClump() {
    if (clump) clumpStack.push(clump);
    clump = newClump();
  }

  function popClump() {
    const finished = clump;
    clump = clumpStack.length ? clumpStack.pop() : null;

    if (!finished || (!finished.vertices.length && !finished.faces.length && !finished.children.length)) {
      return;
    }
    if (clump) {
      // nested — attach as child
      clump.children.push(finished);
    } else {
      // top-level — emit as scene object
      objects.push(clumpToSceneObj(finished));
    }
  }

  function clumpToSceneObj(c) {
    return {
      type:         "rwx_clump",
      id:           c.id,
      vertices:     c.vertices,
      faces:        c.faces,
      color:        c.mat.color,
      texture:      c.mat.texture,
      opacity:      c.mat.opacity,
      ambient:      c.mat.ambient,
      diffuse:      c.mat.diffuse,
      specular:     c.mat.specular,
      materialMode: c.mat.materialMode,
      matrix4:      c.xform,
      tag:          c.mat.tag,
      children:     c.children.map(clumpToSceneObj)
    };
  }

  function currentVertexCount() {
    return clump ? clump.vertices.length : 0;
  }

  function addVertex(x, y, z, u, v) {
    if (!clump) return;
    const p = applyMat(currentXform, x, y, z);
    clump.vertices.push({ x: p.x, y: p.y, z: p.z, u: u ?? 0, v: v ?? 0 });
  }

  function addFace(rawIndices, tag) {
    if (!clump) return;
    // rawIndices are 1-based per RWX spec → convert to 0-based
    const zero = rawIndices.map(i => i - 1);
    const tris = fanTriangulate(zero);
    for (const tri of tris) {
      clump.faces.push({ indices: tri, tag: tag || 0 });
    }
  }

  // ── emit a procedural primitive as a compact scene object ─────────────────
  function emitPrimitive(kind, params) {
    objects.push({
      type:         "rwx_primitive",
      id:           "prim_" + (++objCounter),
      kind,
      params,
      color:        currentMat.color,
      texture:      currentMat.texture,
      opacity:      currentMat.opacity,
      ambient:      currentMat.ambient,
      diffuse:      currentMat.diffuse,
      specular:     currentMat.specular,
      materialMode: currentMat.materialMode,
      matrix4:      cloneMat(currentXform),
      tag:          currentMat.tag
    });
  }

  // ── proto helpers ─────────────────────────────────────────────────────────

  function flushProtoIntoClump(name, copyMaterial) {
    const p = prototypes[name];
    if (!p || !clump) return;

    const offset = clump.vertices.length;
    for (const v of p.vertices) {
      const w = applyMat(currentXform, v.x, v.y, v.z);
      clump.vertices.push({ x: w.x, y: w.y, z: w.z, u: v.u, v: v.v });
    }
    for (const f of p.faces) {
      clump.faces.push({
        indices: f.indices.map(i => i + offset),
        tag: f.tag
      });
    }
    if (copyMaterial) {
      // adopt prototype material into current clump material
      Object.assign(clump.mat, p.mat);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Line-by-line processing
  // ─────────────────────────────────────────────────────────────────────────

  for (const rawLine of lines) {
    const { tokens } = tokeniseLine(rawLine);
    if (!tokens.length) continue;

    const cmd = tokens[0].toLowerCase();

    // ── structure ──────────────────────────────────────────────────────────
    if (cmd === "modelbegin" || cmd === "modelend") continue;

    if (cmd === "clumpbegin") {
      if (proto !== null) { protoDepth++; continue; }
      pushClump();
      continue;
    }

    if (cmd === "clumpend") {
      if (proto !== null) { if (protoDepth > 0) protoDepth--; continue; }
      popClump();
      continue;
    }

    if (cmd === "protobegin") {
      protoName = tokens[1] || ("proto_" + (++objCounter));
      proto = newClump();
      proto.id = "proto_" + protoName;
      protoDepth = 0;
      continue;
    }

    if (cmd === "protoend") {
      if (proto) {
        prototypes[protoName] = {
          vertices: proto.vertices,
          faces:    proto.faces,
          mat:      { ...proto.mat }
        };
      }
      proto = null;
      protoName = null;
      continue;
    }

    if (cmd === "protoinstance") {
      const name = tokens[1];
      if (proto !== null) {
        // inside a proto definition – expand inline
        if (prototypes[name]) {
          const p = prototypes[name];
          const off = proto.vertices.length;
          for (const v of p.vertices) proto.vertices.push({ ...v });
          for (const f of p.faces) proto.faces.push({ indices: f.indices.map(i => i + off), tag: f.tag });
        }
      } else {
        flushProtoIntoClump(name, true);
      }
      continue;
    }

    if (cmd === "protoinstancegeometry") {
      const name = tokens[1];
      if (proto !== null) {
        if (prototypes[name]) {
          const p = prototypes[name];
          const off = proto.vertices.length;
          for (const v of p.vertices) proto.vertices.push({ ...v });
          for (const f of p.faces) proto.faces.push({ indices: f.indices.map(i => i + off), tag: f.tag });
        }
      } else {
        flushProtoIntoClump(name, false);
      }
      continue;
    }

    // ── geometry ──────────────────────────────────────────────────────────

    const target = proto !== null ? proto : null; // geometry goes into proto or current clump

    if (cmd === "vertex" || cmd === "vertexext") {
      const x = parseFloat(tokens[1]);
      const y = parseFloat(tokens[2]);
      const z = parseFloat(tokens[3]);
      let u = 0, v = 0;
      const uvIdx = tokens.findIndex(t => t.toLowerCase() === "uv");
      if (uvIdx !== -1) { u = parseFloat(tokens[uvIdx+1]); v = parseFloat(tokens[uvIdx+2]); }

      if (target) {
        const p2 = applyMat(currentXform, x, y, z);
        target.vertices.push({ x: p2.x, y: p2.y, z: p2.z, u, v });
      } else {
        addVertex(x, y, z, u, v);
      }
      continue;
    }

    if (cmd === "triangle") {
      const v1 = parseInt(tokens[1]);
      const v2 = parseInt(tokens[2]);
      const v3 = parseInt(tokens[3]);
      const tagIdx = tokens.findIndex(t => t.toLowerCase() === "tag");
      const tag = tagIdx !== -1 ? parseInt(tokens[tagIdx+1]) : 0;
      if (target) {
        target.faces.push({ indices: [v1-1, v2-1, v3-1], tag });
      } else {
        addFace([v1, v2, v3], tag);
      }
      continue;
    }

    if (cmd === "quad" || cmd === "quadext") {
      const v1 = parseInt(tokens[1]);
      const v2 = parseInt(tokens[2]);
      const v3 = parseInt(tokens[3]);
      const v4 = parseInt(tokens[4]);
      const tagIdx = tokens.findIndex(t => t.toLowerCase() === "tag");
      const tag = tagIdx !== -1 ? parseInt(tokens[tagIdx+1]) : 0;
      if (target) {
        for (const tri of fanTriangulate([v1-1, v2-1, v3-1, v4-1])) target.faces.push({ indices: tri, tag });
      } else {
        addFace([v1, v2, v3, v4], tag);
      }
      continue;
    }

    if (cmd === "polygon" || cmd === "polygonext") {
      const n = parseInt(tokens[1]);
      const indices = tokens.slice(2, 2+n).map(Number);
      const tagIdx = tokens.findIndex(t => t.toLowerCase() === "tag");
      const tag = tagIdx !== -1 ? parseInt(tokens[tagIdx+1]) : 0;
      if (target) {
        for (const tri of fanTriangulate(indices.map(i => i-1))) target.faces.push({ indices: tri, tag });
      } else {
        addFace(indices, tag);
      }
      continue;
    }

    // ── procedural primitives ─────────────────────────────────────────────

    if (cmd === "block") {
      emitPrimitive("block", { x: parseFloat(tokens[1]), y: parseFloat(tokens[2]), z: parseFloat(tokens[3]) });
      continue;
    }

    if (cmd === "sphere") {
      emitPrimitive("sphere", { r: parseFloat(tokens[1]), d: parseFloat(tokens[2]) || 3 });
      continue;
    }

    if (cmd === "hemisphere") {
      emitPrimitive("hemisphere", { r: parseFloat(tokens[1]), d: parseFloat(tokens[2]) || 3 });
      continue;
    }

    if (cmd === "cylinder") {
      emitPrimitive("cylinder", { h: parseFloat(tokens[1]), r1: parseFloat(tokens[2]), r2: parseFloat(tokens[3]), n: parseFloat(tokens[4]) || 8 });
      continue;
    }

    if (cmd === "cone") {
      emitPrimitive("cone", { h: parseFloat(tokens[1]), r: parseFloat(tokens[2]), n: parseFloat(tokens[3]) || 8 });
      continue;
    }

    if (cmd === "disc") {
      emitPrimitive("disc", { v: parseFloat(tokens[1]), r: parseFloat(tokens[2]), n: parseFloat(tokens[3]) || 8 });
      continue;
    }

    // ── transforms ────────────────────────────────────────────────────────

    if (cmd === "identity") {
      currentXform = identityMat();
      continue;
    }

    if (cmd === "translate") {
      currentXform = translateMat(currentXform, parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
      continue;
    }

    if (cmd === "rotate") {
      currentXform = rotateMat(currentXform, parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4]));
      continue;
    }

    if (cmd === "scale") {
      currentXform = scaleMat(currentXform, parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
      continue;
    }

    if (cmd === "transform") {
      // 16 matrix elements follow in row-major order
      currentXform = tokens.slice(1, 17).map(Number);
      continue;
    }

    if (cmd === "transformbegin") {
      xformStack.push(cloneMat(currentXform));
      continue;
    }

    if (cmd === "transformend") {
      if (xformStack.length) currentXform = xformStack.pop();
      continue;
    }

    // ── materials ─────────────────────────────────────────────────────────

    if (cmd === "materialbegin") {
      matStack.push({ ...currentMat });
      continue;
    }

    if (cmd === "materialend") {
      if (matStack.length) currentMat = matStack.pop();
      continue;
    }

    if (cmd === "color") {
      currentMat.color = rgbToHex(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
      if (clump) clump.mat.color = currentMat.color;
      continue;
    }

    if (cmd === "surface") {
      currentMat.ambient  = parseFloat(tokens[1]);
      currentMat.diffuse  = parseFloat(tokens[2]);
      currentMat.specular = parseFloat(tokens[3]);
      if (clump) { clump.mat.ambient = currentMat.ambient; clump.mat.diffuse = currentMat.diffuse; clump.mat.specular = currentMat.specular; }
      continue;
    }

    if (cmd === "ambient") {
      currentMat.ambient = parseFloat(tokens[1]);
      if (clump) clump.mat.ambient = currentMat.ambient;
      continue;
    }

    if (cmd === "diffuse") {
      currentMat.diffuse = parseFloat(tokens[1]);
      if (clump) clump.mat.diffuse = currentMat.diffuse;
      continue;
    }

    if (cmd === "specular") {
      currentMat.specular = parseFloat(tokens[1]);
      if (clump) clump.mat.specular = currentMat.specular;
      continue;
    }

    if (cmd === "opacity") {
      currentMat.opacity = parseFloat(tokens[1]);
      if (clump) clump.mat.opacity = currentMat.opacity;
      continue;
    }

    if (cmd === "texture") {
      currentMat.texture = tokens[1] || null;
      if (clump) clump.mat.texture = currentMat.texture;
      continue;
    }

    if (cmd === "texturemode" || cmd === "texturemodes") {
      currentMat.textureMode = tokens[1]?.toLowerCase() || "lit";
      continue;
    }

    if (cmd === "materialmode" || cmd === "materialmodes") {
      currentMat.materialMode = tokens[1]?.toLowerCase() || "null";
      if (clump) clump.mat.materialMode = currentMat.materialMode;
      continue;
    }

    if (cmd === "tag") {
      currentMat.tag = parseInt(tokens[1]) || 0;
      if (clump) clump.mat.tag = currentMat.tag;
      continue;
    }

    // everything else (collision, lightsampling, geometrysampling, etc.) is
    // silently skipped — they don't affect Three.js rendering
  }

  // flush any unclosed top-level clumps
  while (clumpStack.length) popClump();
  if (clump) popClump();

  return objects;
}

// ─── CLI entry point  ────────────────────────────────────────────────────────
// node tools/parse_rwx.js <file.rwx>  → prints JSON to stdout

import { readFileSync } from "fs";
import { fileURLToPath } from "url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error("Usage: node tools/parse_rwx.js <file.rwx>"); process.exit(1); }
  const src  = readFileSync(file, "utf8");
  const objs = parseRWX(src);
  console.log(JSON.stringify(objs));
}
