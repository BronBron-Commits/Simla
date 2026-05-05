async function loadScene(){
  try {
    const res = await fetch("/api/scene?file=examples/simla3d_demo.sim");
    const json = await res.json();

    // 🔥 CRITICAL: convert Simla → actual scene
    const bytecode = compile(json.code);
    const sceneObjects = run(bytecode, {});

    if (!Array.isArray(sceneObjects)) {
      console.warn("Simla output:", sceneObjects);
      return;
    }

    console.log("Loaded objects:", sceneObjects.length);

    buildScene(sceneObjects);

  } catch (err) {
    console.warn("Scene load failed:", err);
  }
}
