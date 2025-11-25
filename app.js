/* =========================== UTILITIES =========================== */

const $ = (id) => document.getElementById(id);

const notify = (msg, type = "success") => {
  const el = $("notification");
  el.textContent = msg;
  el.className = "notification " + type;
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => {
      el.className = "notification";
      el.textContent = "";
    }, 250);
  }, 2600);
};

/* =========================== THEME TOGGLE ======================== */

let isDark = true;
const themeBall = document.querySelector(".theme-toggle-ball");
$("btnThemeToggle").addEventListener("click", () => {
  isDark = !isDark;
  document.body.classList.toggle("theme-light", !isDark);
});

/* =========================== TAB SWITCHING ======================= */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    if (!tab) return;
    const parentTabs = btn.parentElement;
    parentTabs.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");

    const panelBody = parentTabs.parentElement.parentElement; // panel-body -> panel
    panelBody.querySelectorAll(".tab-panel").forEach((p) =>
      p.classList.remove("active")
    );
    const panel = document.getElementById(tab);
    if (panel) panel.classList.add("active");
  });
});

/* =========================== SHAPE META ========================== */

const shapeType = $("shapeType");
const shapeThumbMini = $("shapeThumbMini");
const shapeThumbTitle = $("shapeThumbTitle");
const shapeThumbDesc = $("shapeThumbDesc");

const SHAPE_META = {
  "flat-rect": {
    icon: "▭",
    title: "Flat rectangle",
    desc: "Standard panel for frames, photos and night lights."
  },
  cylinder: {
    icon: "◔",
    title: "Cylinder wrap",
    desc: "Full cylindrical wrap. Great for lamp sleeves and vases."
  },
  "arc-cylinder": {
    icon: "∩",
    title: "Arc cylinder",
    desc: "Curved arc with adjustable angle. Perfect for stand-up arcs."
  },
  dome: {
    icon: "◠",
    title: "Sphere / dome",
    desc: "Spherical mapping for deep, immersive lithophanes."
  },
  "box-lamp": {
    icon: "⬢",
    title: "Box lamp",
    desc: "Four panels around a box for lamp shades."
  },
  heart: {
    icon: "♥",
    title: "Heart",
    desc: "Heart-shaped front with correct curvature."
  },
  "custom-curve": {
    icon: "∿",
    title: "Custom curve",
    desc: "User controlled curvature (similar to 3dp.rocks)."
  },
  "stand-arc": {
    icon: "⋃",
    title: "Stand-up arc",
    desc: "Flat base with only the litho arc curved."
  },
  wave: {
    icon: "≈",
    title: "Wave panel",
    desc: "Sinusoidal wave surface for a sculpted look."
  }
};

function updateShapeThumb() {
  const meta = SHAPE_META[shapeType.value];
  if (!meta) return;
  shapeThumbMini.textContent = meta.icon;
  shapeThumbTitle.textContent = meta.title;
  shapeThumbDesc.textContent = meta.desc;
}
shapeType.addEventListener("change", updateShapeThumb);
updateShapeThumb();

/* =========================== IMAGE / HEIGHTMAP =================== */

const imgInput = $("imgInput");
const btnCrop = $("btnCrop");
const btnAuto = $("btnAuto");
const btnReload = $("btnReload");
const btnPreview = $("btnPreview");
const chipImageState = $("chipImageState");

const mmW = $("mmW");
const mmH = $("mmH");
const ppm = $("ppm");
const tMin = $("tMin");
const tMax = $("tMax");
const gammaInput = $("gamma");
const blurRadius = $("blurRadius");
const invert = $("invert");
const flipY = $("flipY");

// multi-litho
const btnNewLitho = $("btnNewLitho");
const btnClearScene = $("btnClearScene");
const btnUnionAll = $("btnUnionAll");

let originalImageFile = null;
let srcImage = null;
let cropDataURL = null;
let lastHeightData = null;

imgInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  loadImageFile(file);
});

// drag & drop
["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => {
  document.addEventListener(
    ev,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    false
  );
});
document.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (!dt || !dt.files || !dt.files[0]) return;
  const f = dt.files[0];
  if (!f.type.startsWith("image/")) {
    notify("Drop an image file", "error");
    return;
  }
  loadImageFile(f);
});

