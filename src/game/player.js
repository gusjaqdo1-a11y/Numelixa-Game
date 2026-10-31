import * as THREE from 'three';

const M = (color, rough = .65, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (name, size, material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.name = name; m.castShadow = true; m.receiveShadow = true; return m; };

export class PlayerCharacter {
  constructor(scene, options = {}) {
    this.root = new THREE.Group(); this.root.name = 'PlayerCharacter'; scene.add(this.root);
    this.speed = 6.4; this.runSpeed = 10.5; this.direction = new THREE.Vector3(0, 0, 1);
    this.velocityY = 0; this.grounded = true; this.state = 'idle'; this.actionTimer = 0; this.walkTime = 0;
    this.health = 100; this.energy = 100; this.coins = options.coins ?? 1000;
    this.parts = {};
    this.build(options);
  }

  build(options) {
    const skin = M(options.skin ?? 0xc98463), shirt = M(options.shirt ?? 0x111827, .52, .05), jacket = M(options.accent ?? 0x1687ff, .48, .12), pants = M(0x101722, .72, .08), shoe = M(0xf2f4f7, .4, .18), hair = M(0x17130f, .9), dark = M(0x0b0f16, .45, .3);
    const pelvis = new THREE.Group(); pelvis.name = 'pelvis'; pelvis.position.y = 1.12; this.root.add(pelvis); this.parts.pelvis = pelvis;
    const torso = box('torso', [1.02, 1.18, .58], shirt); torso.position.y = .78; pelvis.add(torso); this.parts.torso = torso;
    const neck = box('neck', [.28, .25, .28], skin); neck.position.y = 1.47; pelvis.add(neck);
    const head = new THREE.Group(); head.name = 'head'; head.position.y = 1.92; pelvis.add(head); this.parts.head = head;
    const face = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 12), skin); face.scale.set(.92, 1.08, .9); face.castShadow = true; head.add(face);
    const hairCap = box('hair', [.76, .25, .72], hair); hairCap.position.set(0, .27, -.01); head.add(hairCap);
    const visor = box('glasses', [.68, .12, .08], dark); visor.position.set(0, .03, -.36); head.add(visor);
    const leftArm = this.limb('leftArm', .68, shirt); leftArm.position.set(-.68, 1.12, 0); pelvis.add(leftArm); this.parts.leftArm = leftArm;
    const rightArm = this.limb('rightArm', .68, shirt); rightArm.position.set(.68, 1.12, 0); pelvis.add(rightArm); this.parts.rightArm = rightArm;
    const leftFore = this.limb('leftForearm', .62, jacket); leftFore.position.y = -.72; leftArm.add(leftFore); this.parts.leftFore = leftFore;
    const rightFore = this.limb('rightForearm', .62, jacket); rightFore.position.y = -.72; rightArm.add(rightFore); this.parts.rightFore = rightFore;
    const leftHand = box('leftHand', [.25, .27, .25], skin); leftHand.position.y = -.65; leftFore.add(leftHand); this.parts.leftHand = leftHand;
    const rightHand = box('rightHand', [.25, .27, .25], skin); rightHand.position.y = -.65; rightFore.add(rightHand); this.parts.rightHand = rightHand;
    const leftThigh = this.limb('leftThigh', .82, pants); leftThigh.position.set(-.3, .12, 0); pelvis.add(leftThigh); this.parts.leftThigh = leftThigh;
    const rightThigh = this.limb('rightThigh', .82, pants); rightThigh.position.set(.3, .12, 0); pelvis.add(rightThigh); this.parts.rightThigh = rightThigh;
    const leftShin = this.limb('leftShin', .78, pants); leftShin.position.y = -.82; leftThigh.add(leftShin); this.parts.leftShin = leftShin;
    const rightShin = this.limb('rightShin', .78, pants); rightShin.position.y = -.82; rightThigh.add(rightShin); this.parts.rightShin = rightShin;
    const leftFoot = box('leftFoot', [.38, .22, .72], shoe); leftFoot.position.set(0, -.78, .15); leftShin.add(leftFoot); this.parts.leftFoot = leftFoot;
    const rightFoot = box('rightFoot', [.38, .22, .72], shoe); rightFoot.position.set(0, -.78, .15); rightShin.add(rightFoot); this.parts.rightFoot = rightFoot;
    const bag = box('backpack', [.72, .82, .25], dark); bag.position.set(0, .78, .4); pelvis.add(bag);
    const aura = new THREE.Mesh(new THREE.RingGeometry(.58, .78, 32), new THREE.MeshBasicMaterial({ color: 0x19a9ff, transparent: true, opacity: .65, side: THREE.DoubleSide })); aura.rotation.x = -Math.PI / 2; aura.position.y = .02; this.root.add(aura); this.parts.aura = aura;
    this.root.position.set(0, 0, 24);
  }

  limb(name, length, material) { const g = new THREE.Group(); g.name = name; const m = box(name + 'Mesh', [.28, length, .32], material); m.position.y = -length / 2; g.add(m); return g; }

  move(input, dt, cameraYaw = 0) {
    const x = input.x, z = input.y; const mag = Math.min(1, Math.hypot(x, z));
    const running = input.run && mag > .15; const speed = running ? this.runSpeed : this.speed;
    if (mag > .05) {
      // Mobile joystick is camera-relative: push up = move toward the camera's forward direction.
      // The character now turns toward the exact direction of travel instead of sliding sideways.
      const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
      const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
      const dir = forward.multiplyScalar(z).add(right.multiplyScalar(x));
      if (dir.lengthSq() > .001) {
        dir.normalize();
        this.direction.lerp(dir, Math.min(1, dt * 14)).normalize();
        this.root.position.addScaledVector(dir, speed * mag * dt);
        const targetYaw = Math.atan2(this.direction.x, this.direction.z);
        let delta = targetYaw - this.root.rotation.y;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        this.root.rotation.y += delta * Math.min(1, dt * 14);
      }
      this.state = running ? 'run' : 'walk';
      this.walkTime += dt * (running ? 13 : 9);
    } else if (this.actionTimer <= 0) this.state = 'idle';
    this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -185, 185); this.root.position.z = THREE.MathUtils.clamp(this.root.position.z, -185, 185);
    this.animate(dt);
  }

  punch() { if (this.actionTimer > 0) return false; this.actionTimer = .62; this.state = 'punch'; this.parts.rightArm.rotation.z = -.55; this.parts.rightArm.rotation.x = -1.25; this.parts.rightFore.rotation.x = -1.15; return true; }
  jump() { if (!this.grounded || this.actionTimer > 0) return false; this.velocityY = 8.8; this.grounded = false; this.state = 'jump'; return true; }
  dash() { if (this.energy < 25 || this.actionTimer > 0) return false; this.energy -= 25; this.root.position.addScaledVector(this.direction, 7); this.actionTimer = .28; this.state = 'dash'; return true; }

  animate(dt) {
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    if (!this.grounded) { this.velocityY -= 22 * dt; this.root.position.y += this.velocityY * dt; if (this.root.position.y <= 0) { this.root.position.y = 0; this.velocityY = 0; this.grounded = true; } }
    const p = this.parts; const moving = this.state === 'walk' || this.state === 'run'; const swing = moving ? Math.sin(this.walkTime) * (this.state === 'run' ? .72 : .48) : 0;
    if (this.state !== 'punch' && this.state !== 'dash') {
      p.leftThigh.rotation.x = swing; p.rightThigh.rotation.x = -swing; p.leftShin.rotation.x = Math.max(0, -swing) * .7; p.rightShin.rotation.x = Math.max(0, swing) * .7;
      p.leftArm.rotation.x = -swing * .7; p.rightArm.rotation.x = swing * .7; p.leftFore.rotation.x = 0; p.rightFore.rotation.x = 0; p.rightArm.rotation.z = .12; p.leftArm.rotation.z = -.12;
      p.torso.rotation.z = moving ? Math.sin(this.walkTime * 2) * .025 : 0; p.head.rotation.y = Math.sin(this.walkTime * .5) * .03;
    }
    if (this.state === 'punch') {
      const t = 1 - this.actionTimer / .62; const hit = Math.sin(Math.min(1, t) * Math.PI); p.rightArm.rotation.x = -1.25 - hit * .8; p.rightFore.rotation.x = -1.15 - hit * .65; p.leftArm.rotation.x = .25;
      if (this.actionTimer === 0) this.state = moving ? 'walk' : 'idle';
    }
    if (this.state === 'jump') { p.leftThigh.rotation.x = -.45; p.rightThigh.rotation.x = -.45; p.leftArm.rotation.x = -.7; p.rightArm.rotation.x = -.7; if (this.grounded) this.state = 'idle'; }
    p.aura.rotation.z += dt * 1.8; p.aura.material.opacity = this.state === 'dash' ? .95 : .45;
  }
}
