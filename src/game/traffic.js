import * as THREE from 'three';

function makeTrafficCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1,.65,3.8), new THREE.MeshStandardMaterial({ color, roughness:.55, metalness:.25 }));
  body.position.y = .55; g.add(body);
  for (const x of [-1.05,1.05]) for (const z of [-1.2,1.2]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,12), new THREE.MeshStandardMaterial({color:0x090b10}));
    w.rotation.z = Math.PI/2; w.position.set(x,.35,z); g.add(w);
  }
  return g;
}

export function createTrafficSystem(scene, count = 12) {
  const cars = [];
  const lanes = [-84,-70,-56,-42,-28,-14,0,14,28,42,56,70,84];
  for (let i=0;i<count;i++) {
    const axis = Math.random() > .5 ? 'x' : 'z';
    const lane = lanes[Math.floor(Math.random()*lanes.length)];
    const car = makeTrafficCar([0xff4d67,0xffc857,0x7d8cff,0x55e6a5,0xf4f7fb][i%5]);
    car.position.set(axis==='x' ? (Math.random()*180-90) : lane, .1, axis==='z' ? (Math.random()*180-90) : lane);
    car.rotation.y = axis==='x' ? Math.PI/2 : 0;
    car.userData.axis=axis; car.userData.speed=.025+Math.random()*.025; car.userData.lane=lane;
    scene.add(car); cars.push(car);
  }
  return { update() { for (const car of cars) { if (car.userData.axis==='x') { car.position.x += car.userData.speed; if(car.position.x>95) car.position.x=-95; } else { car.position.z += car.userData.speed; if(car.position.z>95) car.position.z=-95; } } } };
}