function loadImageFile(file) {
  originalImageFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    srcImage = img;
    cropDataURL = img.src;
    btnCrop.disabled = false;
    btnAuto.disabled = false;
    btnReload.disabled = false;
    chipImageState.textContent = `Loaded ${img.naturalWidth}×${img.naturalHeight}`;
    chipImageState.style.color = "#2ecc71";

    const ar = img.naturalHeight / img.naturalWidth || 0.75;
    const wmm = parseFloat(mmW.value) || 120;
    mmH.value = (wmm * ar).toFixed(1);
    notify("Image loaded", "info");
  };
  img.onerror = () => notify("Failed to load image", "error");
  img.src = url;
}

btnReload.addEventListener("click", () => {
  if (!originalImageFile) {
    notify("No image to reload", "error");
    return;
  }
  loadImageFile(originalImageFile);
});

/* ===== simple cropper (center crop with aspect) to keep size down ==== */

btnCrop.addEventListener("click", () => {
  if (!srcImage) {
    notify("Load an image first", "error");
    return;
  }
  // simple center crop to maintain aspect of mmW:mmH
  const Wmm = parseFloat(mmW.value) || 120;
  const Hmm = parseFloat(mmH.value) || 90;
  const aspect = Wmm / Hmm;

  const w = srcImage.naturalWidth;
  const h = srcImage.naturalHeight;
  let cw = w;
  let ch = Math.round(w / aspect);
  if (ch > h) {
    ch = h;
    cw = Math.round(h * aspect);
  }
  const cx = Math.round((w - cw) / 2);
  const cy = Math.round((h - ch) / 2);

  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d");
  ctx.drawImage(srcImage, cx, cy, cw, ch, 0, 0, cw, ch);
  cropDataURL = c.toDataURL("image/png", 1.0);

  chipImageState.textContent = `Cropped ${cw}×${ch}`;
  chipImageState.style.color = "#2ecc71";
  notify("Center crop applied", "success");
});

btnAuto.addEventListener("click", () => {
  const srcURL = cropDataURL || (srcImage && srcImage.src);
  if (!srcURL) {
    notify("Load an image first", "error");
    return;
  }
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const pixels = data.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const v =
        0.299 * pixels[i] +
        0.587 * pixels[i + 1] +
        0.114 * pixels[i + 2];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;
    for (let i = 0; i < pixels.length; i += 4) {
      const nr = ((pixels[i] - min) / range) * 255;
      const ng = ((pixels[i + 1] - min) / range) * 255;
      const nb = ((pixels[i + 2] - min) / range) * 255;
      pixels[i] = Math.max(0, Math.min(255, nr));
      pixels[i + 1] = Math.max(0, Math.min(255, ng));
      pixels[i + 2] = Math.max(0, Math.min(255, nb));
    }
    ctx.putImageData(data, 0, 0);
    cropDataURL = c.toDataURL("image/png", 1.0);
    chipImageState.textContent = `Enhanced ${c.width}×${c.height}`;
    chipImageState.style.color = "#27ae60";
    notify("Auto enhance applied", "success");
  };
  img.src = srcURL;
});

/* ========== HEIGHTMAP GENERATION (with blur + gamma etc) ========== */

function blurHeightmap(values, w, h, radius) {
  if (!radius || radius <= 0) return values;
  const r = Math.floor(radius);
  const tmp = new Float32Array(values.length);
  const out = new Float32Array(values.length);

  // horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let cnt = 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w) {
          sum += values[y * w + xx];
          cnt++;
        }
      }
      tmp[y * w + x] = sum / cnt;
    }
  }
  // vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let cnt = 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h) {
          sum += tmp[yy * w + x];
          cnt++;
        }
      }
      out[y * w + x] = sum / cnt;
    }
  }
  return out;
}

function buildHeightmapFromImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const Wmm = parseFloat(mmW.value) || 120;
      const Hmm = parseFloat(mmH.value) || 90;
      const PPM = Math.max(1, parseFloat(ppm.value) || 2);

      const pxW = Math.floor(Wmm * PPM);
      const pxH = Math.floor(Hmm * PPM);

      const c = document.createElement("canvas");
      c.width = pxW;
      c.height = pxH;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, pxW, pxH);
      const rgba = ctx.getImageData(0, 0, pxW, pxH).data;

      const gammaVal = parseFloat(gammaInput.value) || 1;
      const invertFlag = invert.checked;
      const flipFlag = flipY.checked;

      const g = new Float32Array(pxW * pxH);
      for (let iy = 0; iy < pxH; iy++) {
        const sy = flipFlag ? pxH - 1 - iy : iy;
        for (let ix = 0; ix < pxW; ix++) {
          const sx = ix;
          const srcIndex = (sy * pxW + sx) * 4;
          let v =
            0.2126 * rgba[srcIndex] +
            0.7152 * rgba[srcIndex + 1] +
            0.0722 * rgba[srcIndex + 2];
          v /= 255;
          v = Math.pow(v, gammaVal);
          if (invertFlag) v = 1 - v;
          g[iy * pxW + ix] = v;
        }
      }
      // normalize
      let minV = 1;
      let maxV = 0;
      for (let i = 0; i < g.length; i++) {
        if (g[i] < minV) minV = g[i];
        if (g[i] > maxV) maxV = g[i];
      }
      const span = Math.max(1e-6, maxV - minV);
      for (let i = 0; i < g.length; i++) {
        g[i] = (g[i] - minV) / span;
      }

      const blurR = parseInt(blurRadius.value) || 0;
      const blurred = blurHeightmap(g, pxW, pxH, blurR);

      lastHeightData = { width: pxW, height: pxH, values: Array.from(blurred) };

      resolve({
        width: pxW,
        height: pxH,
        values: blurred,
        Wmm,
        Hmm
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* =========================== THREE.JS SETUP ======================= */

const canvas3d = $("canvas3d");

const renderer = new THREE.WebGLRenderer({
  canvas: canvas3d,
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setClearColor(0x05070b, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070b);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
camera.position.set(0, 140, 280);

const orbit = new THREE.OrbitControls(camera, canvas3d);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 70, 0);

const transform = new THREE.TransformControls(camera, renderer.domElement);
transform.addEventListener("dragging-changed", (e) => {
  orbit.enabled = !e.value;
});
scene.add(transform);

// lights
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(260, 320, 220);
dir.castShadow = true;
dir.shadow.bias = -0.0001;
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);

const backlightMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide
});
const backlightPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  backlightMat
);
backlightPlane.position.set(0, 200, -400);
scene.add(backlightPlane);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshPhongMaterial({ color: 0x050608, shininess: 6 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(600, 30, 0x333333, 0x555555);
grid.position.y = 0.001;
scene.add(grid);

// container for ALL lithophanes
const lithoGroup = new THREE.Group();
scene.add(lithoGroup);

// support simple FPS + resize
const previewPanel = $("preview");
const fpsLabel = $("fpsLabel");
const overlayInfo = $("overlayInfo");
const previewStatus = $("previewStatus");

function resizeRenderer() {
  const rect = previewPanel.getBoundingClientRect();
  const header = $("preview-header").getBoundingClientRect();
  const h = Math.max(160, rect.height - header.height);
  renderer.setSize(rect.width, h);
  camera.aspect = rect.width / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resizeRenderer);
resizeRenderer();

let spinEnabled = false;
$("toolSpin").addEventListener("click", () => {
  spinEnabled = !spinEnabled;
  $("toolSpin").classList.toggle("active", spinEnabled);
});

// camera presets
function setCamPreset(kind) {
  const box = new THREE.Box3().setFromObject(lithoGroup);
  if (box.isEmpty()) {
    camera.position.set(0, 140, 280);
    orbit.target.set(0, 70, 0);
    orbit.update();
    return;
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) || 150;

  if (kind === "front") {
    camera.position.set(0, radius * 0.6, radius * 1.7);
  } else if (kind === "top") {
    camera.position.set(0, radius * 1.8, 1);
  } else {
    camera.position.set(radius * 1.2, radius * 0.8, radius * 1.3);
  }
  orbit.target.copy(center);
  orbit.update();
}

document.querySelectorAll(".cam-preset").forEach((b) => {
  const mode = b.dataset.cam;
  if (!mode) return;
  b.addEventListener("click", () => setCamPreset(mode));
});

$("btnResetCamera").addEventListener("click", () => {
  setCamPreset("iso");
});

let lastTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  if (spinEnabled && lithoGroup.children.length) {
    lithoGroup.rotation.y += 0.005;
  }
  orbit.update();
  renderer.render(scene, camera);

  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1000) {
    fpsLabel.textContent = Math.round(
      (frameCount * 1000) / fpsTimer
    ).toString();
    fpsTimer = 0;
    frameCount = 0;
  }
}
animate();

/* =========================== MATERIALS =========================== */

