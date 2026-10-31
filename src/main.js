import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';
import { createNPCSystem } from './game/npc.js';
import { createTrafficSystem } from './game/traffic.js';
import { createMissionTargets } from './game/world.js';
import { MissionSystem } from './game/mission.js';

const app=document.querySelector('#app');
app.innerHTML=`<div class="game"><div id="world"></div><div class="hud"><div class="brand">ZYVEN <span>CITY</span></div><div class="stats"><b>● ONLINE</b><span id="players">1 PLAYER</span><span>€ 12,450</span><span>★ 2,840</span></div><div class="mission"><small>ACTIVE MISSION</small><strong id="missionTitle">EXPLORE ZYVEN CITY</strong><em id="missionMeta">Find a destination and complete missions</em></div></div><div class="quality" id="quality">4K READY • HDR</div><div class="map"><span></span><i></i><i></i><i></i><b>◉</b></div><div class="controls"><button data-k="w">▲</button><div><button data-k="a">◀</button><button data-k="s">▼</button><button data-k="d">▶</button></div></div><div class="actions"><button id="missionBtn">MISSION</button><button id="boost">BOOST</button><button id="drift">DRIFT</button></div><div class="toast" id="toast">Welcome to ZYVEN CITY</div></div>`;

const scene=new THREE.Scene();scene.background=new THREE.Color(0x050914);scene.fog=new THREE.FogExp2(0x07111f,0.0042);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,500);camera.position.set(0,8,12);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=THREE.SRGBColorSpace;
const composer=new EffectComposer(renderer);composer.setPixelRatio(Math.min(devicePixelRatio,2.5));composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.72,0.48,0.78);composer.addPass(bloom);composer.addPass(new OutputPass());
document.querySelector('#world').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9fc9ff,0x111827,2.3));
const sun=new THREE.DirectionalLight(0xfff4df,3.1);sun.position.set(-40,65,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;scene.add(sun);
const rim=new THREE.PointLight(0x2f8cff,28,90,2);rim.position.set(0,12,0);scene.add(rim);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshStandardMaterial({color:0x121a24,roughness:.72,metalness:.08}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
function box(x,y,z,sx,sy,sz,c,rough=.62,metal=.15){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m}
for(let x=-90;x<=90;x+=14) box(x,.08,0,6,.16,190,0x202c3a,.9,.05); for(let z=-90;z<=90;z+=14) box(0,.09,z,190,.18,6,0x202c3a,.9,.05);
for(let x=-84;x<=84;x+=14)for(let z=-84;z<=84;z+=14){if(Math.abs(x)<15||Math.abs(z)<15)continue;const h=8+Math.random()*28;const b=box(x,h/2,z,9,h,9,[0x26364a,0x30435a,0x3b4d60,0x202e40][Math.floor(Math.random()*4)],.5,.24);if(Math.random()>.3){const glow=new THREE.Mesh(new THREE.BoxGeometry(7.9,h*.55,0.06),new THREE.MeshBasicMaterial({color:0x6fc7ff,transparent:true,opacity:.18}));glow.position.set(x,h*.54,z-4.53);scene.add(glow)}}
for(let i=0;i<35;i++){const x=(Math.random()-.5)*170,z=(Math.random()-.5)*170;const tree=new THREE.Mesh(new THREE.ConeGeometry(1.7,6,8),new THREE.MeshStandardMaterial({color:0x176a52,roughness:.9}));tree.position.set(x,3,z);tree.castShadow=true;scene.add(tree)}
const car=new THREE.Group();const body=box(0,.8,0,2.6,.7,4.5,0x1d8fff,.28,.65);car.add(body);const glass=new THREE.Mesh(new THREE.BoxGeometry(2.15,.48,1.75),new THREE.MeshPhysicalMaterial({color:0x08111d,metalness:.25,roughness:.12,transmission:.12,transparent:true,opacity:.92}));glass.position.y=1.2;car.add(glass);for(const x of[-1.35,1.35])for(const z of[-1.45,1.45]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,20),new THREE.MeshStandardMaterial({color:0x05070a,roughness:.8}));w.rotation.z=Math.PI/2;w.position.set(x,.45,z);car.add(w)}car.position.set(0,.1,35);scene.add(car);

const npcSystem=createNPCSystem(scene,24);const trafficSystem=createTrafficSystem(scene,12);const world=createMissionTargets(scene);const missionSystem=new MissionSystem(toast);
const keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);document.querySelectorAll('[data-k]').forEach(b=>{b.onpointerdown=()=>keys[b.dataset.k]=true;b.onpointerup=()=>keys[b.dataset.k]=false;b.onpointerleave=()=>keys[b.dataset.k]=false});

// Lightweight same-browser multiplayer preview. A production internet room can plug into the same state channel later.
const channel='BroadcastChannel' in window?new BroadcastChannel('zyven-city-room'):null;const peerId=Math.random().toString(36).slice(2,8);const peers=new Map();
function publish(){channel?.postMessage({id:peerId,x:car.position.x,z:car.position.z,r:car.rotation.y,t:Date.now()})}
channel?.addEventListener('message',e=>{if(e.data?.id&&e.data.id!==peerId)peers.set(e.data.id,e.data)});
setInterval(()=>{publish();const now=Date.now();for(const [id,p] of peers)if(now-p.t>3000)peers.delete(id);document.querySelector('#players').textContent=`${peers.size+1} PLAYER${peers.size?'S':''}`},120);

let speed=0,angle=0,lastMission=0;const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.033);const boost=keys.shift?2.4:1;let f=(keys.w?1:0)-(keys.s?1:0);let turn=(keys.a?1:0)-(keys.d?1:0);speed+=(f*.028*boost-speed*.018);speed*=Math.pow(.985,dt*60);angle+=turn*speed*.035;car.rotation.y=angle;car.position.x+=Math.sin(angle)*speed;car.position.z+=Math.cos(angle)*speed;car.position.x=THREE.MathUtils.clamp(car.position.x,-94,94);car.position.z=THREE.MathUtils.clamp(car.position.z,-94,94);npcSystem.update();trafficSystem.update();missionSystem.update(car,world);const m=missionSystem.active;if(m){document.querySelector('#missionTitle').textContent=`REACH ${m.target.name.toUpperCase()}`;document.querySelector('#missionMeta').textContent=`Reward €${m.reward} • Navigate to the blue marker`;}else{document.querySelector('#missionTitle').textContent='EXPLORE ZYVEN CITY';document.querySelector('#missionMeta').textContent=`Missions completed: ${missionSystem.completed}`;}const target=new THREE.Vector3(car.position.x-Math.sin(angle)*10,7.5,car.position.z-Math.cos(angle)*10);camera.position.lerp(target,.09);camera.lookAt(car.position.x,1,car.position.z);composer.render()}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(Math.min(devicePixelRatio,2.5));composer.setSize(innerWidth,innerHeight);bloom.setSize(innerWidth,innerHeight)});
document.querySelector('#boost').onclick=()=>{keys.shift=true;setTimeout(()=>keys.shift=false,700);toast('NITRO BOOST ⚡')};document.querySelector('#drift').onclick=()=>toast('DRIFT MODE');document.querySelector('#missionBtn').onclick=()=>{if(!missionSystem.active)missionSystem.startRandom(car,world);else toast(`TARGET: ${missionSystem.active.target.name}`)};function toast(t){const e=document.querySelector('#toast');e.textContent=t;e.classList.add('show');clearTimeout(lastMission);lastMission=setTimeout(()=>e.classList.remove('show'),1800)}
