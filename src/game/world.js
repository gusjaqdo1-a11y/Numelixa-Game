import * as THREE from 'three';

export function createMissionTargets(scene) {
  const targets = [
    { name: 'Downtown', position: new THREE.Vector3(-28, 0, -28) },
    { name: 'Harbor', position: new THREE.Vector3(42, 0, -35) },
    { name: 'Airport', position: new THREE.Vector3(-50, 0, 48) },
    { name: 'Old Town', position: new THREE.Vector3(48, 0, 48) },
  ];

  for (const target of targets) {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0x39a9ff, emissive: 0x0b4b80, emissiveIntensity: 1.4 })
    );
    marker.position.copy(target.position).add(new THREE.Vector3(0, 0.12, 0));
    marker.name = `mission-${target.name}`;
    scene.add(marker);
    target.marker = marker;
  }

  return { getMissionTargets: () => targets };
}