const materialPreset = $("materialPreset");
let currentMaterialPreset = materialPreset.value;

function makeMaterial(key) {
  currentMaterialPreset = key;
  switch (key) {
    case "pla-translucent":
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0,
        transmission: 0.8,
        thickness: 2,
        clearcoat: 0.2
      });
    case "resin":
      return new THREE.MeshPhysicalMaterial({
        color: 0xf5f5ff,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.5,
        thickness: 3,
        clearcoat: 0.4
      });
    case "glow":
      return new THREE.MeshStandardMaterial({
        color: 0xffffc0,
        emissive: 0x999900,
        emissiveIntensity: 0.6,
        roughness: 0.45,
        metalness: 0.05
      });
    case "pla-white":
    default:
      return new THREE.MeshStandardMaterial({
        color: 0xfff8e8,
        roughness: 0.55,
        metalness: 0.05
      });
  }
}
materialPreset.addEventListener("change", () => {
  currentMaterialPreset = materialPreset.value;
  lithoGroup.children.forEach((c) => {
    if (c.isMesh) {
      const mat = makeMaterial(currentMaterialPreset);
      c.material.dispose();
      c.material = mat;
    }
  });
});

/* =========================== GEOMETRY HELPERS ==================== */

const radiusInput = $("radius");
const arcAngleInput = $("arcAngle");
const waveAmpInput = $("waveAmp");
const bWidth = $("bWidth");
const bHeight = $("bHeight");
const curveStrength = $("curveStrength");

