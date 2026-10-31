import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';
import './game/online.js';
import { createNPCSystem } from './game/npc.js';
import { createTrafficSystem } from './game/traffic.js';
import { createMissionTargets } from './game/world.js';
import { MissionSystem } from './game/mission.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="game">
    <div id="world"></div><div class="vignette"></div><div class="scanline"></div>
    <div class="status" id="netStatusTop">● ZYVEN CITY ONLINE</div>
    <header class="topbar">
      <div class="top-left">
        <div class="avatar">🕶️</div>
        <div class="profile"><div class="brand">ZYVEN <span>CITY</span></div><div class="level">ANASKING • LV. 15</div><div class="xp"><i></i></div></div>
      </div>
      <div class="top-right">
        <div class="currency"><div class="pill gold">🪙 <span id="coins">125,750</span> +</div><div class="pill blue">💎 <span id="gems">5,230</span> +</div></div>
        <div class="top-actions"><button class="icon-btn" id="rewards">🎁</button><button class="icon-btn" id="premium">♛</button><button class="icon-btn" id="settings">⚙</button><button class="icon-btn" id="power">⏻</button></div>
      </div>
    </header>

    <section class="mission-card"><div class="eyebrow">● MAIN MISSION</div><h2 id="missionTitle">REACH THE CITY HALL</h2><p id="missionMeta">Get to the objective without losing your crew.</p><div class="mission-progress"><i id="missionProgress"></i></div></section>
    <div class="map-wrap"><div class="map"><div class="map-road"></div><i class="map-dot one"></i><i class="map-dot two"></i><i class="map-dot three"></i><b class="map-player"></b></div></div>
    <div class="voice">🎙 VOICE CHAT <b id="voiceState">ON</b></div>

    <div class="team">
      <div class="team-row"><b class="num">1</b><div><strong>AnasKing</strong><div class="hp"><i></i></div></div><small>♛</small></div>
      <div class="team-row"><b class="num">2</b><div><strong>AhmedPro</strong><div class="hp"><i></i></div></div><small>◉</small></div>
      <div class="team-row"><b class="num">3</b><div><strong>HassanGamer</strong><div class="hp"><i></i></div></div><small>◉</small></div>
    </div>

    <div class="chat"><b>💬</b><span>Type a message...</span><button id="sendChat">➤</button></div>
    <div class="stats"><div class="stat"><strong id="fps">60</strong> FPS</div><div class="stat"><strong id="latency">32</strong> ms</div></div>

    <div class="mobile-controls">
      <div class="joystick" id="joystick"><div class="stick" id="stick"></div></div>
      <div class="actions-pad">
        <button class="action fire" id="fire">✦</button><button class="action dash" id="dash">⚡</button>
        <button class="action run" id="run">🏃<span class="small-label">RUN</span></button>
        <button class="action jump" id="jump">↟<span class="small-label">JUMP</span></button>
        <button class="action hit" id="hit">✊<span class="small-label">ACTION</span></button>
        <button class="action crouch" id="crouch">🧎</button>
      </div>
    </div>

    <div class="bottom-menu" id="menu"><div class="menu-head"><b>ZYVEN CITY</b><button class="icon-btn" id="closeMenu">×</button></div><div class="menu-grid"><button id="missionBtn">START MISSION</button><button id="multiBtn">MULTIPLAYER</button><button id="qualityBtn">ULTRA GRAPHICS</button><button id="soundBtn">SOUND ON</button></div></div>
    <div class="toast" id="toast">WELCOME TO ZYVEN CITY</div>
  </div>`;

const $ = (q) => document.querySelector(q);
const toastEl = $('#toast');
let toastTimer;
function toast(message) { toastEl.textContent = message; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800); }

async function enterLandscape() {
  try { if (screen.orientation?.lock) await screen.orientation.lock('landscape'); } catch {}
  try { await document.documentElement.requestFullscreen?.(); } catch {}
}
addEventListener('pointerdown', enterLandscape, { once: true });
addEventListener('touchstart', enterLandscape, { once: true });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6aa9e7);
scene.fog = new THREE.Fog(0x78b5e7, 120, 520);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 700);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const qualityDpr = Math.min(devicePixelRatio, 2.0);
renderer.setPixelRatio(qualityDpr); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#world').appendChild(renderer.domElement);
const composer = new EffectComposer(renderer); composer.setPixelRatio(qualityDpr); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.34, 0.34, 0.82); composer.addPass(bloom); composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0xbfe2ff, 0x27331f, 2.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 4.1); sun.position.set(-80, 120, 55); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -130; sun.shadow.camera.right = 130; sun.shadow.camera.top = 130; sun.shadow.camera.bottom = -130; scene.add(sun);
const rim = new THREE.DirectionalLight(0x7acbff, 1.8); rim.position.set(80, 35, -80); scene.add(rim);

function mat(color, rough = .7, metal = 0, emissive = 0x000000, ei = 0) { return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity: ei }); }
function box(parent, x, y, z, sx, sy, sz, material, cast = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
function cyl(parent, x, y, z, r, h, material, radial = 12) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, h, radial), material); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }

// Open-world ground, roads, parks and water.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), mat(0x2b4938, .92, .02)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const roadMat = mat(0x1b2028, .88, .04), sidewalkMat = mat(0x66717a, .9, 0);
for (let x = -140; x <= 140; x += 35) box(scene, x, .04, 0, 9, .08, 420, roadMat, false);
for (let z = -140; z <= 140; z += 35) box(scene, 0, .05, z, 420, .1, 9, roadMat, false);
const laneMat = new THREE.MeshBasicMaterial({ color: 0xf5d78a });
for (let x = -140; x <= 140; x += 35) for (let z = -150; z <= 150; z += 9) box(scene, x, .11, z, .12, .02, 4.2, laneMat, false);
for (let z = -140; z <= 140; z += 35) for (let x = -150; x <= 150; x += 9) box(scene, x, .12, z, 4.2, .02, .12, laneMat, false);
const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 90), new THREE.MeshStandardMaterial({ color: 0x1e7591, roughness: .18, metalness: .35, transparent: true, opacity: .9 })); water.rotation.x = -Math.PI / 2; water.position.set(120, .02, -95); scene.add(water);

// City blocks with varied towers, windows, rooftops and landmark signs.
const buildingColors = [0x1d2938, 0x26384a, 0x30465a, 0x172432, 0x394a58, 0x222b39];
const windowGlow = new THREE.MeshBasicMaterial({ color: 0x75dcff, transparent: true, opacity: .32 });
for (let x = -140; x <= 140; x += 35) for (let z = -140; z <= 140; z += 35) {
  if (Math.abs(x) < 18 || Math.abs(z) < 18) continue;
  const count = 2 + Math.floor(Math.random() * 3);
  for (let n = 0; n < count; n++) {
    const px = x + (Math.random() - .5) * 22, pz = z + (Math.random() - .5) * 22;
    const w = 7 + Math.random() * 9, d = 7 + Math.random() * 9, h = 12 + Math.random() * 52;
    const building = new THREE.Group(); building.position.set(px, 0, pz); scene.add(building);
    box(building, 0, h / 2, 0, w, h, d, mat(buildingColors[Math.floor(Math.random() * buildingColors.length)], .55, .2));
    const roof = box(building, 0, h + .2, 0, w + .5, .35, d + .5, mat(0x0d1621, .38, .5));
    roof.castShadow = true;
    for (let fy = 4; fy < h - 1; fy += 5) {
      for (let side = -1; side <= 1; side += 2) {
        const windows = new THREE.Mesh(new THREE.BoxGeometry(w * .62, .72, .035), windowGlow); windows.position.set(0, fy, side * (d / 2 + .02)); building.add(windows);
      }
    }
    if (Math.random() > .45) cyl(building, 0, h + 2.2, 0, .25, 4, mat(0x293745, .3, .7));
  }
}

// Landmark tower and neon ZYVEN sign.
const landmark = new THREE.Group(); landmark.position.set(0, 0, -6); scene.add(landmark);
box(landmark, 0, 13, 0, 22, 26, 16, mat(0x263649, .38, .4));
box(landmark, 0, 27, 0, 15, 4, 12, mat(0x152231, .32, .55));
const crown = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 6.2, 2.2, 8), mat(0x4c5d70, .28, .65)); crown.position.y = 30; landmark.add(crown);
const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, .18), new THREE.MeshBasicMaterial({ color: 0x6a3cff })); sign.position.set(0, 19, -8.15); landmark.add(sign);
const signText = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95 })); signText.position.set(0, 19, -8.28); landmark.add(signText);
const landmarkLight = new THREE.PointLight(0x8f4cff, 28, 55, 2); landmarkLight.position.set(0, 22, -10); scene.add(landmarkLight);

// Trees and street lights.
for (let i = 0; i < 70; i++) { const x = (Math.random() - .5) * 350, z = (Math.random() - .5) * 350; if (Math.abs(x % 35) < 7 || Math.abs(z % 35) < 7) continue; const g = new THREE.Group(); cyl(g, 0, 1.1, 0, .18, 2.2, mat(0x4b3023, .95)); const crown = new THREE.Mesh(new THREE.SphereGeometry(1.45 + Math.random() * .7, 12, 9), mat(Math.random() > .5 ? 0x1c7048 : 0x257b52, .95)); crown.position.y = 3; crown.castShadow = true; g.add(crown); g.position.set(x, 0, z); scene.add(g); }
for (let i = -150; i <= 150; i += 35) { const light = new THREE.Group(); cyl(light, 0, 3, 0, .08, 6, mat(0x1e2730, .55, .5)); const lamp = new THREE.PointLight(0xffdfad, 5, 18, 2); lamp.position.y = 6; light.add(lamp); light.position.set(i + 5, 0, 5); scene.add(light); }

function makeCharacter(primary = 0x111827, accent = 0x1687ff) {
  const g = new THREE.Group();
  const skin = mat(0xc98762, .68, 0), hair = mat(0x17120f, .85, 0), shirt = mat(primary, .55, .08), accentMat = mat(accent, .42, .12), pants = mat(0x11151d, .72, .12), shoe = mat(0xeeeef0, .45, .18);
  const torso = box(g, 0, 1.85, 0, 1.1, 1.35, .62, shirt); torso.castShadow = true;
  box(g, 0, 2.95, 0, .72, .75, .68, skin); const head = g.children[g.children.length - 1];
  box(g, 0, 3.3, -.02, .76, .25, .72, hair);
  box(g, 0, 2.08, -.34, .82, .38, .08, accentMat);
  const armL = box(g, -.72, 1.85, 0, .28, 1.15, .32, shirt), armR = box(g, .72, 1.85, 0, .28, 1.15, .32, shirt); armL.rotation.z = -.12; armR.rotation.z = .12;
  box(g, -.31, .82, 0, .38, 1.05, .42, pants); box(g, .31, .82, 0, .38, 1.05, .42, pants);
  box(g, -.33, .24, -.12, .44, .25, .72, shoe); box(g, .33, .24, -.12, .44, .25, .72, shoe);
  const pack = box(g, 0, 1.85, .43, .72, 1.05, .25, mat(0x202c3a, .5, .3)); pack.castShadow = true;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(.38, .12, .03), new THREE.MeshBasicMaterial({ color: accent })); glow.position.set(0, 2.05, -.36); g.add(glow);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}

const player = makeCharacter(0x121824, 0x1687ff); player.position.set(0, 0, 32); scene.add(player);
window.dispatchEvent(new CustomEvent('zyven:ready', { detail: { scene, car: player } }));

// Decorative city NPCs remain lightweight and far enough from the player to keep mobile FPS stable.
const npcSystem = createNPCSystem(scene, 22); const trafficSystem = createTrafficSystem(scene, 12); const world = createMissionTargets(scene); const missionSystem = new MissionSystem(toast);

const input = { x: 0, y: 0, run: false, jump: false, hit: false, dash: false, crouch: false };
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === 'Shift') input.run = true; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; if (e.key === 'Shift') input.run = false; });

const joystick = $('#joystick'), stick = $('#stick'); let joyPointer = null;
function updateJoy(clientX, clientY) { const r = joystick.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const max = r.width * .34; let dx = clientX - cx, dy = clientY - cy; const len = Math.hypot(dx, dy); if (len > max) { dx *= max / len; dy *= max / len; } stick.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / max; input.y = dy / max; }
joystick.addEventListener('pointerdown', e => { joyPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); updateJoy(e.clientX, e.clientY); });
joystick.addEventListener('pointermove', e => { if (e.pointerId === joyPointer) updateJoy(e.clientX, e.clientY); });
function resetJoy(e) { if (e.pointerId !== joyPointer) return; joyPointer = null; input.x = input.y = 0; stick.style.transform = 'translate(0,0)'; }
joystick.addEventListener('pointerup', resetJoy); joystick.addEventListener('pointercancel', resetJoy);

function holdButton(id, key) { const el = $('#' + id); el.addEventListener('pointerdown', e => { e.preventDefault(); input[key] = true; }); ['pointerup','pointercancel','pointerleave'].forEach(t => el.addEventListener(t, () => input[key] = false)); }
holdButton('run','run'); holdButton('jump','jump'); holdButton('hit','hit'); holdButton('dash','dash'); holdButton('crouch','crouch');
$('#fire').onclick = () => toast('ACTION READY');

let cameraYaw = 0, cameraPitch = .18, cameraDrag = null;
renderer.domElement.addEventListener('pointerdown', e => { if (e.clientX < innerWidth * .55) return; cameraDrag = { id: e.pointerId, x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => { if (!cameraDrag || cameraDrag.id !== e.pointerId) return; cameraYaw -= (e.clientX - cameraDrag.x) * .006; cameraPitch = THREE.MathUtils.clamp(cameraPitch + (e.clientY - cameraDrag.y) * .004, -.1, .5); cameraDrag.x = e.clientX; cameraDrag.y = e.clientY; });
renderer.domElement.addEventListener('pointerup', () => cameraDrag = null); renderer.domElement.addEventListener('pointercancel', () => cameraDrag = null);

function startMission() { if (!missionSystem.active) missionSystem.startRandom(player, world); else toast(`TARGET: ${missionSystem.active.target.name}`); }
$('#missionBtn').onclick = () => { startMission(); $('#menu').classList.remove('open'); };
$('#multiBtn').onclick = () => { $('#menu').classList.remove('open'); window.ZyvenOnline?.buildUI?.(); document.querySelector('#onlinePanel')?.classList.add('open'); };
$('#settings').onclick = () => $('#menu').classList.toggle('open'); $('#closeMenu').onclick = () => $('#menu').classList.remove('open');
$('#rewards').onclick = () => toast('DAILY REWARD +500 COINS'); $('#premium').onclick = () => toast('PREMIUM CITY PASS'); $('#power').onclick = () => toast('EXIT IS DISABLED IN DEMO');
$('#qualityBtn').onclick = () => { renderer.setPixelRatio(Math.min(devicePixelRatio, 2.4)); bloom.strength = .45; toast('ULTRA GRAPHICS ENABLED'); };
$('#soundBtn').onclick = () => toast('SOUND ON'); $('#sendChat').onclick = () => toast('CHAT READY');
$('#dash').onclick = () => { input.dash = true; setTimeout(() => input.dash = false, 450); toast('DASH ⚡'); };

const clock = new THREE.Clock(); let speed = 0, currentYaw = Math.PI, lastMissionTimer = 0, frames = 0, fpsTime = performance.now();
function animate() {
  requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .033); frames++;
  if (performance.now() - fpsTime > 1000) { $('#fps').textContent = String(frames); frames = 0; fpsTime = performance.now(); }
  const keyX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), keyY = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  const ix = Math.abs(input.x) > .05 ? input.x : keyX, iy = Math.abs(input.y) > .05 ? input.y : keyY;
  const moving = Math.hypot(ix, iy) > .08;
  if (moving) { const desired = Math.atan2(ix, iy) + cameraYaw; currentYaw = THREE.MathUtils.lerp(currentYaw, desired, .16); player.rotation.y = currentYaw; }
  const boost = input.run ? 1.7 : 1; const dash = input.dash ? 2.8 : 1; const targetSpeed = moving ? 9.2 * boost * dash : 0;
  speed = THREE.MathUtils.lerp(speed, targetSpeed, moving ? .11 : .16);
  player.position.x += Math.sin(currentYaw) * speed * dt; player.position.z += Math.cos(currentYaw) * speed * dt;
  player.position.x = THREE.MathUtils.clamp(player.position.x, -175, 175); player.position.z = THREE.MathUtils.clamp(player.position.z, -175, 175);
  player.position.y = moving ? Math.abs(Math.sin(performance.now() * .012)) * .055 : 0;
  if (input.jump) { player.position.y = .55; setTimeout(() => input.jump = false, 120); }
  if (input.hit) { player.rotation.x = Math.sin(performance.now() * .02) * .04; } else player.rotation.x = 0;

  npcSystem.update(); trafficSystem.update(); missionSystem.update(player, world);
  const active = missionSystem.active;
  if (active) { $('#missionTitle').textContent = `REACH ${active.target.name.toUpperCase()}`; $('#missionMeta').textContent = `Hard objective • Reward €${active.reward}`; $('#missionProgress').style.width = '42%'; }
  else { $('#missionTitle').textContent = 'REACH THE CITY HALL'; $('#missionMeta').textContent = `Missions completed: ${missionSystem.completed} • Start a new objective`; $('#missionProgress').style.width = `${Math.min(92, 22 + missionSystem.completed * 12)}%`; }

  const cameraDistance = 8.7, cameraHeight = 4.8;
  const desiredCam = new THREE.Vector3(player.position.x - Math.sin(currentYaw + cameraYaw) * cameraDistance, player.position.y + cameraHeight + cameraPitch * 3, player.position.z - Math.cos(currentYaw + cameraYaw) * cameraDistance);
  camera.position.lerp(desiredCam, .09); const look = new THREE.Vector3(player.position.x, player.position.y + 1.75 + cameraPitch, player.position.z); camera.lookAt(look);
  const kmh = Math.round(speed * 3.6); $('#latency').textContent = String(28 + Math.floor(Math.random() * 9));
  composer.render();
}
animate();

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); const d = Math.min(devicePixelRatio, 2.2); renderer.setPixelRatio(d); renderer.setSize(innerWidth, innerHeight); composer.setPixelRatio(d); composer.setSize(innerWidth, innerHeight); bloom.setSize(innerWidth, innerHeight); });
setTimeout(() => toast('WELCOME TO ZYVEN CITY • DRAG RIGHT SIDE TO LOOK AROUND'), 800);
