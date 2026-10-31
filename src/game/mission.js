export class MissionSystem {
  constructor(toast) {
    this.toast = toast;
    this.active = null;
    this.completed = 0;
  }

  startRandom(car, world) {
    const targets = world.getMissionTargets();
    const target = targets[Math.floor(Math.random() * targets.length)];
    this.active = { target, startedAt: performance.now(), reward: 250 + Math.floor(Math.random() * 750) };
    this.toast(`MISSION: Reach ${target.name}`);
    return this.active;
  }

  update(car, world) {
    if (!this.active) return false;
    const dx = car.position.x - this.active.target.position.x;
    const dz = car.position.z - this.active.target.position.z;
    if (Math.hypot(dx, dz) < 5) {
      const reward = this.active.reward;
      this.completed += 1;
      this.toast(`MISSION COMPLETE +€${reward}`);
      this.active = null;
      return true;
    }
    return false;
  }
}