function buildBasePanel(heightmap, Wmm, Hmm, tMinV, tMaxV) {
  const { width: pxW, height: pxH, values } = heightmap;
  const geo = new THREE.PlaneGeometry(Wmm, Hmm, pxW - 1, pxH - 1);
  const pos = geo.attributes.position;
  const depth = tMaxV - tMinV;
  for (let iy = 0; iy < pxH; iy++) {
    for (let ix = 0; ix < pxW; ix++) {
      const idx = iy * pxW + ix;
      const h = values[idx];
      const z = (1 - h) * depth + tMinV;
      pos.setZ(idx, z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function addFlatBorder(geometry, Wmm, Hmm, BW, BH) {
  if (BW <= 0 || BH <= 0) return geometry;
  const outerW = Wmm + 2 * BW;
  const outerH = Hmm + 2 * BW;

  const shape = new THREE.Shape();
  shape.moveTo(-outerW / 2, -outerH / 2);
  shape.lineTo(outerW / 2, -outerH / 2);
  shape.lineTo(outerW / 2, outerH / 2);
  shape.lineTo(-outerW / 2, outerH / 2);
  shape.lineTo(-outerW / 2, -outerH / 2);

  const hole = new THREE.Path();
  hole.moveTo(-Wmm / 2, -Hmm / 2);
  hole.lineTo(Wmm / 2, -Hmm / 2);
  hole.lineTo(Wmm / 2, Hmm / 2);
  hole.lineTo(-Wmm / 2, Hmm / 2);
  hole.lineTo(-Wmm / 2, -Hmm / 2);
  shape.holes.push(hole);

  const extrude = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: BH,
    bevelEnabled: false
  });
  extrude.translate(0, 0, -0.001);

  const mg = THREE.BufferGeometryUtils.mergeBufferGeometries(
    [geometry.toNonIndexed(), extrude.toNonIndexed()],
    false
  );
  return mg;
}

function applyCylinderWrap(geometry, radius, arcFraction) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const size = box.getSize(new THREE.Vector3());
  const width = size.x;
  const totalArc = 2 * Math.PI * arcFraction;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const u = (v.x - box.min.x) / width; // 0..1
    const angle = totalArc * (u - 0.5); // center front
    const r = radius + v.z;
    const nx = Math.sin(angle) * r;
    const nz = Math.cos(angle) * r - radius;
    pos.setXYZ(i, nx, v.y, nz);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function applyWave(geometry, amplitude) {
  if (!amplitude || amplitude === 0) return geometry;
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const size = box.getSize(new THREE.Vector3());
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const u = (v.x - box.min.x) / size.x;
    const wave = Math.sin(u * Math.PI * 2) * amplitude;
    pos.setZ(i, v.z + wave);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function applyCustomCurve(geometry, strength) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const width = box.getSize(new THREE.Vector3()).x;
  const k = strength;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const u = (v.x - box.min.x) / width - 0.5; // -0.5..0.5
    const offset = (Math.pow(Math.abs(u) * 2, k) - 1) * -width * 0.04;
    pos.setZ(i, v.z + offset);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function buildDomeGeometry(heightmap, Wmm, Hmm, tMinV, tMaxV) {
  const { width: pxW, height: pxH, values } = heightmap;
  const radius = Math.max(Wmm, Hmm) / 1.8;
  const depth = tMaxV - tMinV;

  const verts = [];
  const indices = [];

  for (let y = 0; y < pxH; y++) {
    for (let x = 0; x < pxW; x++) {
      const u = x / (pxW - 1) - 0.5;
      const v = y / (pxH - 1) - 0.5;
      const pxPos = u * Wmm;
      const pyPos = v * Hmm;
      const r = Math.sqrt(pxPos * pxPos + pyPos * pyPos);
      const maxR = Math.max(Wmm, Hmm) / 2;
      const t = Math.min(1, r / maxR);
      const theta = t * (Math.PI / 2);
      const domeR = radius;
      const dz = Math.cos(theta) * domeR;
      const scale = r === 0 ? 0 : (Math.sin(theta) * domeR) / r;
      const dx = pxPos * scale;
      const dy = pyPos * scale;

      const h = values[y * pxW + x];
      const thickness = (1 - h) * depth + tMinV;

      verts.push(dx, dy, dz + thickness);
    }
  }

  for (let y = 0; y < pxH - 1; y++) {
    for (let x = 0; x < pxW - 1; x++) {
      const i0 = y * pxW + x;
      const i1 = i0 + 1;
      const i2 = i0 + pxW;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(verts, 3)
  );
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildHeartGeometry(panelGeo, Wmm, Hmm) {
  // mask a heart shape by pushing corners back
  const pos = panelGeo.attributes.position;
  const v = new THREE.Vector3();
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const sx = (box.max.x - box.min.x) / 2;
  const sy = (box.max.y - box.min.y) / 2;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const x = (v.x - cx) / sx;
    const y = (v.y - cy) / sy;
    const val = Math.pow(x * x + y * y - 0.3, 3) - x * x * y * y * y;
    if (val > 0) {
      // outside heart, push slightly back to avoid sharp cutoff
      const z = v.z - 2;
      pos.setZ(i, z);
    }
  }
  pos.needsUpdate = true;
  panelGeo.computeVertexNormals();
  return panelGeo;
}

function buildBoxLampGeometry(panelGeo, Wmm, Hmm, tMinV) {
  const base = panelGeo.toNonIndexed();
  const box = new THREE.Box3().setFromBufferAttribute(
    base.attributes.position
  );
  const center = box.getCenter(new THREE.Vector3());
  base.translate(-center.x, -center.y, -center.z);

  const depth = tMinV * 0.7 + 0.8;
  const geos = [];

  const front = base.clone();
  front.translate(0, 0, depth);
  geos.push(front);

  const right = base.clone();
  right.rotateY(-Math.PI / 2);
  right.translate(depth, 0, 0);
  geos.push(right);

  const back = base.clone();
  back.rotateY(Math.PI);
  back.translate(0, 0, -depth);
  geos.push(back);

  const left = base.clone();
  left.rotateY(Math.PI / 2);
  left.translate(-depth, 0, 0);
  geos.push(left);

  return THREE.BufferGeometryUtils.mergeBufferGeometries(geos, false);
}

/* =========================== BUILD LITHOPHANE ===================== */

const chipMeshState = $("chipMeshState");
const mTris = $("mTris");
const mVol = $("mVol");
const mMass = $("mMass");
const mDensity = $("mDensity");

async function buildLithophaneMesh() {
  const srcURL = cropDataURL || (srcImage && srcImage.src);
  if (!srcURL) throw new Error("No image");

  const map = await buildHeightmapFromImage(srcURL);

  let tMinV = Math.max(0.1, parseFloat(tMin.value) || 0.8);
  let tMaxVraw = parseFloat(tMax.value) || 3.2;
  let tMaxV = Math.max(tMinV + 0.2, tMaxVraw);
  tMax.value = tMaxV.toFixed(1);

  const heightmap = {
    width: map.width,
    height: map.height,
    values: map.values
  };

  let geo = buildBasePanel(heightmap, map.Wmm, map.Hmm, tMinV, tMaxV);

  const BW = parseFloat(bWidth.value) || 0;
  const BH = parseFloat(bHeight.value) || 0;
  if (BW > 0 && BH > 0) {
    geo = addFlatBorder(geo, map.Wmm, map.Hmm, BW, BH);
  }

  const shape = shapeType.value;
  const radiusVal = Math.max(1, parseFloat(radiusInput.value) || 60);
  const angleDeg = parseFloat(arcAngleInput.value) || 180;
  const waveAmp = parseFloat(waveAmpInput.value) || 0;
  const curveK = parseFloat(curveStrength.value) || 1.5;

  // IMPORTANT: wrap AFTER border so border follows curve
  if (shape === "cylinder") {
    applyCylinderWrap(geo, radiusVal, 1.0);
  } else if (shape === "arc-cylinder") {
    const fraction = Math.max(0.1, Math.min(1, angleDeg / 360));
    applyCylinderWrap(geo, radiusVal, fraction);
  } else if (shape === "stand-arc") {
    const fraction = Math.max(0.2, Math.min(0.8, angleDeg / 360));
    applyCylinderWrap(geo, radiusVal, fraction);
    // drop bottom to floor
  } else if (shape === "wave") {
    applyWave(geo, waveAmp);
  } else if (shape === "custom-curve") {
    applyCustomCurve(geo, curveK);
  } else if (shape === "heart") {
    buildHeartGeometry(geo, map.Wmm, map.Hmm);
  } else if (shape === "dome") {
    geo = buildDomeGeometry(heightmap, map.Wmm, map.Hmm, tMinV, tMaxV);
  }

  if (shape === "box-lamp") {
    geo = buildBoxLampGeometry(geo, map.Wmm, map.Hmm, tMinV);
  }

  const mat = makeMaterial(currentMaterialPreset);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  const box = new THREE.Box3().setFromObject(mesh);
  mesh.position.y -= box.min.y;

  // metrics
  const size = box.getSize(new THREE.Vector3());
  const volume = (size.x * size.y * size.z) / 1000; // mm³ -> cm³ approx
  mVol.textContent = volume.toFixed(2);
  mMass.textContent = (volume * 1.24).toFixed(2);
  const tris = mesh.geometry.attributes.position.count / 3;
  mTris.textContent = Math.round(tris).toLocaleString();
  mDensity.textContent = `${(tris / (size.x * size.y || 1)).toFixed(
    1
  )} tris/mm²`;

  overlayInfo.textContent = `W ${map.Wmm.toFixed(1)} mm × H ${map.Hmm.toFixed(
    1
  )} mm`;

  return mesh;
}

/* =========================== HISTORY / TIMELINE =================== */

const timelineEl = $("timeline");
let history = [];
let redoStack = [];
let timelineIndex = -1;

function pushHistory(obj, label) {
  if (!obj) return;
  const entry = {
    matrix: obj.matrix.clone(),
    label,
    time: new Date()
  };
  history.push(entry);
  if (history.length > 80) history.shift();
  timelineIndex = history.length - 1;
  redoStack = [];
  renderTimeline();
}

function renderTimeline() {
  timelineEl.innerHTML = "";
  history.forEach((h, i) => {
    const div = document.createElement("div");
    div.className = "timeline-item" + (i === timelineIndex ? " active" : "");
    const dot = document.createElement("span");
    dot.className = "dot";
    const label = document.createElement("span");
    const t = h.time;
    label.textContent = `${i.toString().padStart(2, "0")} • ${t
      .getHours()
      .toString()
      .padStart(2, "0")}:${t
      .getMinutes()
      .toString()
      .padStart(2, "0")} • ${h.label}`;
    div.appendChild(dot);
    div.appendChild(label);
    div.addEventListener("click", () => {
      const obj = transform.object;
      if (!obj) return;
      obj.matrix.copy(h.matrix);
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
      timelineIndex = i;
      renderTimeline();
    });
    timelineEl.appendChild(div);
  });
}

/* =========================== INTERACTION ========================== */

// CAD toolbar
function setActiveTool(btn) {
  ["toolSelect", "toolTranslate", "toolRotate", "toolScale"].forEach((id) =>
    $(id).classList.remove("active")
  );
  btn.classList.add("active");
}
$("toolTranslate").addEventListener("click", () => {
  transform.setMode("translate");
  setActiveTool($("toolTranslate"));
});
$("toolRotate").addEventListener("click", () => {
  transform.setMode("rotate");
  setActiveTool($("toolRotate"));
});
$("toolScale").addEventListener("click", () => {
  transform.setMode("scale");
  setActiveTool($("toolScale"));
});
$("toolSelect").addEventListener("click", () => {
  transform.setMode("translate");
  setActiveTool($("toolSelect"));
});

// raycast select
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas3d.addEventListener("pointerdown", (e) => {
  const rect = canvas3d.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(lithoGroup.children, true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj.parent && obj.parent !== lithoGroup) {
    obj = obj.parent;
  }
  transform.attach(obj);
  pushHistory(obj, "Select");
});

// keyboard
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "w") {
    transform.setMode("translate");
    setActiveTool($("toolTranslate"));
  }
  if (e.key.toLowerCase() === "e") {
    transform.setMode("scale");
    setActiveTool($("toolScale"));
  }
  if (e.key.toLowerCase() === "r") {
    transform.setMode("rotate");
    setActiveTool($("toolRotate"));
  }
  const obj = transform.object;
  if (!obj) return;

  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    if (history.length > 1) {
      const last = history.pop();
      redoStack.push(last);
      const prev = history[history.length - 1];
      obj.matrix.copy(prev.matrix);
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
      timelineIndex = history.length - 1;
      renderTimeline();
    }
  }
  if (e.ctrlKey && e.key.toLowerCase() === "y") {
    if (redoStack.length) {
      const entry = redoStack.pop();
      history.push(entry);
      obj.matrix.copy(entry.matrix);
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
      timelineIndex = history.length - 1;
      renderTimeline();
    }
  }
  if (e.key.toLowerCase() === "d") {
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.y -= box.min.y;
    obj.updateMatrixWorld(true);
    pushHistory(obj, "Drop to floor");
    notify("Dropped to floor", "info");
  }
});

