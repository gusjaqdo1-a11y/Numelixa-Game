const KEY = 'zyven-city-profile-v1';

export function loadProfile() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
  return null;
}

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
  return profile;
}

export function createProfile(name, username) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanUsername = username.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18).toLowerCase();
  return saveProfile({
    name: cleanName,
    username: cleanUsername || 'player',
    level: 1,
    xp: 0,
    coins: 1500,
    gems: 100,
    health: 100,
    missions: { completed: 0, active: null },
    createdAt: Date.now()
  });
}

export function updateProfile(profile, patch) { return saveProfile({ ...profile, ...patch }); }
