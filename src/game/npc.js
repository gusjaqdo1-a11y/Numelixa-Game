import * as THREE from 'three';

function makePedestrian() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .65, 4, 8), new THREE.MeshStandardMaterial({ color: [0x4fdcff,0xffb84d,0xd96cff,0x55e6a5][Math.floor(Math.random()*4)] }));
  body.position.y = .75;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf0c7a4 }));
  head.position.y = 1.35;
  g.add(head);
  return g;
}

export function createNPCSystem(scene, count = 24) {
  const npcs = [];
  for (let i=0;i<count;i++) {
    const npc = makePedestrian();
    npc.position.set((Math.random()-.5)*165, 0, (Math.random()-.5)*165);
    npc.userData.target = new THREE.Vector3((Math.random()-.5)*165,0,(Math.random()-.5)*165);
    npc.userData.speed = .012 + Math.random()*.018;
    scene.add(npc);
    npcs.push(npc);
  }
  return {
    update() {
      for (const npc of npcs) {
        const target = npc.userData.target;
        const d = target.clone().sub(npc.position); d.y = 0;
        if (d.length() < 2) npc.userData.target.set((Math.random()-.5)*165,0,(Math.random()-.5)*165);
        else { d.normalize(); npc.position.addScaledVector(d, npc.userData.speed); npc.rotation.y = Math.atan2(d.x,d.z); }
      }
    }
  };
}