/* =========================== PREVIEW / ADD LITHO ================== */

const btnExport = $("btnExport");
const btnHeightmap = $("btnHeightmap");

btnPreview.addEventListener("click", async () => {
  try {
    const srcURL = cropDataURL || (srcImage && srcImage.src);
    if (!srcURL) {
      notify("Select an image first", "error");
      return;
    }
    previewStatus.textContent = "Building preview…";
    chipMeshState.textContent = "Building…";
    chipMeshState.style.color = "#f1c40f";

    const mesh = await buildLithophaneMesh();
    // Replace selected lithophane or add if none selected
    const selected = transform.object;
    if (selected && lithoGroup.children.includes(selected)) {
      const idx = lithoGroup.children.indexOf(selected);
      lithoGroup.remove(selected);
      selected.geometry.dispose();
      selected.material.dispose();
      lithoGroup.children.splice(idx, 0, mesh);
    } else {
      lithoGroup.add(mesh);
    }
    transform.attach(mesh);
    pushHistory(mesh, "Preview");

    chipMeshState.textContent = "Preview ready";
    chipMeshState.style.color = "#2ecc71";
    previewStatus.textContent = "Preview ready";
    btnExport.disabled = false;
    btnHeightmap.disabled = false;

    setCamPreset("iso");
    notify("Preview ready (scene mode)", "success");
  } catch (err) {
    console.error(err);
    notify("Preview failed", "error");
    previewStatus.textContent = "Error";
    chipMeshState.textContent = "Error";
    chipMeshState.style.color = "#e74c3c";
  }
});

