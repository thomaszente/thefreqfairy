// The Frequency Fairy — walkable 3D fairy glade. Loaded on demand by index.html.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createTemple({ el, rooms, masterSVG, onEnter, reducedMotion }) {
  const W = () => el.clientWidth, H = () => el.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  el.prepend(renderer.domElement);
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("aria-label", "3D temple");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0718);
  scene.fog = new THREE.FogExp2(0x1a1030, 0.032);
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 200);

  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight(0xc9b6ff, 0x1a0f2a, 0.6));
  const moon = new THREE.DirectionalLight(0xcfe6ff, 0.6); moon.position.set(-10, 20, 8); scene.add(moon);
  const shrineLight = new THREE.PointLight(0xffc6ea, 24, 22, 1.6); shrineLight.position.set(0, 5, 0); scene.add(shrineLight);

  /* ---------- textures ---------- */
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const floorTex = canvasTex(1024, 1024, (g, w) => {
    g.fillStyle = "#14261f"; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `hsla(${130 + Math.random() * 40},40%,${14 + Math.random() * 14}%,.8)`; g.fillRect(Math.random() * w, Math.random() * w, 3, 6); }
    g.translate(w / 2, w / 2);
    for (let r = 60; r < 512; r += 52) { g.strokeStyle = `rgba(232,190,255,${r % 104 ? .35 : .7})`; g.lineWidth = r % 104 ? 2 : 4; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
    for (let i = 0; i < 32; i++) { g.rotate(Math.PI / 16); g.strokeStyle = "rgba(232,190,255,.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(60, 0); g.lineTo(512, 0); g.stroke(); }
    for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.fillStyle = "rgba(255,190,230,.6)"; g.beginPath(); g.ellipse(150, 0, 40, 12, 0, 0, 7); g.fill(); }
  });

  /* ---------- floor, sky ---------- */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(20, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .25 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const outer = new THREE.Mesh(new THREE.RingGeometry(20, 60, 64), new THREE.MeshStandardMaterial({ color: 0x0c1a12, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.01; scene.add(outer);
  const starG = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 1500; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.3 + .1, r = 90; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
  starG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const moonM = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16), new THREE.MeshBasicMaterial({ color: 0xf4ecff, fog: false })); moonM.position.set(-40, 38, -60); scene.add(moonM);
  scene.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: .35, fog: false })));

  /* ---------- materials ---------- */
  const gold = new THREE.MeshStandardMaterial({ color: 0xe8b4a2, metalness: .7, roughness: .3, emissive: 0x2a1020 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xe9ddd0, metalness: 0, roughness: .9 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x5fae8a, roughness: .7, side: THREE.DoubleSide });
  const vineM = new THREE.MeshStandardMaterial({ color: 0x2c6b45, roughness: .8 });
  const bloomM = new THREE.MeshStandardMaterial({ color: 0xf07fb6, emissive: 0x7a2a50, roughness: .5 });

  /* ---------- columns with vines ---------- */
  const R = 16, leafGeo = new THREE.PlaneGeometry(.35, .18), leaves = [];
  const vineCurve = (x, z, phase) => new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => new THREE.Vector3(x + Math.cos(i * .5 + phase) * .62, i * .2, z + Math.sin(i * .5 + phase) * .62)));
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
    const h = 5 + (i % 3) * 1.4, col = new THREE.Mesh(new THREE.CylinderGeometry(.42, .7, h, 24), stone); col.position.set(x, h / 2, z); scene.add(col);
    const capC = [0xff7fbf, 0xb98cff, 0x7fe0e8][i % 3], cap = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: capC, emissive: capC, emissiveIntensity: .35, roughness: .5 }));
    cap.scale.y = .62; cap.position.set(x, h - .1, z); scene.add(cap);
    for (let k = 0; k < 9; k++) { const sp = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff6ff })); const a2 = Math.random() * 6.283, r2 = Math.random() * 1.9; sp.position.set(x + Math.cos(a2) * r2, h - .1 + Math.sqrt(Math.max(0, 1 - (r2 / 2.4) ** 2)) * 2.4 * .62, z + Math.sin(a2) * r2); scene.add(sp); }
    const ml = new THREE.PointLight(capC, 5, 8, 1.8); ml.position.set(x, h - .6, z); scene.add(ml);
    const curve = vineCurve(x, z, i);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .05, 6), vineM));
    for (let k = 0; k < 34; k++) leaves.push({ p: curve.getPoint(k / 34), r: k, b: k % 7 === 3 });
  }
  const leafInst = new THREE.InstancedMesh(leafGeo, leafM, leaves.length), dummy = new THREE.Object3D();
  leaves.forEach((l, i) => { dummy.position.copy(l.p); dummy.rotation.set(Math.random(), l.r, Math.random()); dummy.updateMatrix(); leafInst.setMatrixAt(i, dummy.matrix); });
  scene.add(leafInst);
  leaves.filter(l => l.b).forEach(l => { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 8), bloomM); b.position.copy(l.p); scene.add(b); });
  // ring beam on top of the columns
  
  // hanging vines from the beam
  const bud = new THREE.InstancedMesh(new THREE.SphereGeometry(.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 380), cA = [0xff9fcf, 0xc9a7ff, 0x9fe3ec, 0xffffff];
  for (let i = 0; i < 380; i++) { const a = Math.random() * 6.283, r = 4.5 + Math.random() * 15; dummy.position.set(Math.cos(a) * r, .12 + Math.random() * .25, Math.sin(a) * r); dummy.scale.setScalar(.6 + Math.random()); dummy.updateMatrix(); bud.setMatrixAt(i, dummy.matrix); bud.setColorAt(i, new THREE.Color(cA[i % 4])); }
  scene.add(bud);

  /* ---------- central shrine + master ---------- */
  [[3.4, .3, 0], [2.6, .3, .3], [1.9, .3, .6]].forEach(([r, h, y]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + .1, h, 64), new THREE.MeshStandardMaterial({ color: y ? 0x3a2a5a : 0xe8b4a2, roughness: .6 })); m.position.y = y + h / 2; scene.add(m); });
  const crystM = new THREE.MeshStandardMaterial({ color: 0xe6d6ff, emissive: 0x8a5ad6, emissiveIntensity: .5, roughness: .15, metalness: .1, transparent: true, opacity: .85 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.22 + Math.random() * .2, 1 + Math.random() * 1.4, 6), crystM), a = i / 9 * 6.283; c.position.set(Math.cos(a) * 2.6, .9, Math.sin(a) * 2.6); c.rotation.set(Math.cos(a) * .3, 0, -Math.sin(a) * .3); scene.add(c); }
  const gongMesh = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (g) => { const r = g.createRadialGradient(220, 200, 10, 256, 256, 256); r.addColorStop(0, "#ffd6a0"); r.addColorStop(.5, "#d99a55"); r.addColorStop(.9, "#9a5d2a"); r.addColorStop(1, "#4a250a"); g.fillStyle = r; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(255,230,190,.35)"; for (let k = 60; k < 250; k += 22) { g.beginPath(); g.arc(256, 256, k, 0, 7); g.stroke(); } }), metalness: .45, roughness: .55, side: THREE.DoubleSide }));
  gongMesh.position.set(0, 5.6, -5.8); scene.add(gongMesh);
  const lotus = new THREE.Group();
  for (let i = 0; i < 12; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe98fb6 : 0xf3b6cf, roughness: .5, emissive: 0x3a1020 })); p.scale.set(.5, 1.3, 1); p.position.set(Math.cos(i / 12 * 6.283) * 1.2, .9, Math.sin(i / 12 * 6.283) * 1.2); p.lookAt(0, 3, 0); lotus.add(p); }
  scene.add(lotus);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.3, .04, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffd1ec }));
  halo.position.y = 4.6; scene.add(halo);
  const aura = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, "rgba(255,209,236,.85)"); r.addColorStop(.5, "rgba(201,167,255,.25)"); r.addColorStop(1, "rgba(201,167,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); }), transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.position.y = 3.6; scene.add(aura);
  const masterPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.48), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .05 }));
  masterPlane.position.y = 3.05; scene.add(masterPlane);
  if (masterSVG) {
    const img = new Image();
    img.onload = () => { const t = canvasTex(1200, 1280, (g) => g.drawImage(img, 0, 0, 1200, 1280)); masterPlane.material.map = t; masterPlane.material.needsUpdate = true; };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(masterSVG);
  }

  /* ---------- portals ---------- */
  const label = (txt, col) => canvasTex(512, 128, (g, w, h) => { g.fillStyle = "rgba(24,14,44,.78)"; g.beginPath(); g.roundRect(8, 20, w - 16, h - 40, 40); g.fill(); g.strokeStyle = col; g.lineWidth = 4; g.stroke(); g.fillStyle = "#ffe2d8"; g.font = "600 46px Cormorant Garamond, Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 2); });
  const swirl = col => canvasTex(256, 256, (g) => { const c = g.createConicGradient(0, 128, 128); [0, .2, .4, .6, .8, 1].forEach((s, i) => c.addColorStop(s, i % 2 ? "rgba(255,226,216,.9)" : col)); g.fillStyle = c; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(.25, "rgba(255,255,255,0)"); g.fillStyle = r; g.fill(); });
  const portals = rooms.map((rm, i) => {
    const a = (i + .5) / rooms.length * Math.PI * 2, x = Math.cos(a) * (R - .2), z = Math.sin(a) * (R - .2), grp = new THREE.Group();
    grp.position.set(x, 0, z); grp.lookAt(0, 0, 0);
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(1.75, .12, 10, 64), new THREE.MeshStandardMaterial({ color: 0x5fae8a, roughness: .7 })); ringM.position.y = 2.4; ringM.scale.y = 1.25; grp.add(ringM);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, f = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), new THREE.MeshStandardMaterial({ color: [0xff9fcf, 0xffffff, 0xc9a7ff][k % 3], emissive: [0xff4fa0, 0x888888, 0x7a4fd0][k % 3], emissiveIntensity: .6 })); f.position.set(Math.cos(a) * 1.75, 2.4 + Math.sin(a) * 1.75 * 1.25, .1); grp.add(f); }
    const tex = swirl(rm.color), disc = new THREE.Mesh(new THREE.CircleGeometry(1.32, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }));
    tex.center.set(.5, .5); disc.position.y = 2.4; disc.scale.y = 1.45; grp.add(disc);
    const lt = new THREE.PointLight(new THREE.Color(rm.color), 6, 7, 1.8); lt.position.set(0, 2.4, 1); grp.add(lt);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(rm.name, rm.color), transparent: true, depthWrite: false })); sprite.scale.set(4, 1, 1); sprite.position.y = 5.6; grp.add(sprite);
    scene.add(grp);
    return { ...rm, pos: new THREE.Vector3(Math.cos(a) * (R - 1.6), 0, Math.sin(a) * (R - 1.6)), tex, disc };
  });

  /* ---------- fireflies ---------- */
  const FN = reducedMotion ? 60 : 220, fg = new THREE.BufferGeometry(), fp = new Float32Array(FN * 3), fv = [];
  for (let i = 0; i < FN; i++) { const a = Math.random() * 6.283, r = Math.random() * 18; fp.set([Math.cos(a) * r, .4 + Math.random() * 7, Math.sin(a) * r], i * 3); fv.push(Math.random() * 6.283); }
  fg.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  const flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xffd1ec, size: .15, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(flies);

  /* ---------- avatar ---------- */
  const avatar = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.ConeGeometry(.62, 1.3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9b8ff, emissive: 0x5a2a8a, emissiveIntensity: .3, roughness: .5, side: THREE.DoubleSide })); robe.position.y = .72;
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x9fe3ec, emissiveIntensity: .5, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false });
  const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.bezierCurveTo(.4, .9, 1.2, 1.1, 1.1, .4); wingShape.bezierCurveTo(1.0, 0, .5, -.2, 0, 0);
  const sash = new THREE.Group(); [-1, 1].forEach(sd => { const w = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), wingMat); w.scale.set(sd, 1, 1); w.position.set(0, 1.15, -.18); w.rotation.y = sd * .5; sash.add(w); });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf6cdb8, roughness: .6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.24, 24, 16), skin); head.position.y = 1.6;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, .15, 10), skin); neck.position.y = 1.38;
  const glow = new THREE.PointLight(0xffd1ec, 3, 5, 2); glow.position.y = 1.8;
  const armM = new THREE.MeshStandardMaterial({ color: 0xf6cdb8, roughness: .6 }), arms = [-1, 1].map(sd => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(.08, .5, 4, 8), armM); a.position.set(sd * .36, .95, 0); a.rotation.z = sd * .18; return a; });
  avatar.add(robe, sash, neck, head, glow, ...arms);
  avatar.position.set(0, 0, 9); scene.add(avatar);

  /* ---------- input ---------- */
  const keys = {}; let yaw = Math.PI, pitch = .32, joy = { x: 0, y: 0 }, drag = null, near = null, running = false, raf = 0, last = performance.now();
  const kd = e => { if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return; keys[e.key.toLowerCase()] = true; if ((e.key === "e" || e.key === "E" || e.key === "Enter") && near) { e.preventDefault(); onEnter(near.id); } if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) e.preventDefault(); };
  const ku = e => { keys[e.key.toLowerCase()] = false; };
  addEventListener("keydown", kd); addEventListener("keyup", ku);
  const cv = renderer.domElement; cv.style.touchAction = "none";
  // tap or click the floor to walk there; drag to look around
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let target = null;
  const marker = new THREE.Mesh(new THREE.RingGeometry(.25, .38, 32), new THREE.MeshBasicMaterial({ color: 0xf6dc8f, transparent: true, opacity: .9, side: THREE.DoubleSide }));
  marker.rotation.x = -Math.PI / 2; marker.visible = false; scene.add(marker);
  cv.addEventListener("pointerdown", e => { try { cv.setPointerCapture(e.pointerId); } catch (x) {} drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; });
  cv.addEventListener("pointermove", e => { if (!drag || drag.id !== e.pointerId) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; yaw -= dx * .005; pitch = Math.max(.05, Math.min(1.1, pitch + dy * .004)); drag.x = e.clientX; drag.y = e.clientY; });
  cv.addEventListener("pointerup", e => {
    if (drag && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 10 && performance.now() - drag.t < 400) {
      const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(floor)[0];
      if (hit) { target = hit.point.clone(); target.y = 0; marker.position.set(target.x, .03, target.z); marker.visible = true; }
    }
    drag = null;
  });
  cv.addEventListener("pointercancel", () => { drag = null; });
  // on-screen joystick
  const pad = document.createElement("div"), knob = document.createElement("div");
  pad.className = "joy"; knob.className = "knob"; pad.appendChild(knob); pad.setAttribute("aria-label", "Walk joystick"); el.appendChild(pad);
  let jid = null;
  const jmove = e => { const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let x = (e.clientX - cx) / (r.width / 2), y = (e.clientY - cy) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } joy = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; target = null; marker.visible = false; };
  pad.addEventListener("pointerdown", e => { e.preventDefault(); jid = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) {} jmove(e); });
  pad.addEventListener("pointermove", e => { if (e.pointerId === jid) jmove(e); });
  const jend = () => { jid = null; joy = { x: 0, y: 0 }; knob.style.transform = ""; };
  pad.addEventListener("pointerup", jend); pad.addEventListener("pointercancel", jend);
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }); ro.observe(el);

  /* ---------- loop ---------- */
  const prompt = el.querySelector("[data-prompt]"), master = { id: "master", name: "the Frequency Fairy", pos: new THREE.Vector3(0, 0, 0) };
  const camPos = new THREE.Vector3(), tmp = new THREE.Vector3(); let walkT = 0;
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y, s = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + joy.x;
    if (keys.arrowleft || keys.q) yaw += 1.8 * dt; if (keys.arrowright) yaw -= 1.8 * dt;
    if (f || s) { target = null; marker.visible = false; }
    if (target) { const dx = target.x - avatar.position.x, dz = target.z - avatar.position.z, d = Math.hypot(dx, dz); if (d < .3) { target = null; marker.visible = false; } else { const fx = dx / d, fz = dz / d; f = fx * Math.sin(yaw) + fz * Math.cos(yaw); s = -(fx * Math.cos(yaw) - fz * Math.sin(yaw)); } }
    if (marker.visible) marker.scale.setScalar(1 + Math.sin(now / 150) * .12);
    const speed = keys.shift ? 7 : 4.2, mv = new THREE.Vector3(Math.sin(yaw) * f + Math.cos(yaw) * -s, 0, Math.cos(yaw) * f - Math.sin(yaw) * -s);
    if (mv.lengthSq() > .01) {
      mv.normalize().multiplyScalar(speed * dt); avatar.position.add(mv);
      const d = Math.hypot(avatar.position.x, avatar.position.z);
      if (d > R - 1.2) avatar.position.multiplyScalar((R - 1.2) / d);
      if (d < 3.9) { avatar.position.x *= 3.9 / d; avatar.position.z *= 3.9 / d; }
      avatar.rotation.y = Math.atan2(mv.x, mv.z); walkT += dt * 9;
    }
    avatar.position.y = .25 + Math.sin(now / 500) * .08;
    head.position.y = 1.6 + Math.sin(walkT * 2) * .01; sash.children.forEach((w, k) => { w.rotation.y = (k ? -1 : 1) * (.5 + Math.sin(now / 90) * .45); }); arms[0].rotation.x = Math.sin(walkT) * .5; arms[1].rotation.x = -Math.sin(walkT) * .5;
    // camera follows behind
    const dist = 6.5; camPos.set(avatar.position.x - Math.sin(yaw) * dist * Math.cos(pitch), 1.4 + Math.sin(pitch) * dist, avatar.position.z - Math.cos(yaw) * dist * Math.cos(pitch));
    { const cr = Math.hypot(camPos.x, camPos.z); if (cr > R - 1.4) { camPos.x *= (R - 1.4) / cr; camPos.z *= (R - 1.4) / cr; } }
    camera.position.lerp(camPos, 1 - Math.pow(.001, dt)); camera.lookAt(tmp.set(avatar.position.x, 1.5, avatar.position.z));
    // master always faces the visitor
    masterPlane.lookAt(camera.position.x, masterPlane.position.y, camera.position.z); aura.lookAt(camera.position.x, aura.position.y, camera.position.z);
    const t = now / 1000;
    if (!reducedMotion) {
      halo.rotation.z = t * .3; halo.position.y = 4.6 + Math.sin(t) * .08; masterPlane.position.y = 3.05 + Math.sin(t * .9) * .1;
      portals.forEach((p, i) => { p.tex.rotation = t * (.6 + i * .05); });
      const pa = fg.attributes.position.array; for (let i = 0; i < FN; i++) { fv[i] += dt; pa[i * 3 + 1] += Math.sin(fv[i] * 1.3) * .004; pa[i * 3] += Math.cos(fv[i]) * .004; } fg.attributes.position.needsUpdate = true;
      flies.material.opacity = .65 + Math.sin(t * 3) * .25; shrineLight.intensity = 22 + Math.sin(t * 2) * 4;
    }
    // proximity
    let best = null, bd = 2.6;
    for (const p of portals) { const d = p.pos.distanceTo(tmp.set(avatar.position.x, 0, avatar.position.z)); if (d < bd) { bd = d; best = p; } }
    if (!best && Math.hypot(avatar.position.x, avatar.position.z) < 5.2) best = master;
    if (best !== near) { near = best; if (prompt) { prompt.hidden = !near; if (near) prompt.querySelector("span").innerHTML = near.id === "master" ? "Hear <b>the Fairy</b>" : `Enter <b>${near.name}</b>`; } }
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(tick);
  }
  return {
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(raf); Object.keys(keys).forEach(k => keys[k] = false); },
    enterNear() { if (near) onEnter(near.id); },
    setMove(x, y) { joy = { x, y }; }
  };
}