// explicit new litho
btnNewLitho.addEventListener("click", async () => {
  try {
    const srcURL = cropDataURL || (srcImage && srcImage.src);
    if (!srcURL) {
      notify("Select an image first", "error");
      return;
    }
    previewStatus.textContent = "Building lithophane…";
    const mesh = await buildLithophaneMesh();
    lithoGroup.add(mesh);
    transform.attach(mesh);
    pushHistory(mesh, "Add lithophane");
    chipMeshState.textContent = "Scene updated";
    chipMeshState.style.color = "#2ecc71";
    previewStatus.textContent = "Scene updated";
    btnExport.disabled = false;
    btnHeightmap.disabled = false;
    setCamPreset("iso");
    notify("Lithophane added to scene", "success");
  } catch (err) {
    console.error(err);
    notify("Failed to add", "error");
  }
});

btnClearScene.addEventListener("click", () => {
  while (lithoGroup.children.length) {
    const c = lithoGroup.children.pop();
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  }
  transform.detach();
  history = [];
  redoStack = [];
  timelineIndex = -1;
  renderTimeline();
  chipMeshState.textContent = "No mesh";
  chipMeshState.style.color = "";
  previewStatus.textContent = "Idle";
  mTris.textContent = "0";
  mVol.textContent = "0.00";
  mMass.textContent = "0.00";
  mDensity.textContent = "–";
  overlayInfo.textContent = "No mesh";
  notify("Scene cleared", "info");
});

btnUnionAll.addEventListener("click", () => {
  const meshes = lithoGroup.children.filter((c) => c.isMesh);
  if (meshes.length < 2) {
    notify("Need at least two lithophanes to union", "error");
    return;
  }
  const geos = meshes.map((m) => m.geometry.toNonIndexed());
  const mergedGeo =
    THREE.BufferGeometryUtils.mergeBufferGeometries(geos, false);

  const baseMat = makeMaterial(currentMaterialPreset);
  const mergedMesh = new THREE.Mesh(mergedGeo, baseMat);
  mergedMesh.castShadow = true;

  // remove old
  meshes.forEach((m) => {
    lithoGroup.remove(m);
    m.geometry.dispose();
    m.material.dispose();
  });
  lithoGroup.add(mergedMesh);
  transform.attach(mergedMesh);
  pushHistory(mergedMesh, "Union all");

  chipMeshState.textContent = "Union mesh";
  chipMeshState.style.color = "#2ecc71";
  previewStatus.textContent = "Union ready";
  notify("All lithophanes merged into one STL-safe mesh", "success");
});

/* =========================== EXPORTS ============================== */

btnExport.addEventListener("click", () => {
  const exporter = new THREE.STLExporter();
  const stl = exporter.parse(lithoGroup);
  const blob = new Blob([stl], { type: "application/sla" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `litho_scene_${Date.now()}.stl`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  notify("STL downloaded (scene union)", "success");
});

btnHeightmap.addEventListener("click", () => {
  if (!lastHeightData) {
    notify("Generate a preview first", "error");
    return;
  }
  const { width, height, values } = lastHeightData;
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  for (let i = 0; i < values.length; i++) {
    const gray = Math.max(0, Math.min(255, Math.round((1 - values[i]) * 255)));
    const p = i * 4;
    data[p] = gray;
    data[p + 1] = gray;
    data[p + 2] = gray;
    data[p + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  c.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `litho_heightmap_${Date.now()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "image/png");
  notify("Heightmap PNG downloaded", "success");
});

// screenshot
$("toolScreenshot").addEventListener("click", () => {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `litho_preview_${Date.now()}.png`;
  a.click();
  notify("Preview screenshot downloaded", "success");
});

// drop-to-floor button
$("btnDropToFloor").addEventListener("click", () => {
  const obj = transform.object;
  if (!obj) {
    notify("No object selected", "error");
    return;
  }
  const box = new THREE.Box3().setFromObject(obj);
  obj.position.y -= box.min.y;
  obj.updateMatrixWorld(true);
  pushHistory(obj, "Drop to floor");
  notify("Dropped to floor", "success");
});

// center scene
$("btnCenterScene").addEventListener("click", () => {
  const box = new THREE.Box3().setFromObject(lithoGroup);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  lithoGroup.position.sub(center);
  pushHistory(transform.object || null, "Center scene");
  notify("Scene recentered", "success");
});

// lights
$("keyLightIntensity").addEventListener("input", (e) => {
  dir.intensity = parseFloat(e.target.value);
});
$("ambientIntensity").addEventListener("input", (e) => {
  ambient.intensity = parseFloat(e.target.value);
});
$("backlightIntensity").addEventListener("input", (e) => {
  const s = parseFloat(e.target.value);
  backlightMat.color.set($("backlightColor").value);
  backlightMat.color.multiplyScalar(s);
});
$("backlightColor").addEventListener("input", (e) => {
  backlightMat.color.set(e.target.value);
  backlightMat.color.multiplyScalar(
    parseFloat($("backlightIntensity").value)
  );
});
$("shadowMode").addEventListener("change", (e) => {
  const on = e.target.checked;
  dir.castShadow = on;
  floor.receiveShadow = on;
  notify(on ? "Shadow mode on" : "Shadow mode off", "info");
});

// fullscreen toggle
$("btnFullscreen").addEventListener("click", () => {
  document.documentElement.classList.toggle("fullscreen-active");
  resizeRenderer();
  orbit.update();
});
