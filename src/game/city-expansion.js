import * as THREE from 'three';

// GTA-style fictional city systems: enterable properties, bank heists, wanted stars and police pursuit.
// This is a gameplay layer only; it does not model real-world criminal procedures.
addEventListener('zyven:ready', (event) => {
  const { scene, player, box, mat, toast, addCoins } = event.detail;
  if (!scene || !player) return;

  const interact = document.createElement('button');
  interact.id = 'cityInteract';
  interact.textContent = 'ENTER / INTERACT';
  Object.assign(interact.style, { position:'fixed', right:'7vw', bottom:'19vh', zIndex:30, display:'none', padding:'14px 18px', border:'1px solid rgba(255,255,255,.22)', borderRadius:'16px', background:'rgba(8,12,20,.82)', color:'#fff', font:'800 13px system-ui', letterSpacing:'.08em', backdropFilter:'blur(14px)' });
  document.querySelector('.game')?.appendChild(interact);

  const wanted = document.createElement('div');
  wanted.id = 'wantedHud';
  wanted.innerHTML = '<span class="wanted-label">WANTED</span><span class="wanted-stars">☆☆☆☆☆</span>';
  Object.assign(wanted.style, { position:'fixed', right:'3vw', top:'9vh', zIndex:25, display:'none', textAlign:'right', textShadow:'0 2px 10px #000', fontFamily:'system-ui' });
  wanted.querySelector('.wanted-label').style.cssText = 'display:block;font-size:10px;letter-spacing:.18em;font-weight:900;opacity:.72';
  wanted.querySelector('.wanted-stars').style.cssText = 'font-size:27px;letter-spacing:3px;font-weight:900;color:#fff';
  document.querySelector('.game')?.appendChild(wanted);

  const banner = document.createElement('div');
  banner.id = 'heistBanner';
  Object.assign(banner.style, { position:'fixed', left:'50%', top:'15vh', transform:'translateX(-50%)', zIndex:29, display:'none', padding:'12px 20px', borderRadius:'999px', background:'rgba(8,10,16,.86)', border:'1px solid rgba(255,255,255,.18)', color:'#fff', font:'900 12px system-ui', letterSpacing:'.12em', textTransform:'uppercase', backdropFilter:'blur(16px)' });
  document.querySelector('.game')?.appendChild(banner);

  const interiors = [];
  const interactables = [];
  const police = [];
  let wantedLevel = 0;
  let heist = null;
  let wantedCooldown = 0;
  let last = performance.now();

  const building = (x, z, w, d, h, name, bank=false) => {
    const g = new THREE.Group(); g.position.set(x,0,z); scene.add(g);
    const shell = box(g,0,h/2,0,w,h,d,mat(bank?0x17243a:0x26313e,.48,.25),true);
    const roof = box(g,0,h+.25,0,w+.4,.45,d+.4,mat(0x101820,.32,.55),true);
    const door = box(g,0,1.5,d/2+.08,bank?3.5:2.5,3,.18,mat(bank?0x0c0f15:0x19232c,.28,.65),true);
    const sign = box(g,0,h*.72,d/2+.13,w*.62,.75,.08,new THREE.MeshBasicMaterial({color:bank?0xffc94a:0x67d7ff}),false);
    const interior = new THREE.Group(); interior.visible=false; scene.add(interior);
    box(interior,0,.05,0,w-1,.1,d-1,mat(0x1a2028,.86));
    box(interior,0,3.2,-(d/2-0.5),w-1,.2,.2,mat(0x3c4855,.45,.15));
    box(interior,-(w/2-1),2,0,.2,4,d-1,mat(0x151b22,.65,.1));
    box(interior,(w/2-1),2,0,.2,4,d-1,mat(0x151b22,.65,.1));
    if(bank){
      for(let i=-1;i<=1;i++) box(interior,i*3,1.1,-d*.28,2.1,2.2,.15,mat(0x39424b,.34,.4));
      box(interior,0,1.2,-d*.45,w*.55,2.4,.22,mat(0x202831,.25,.55));
      for(let i=-2;i<=2;i++) box(interior,i*1.3,2.8,-d*.45,.9,.9,.2,mat(0xb8c4d0,.3,.7));
    } else {
      box(interior,0,.8,0,4.5,1.5,2.2,mat(0x4a3028,.75));
      box(interior,0,2.3,-1,2.4,.18,1.4,mat(0x2f5b72,.55,.2));
    }
    interior.position.set(x,0,z);
    const item={g,interior,door,doorWorld:new THREE.Vector3(x,0,z+d/2+.08),name,bank,inside:false};
    interiors.push(item); interactables.push(item); return item;
  };

  const bank = building(-70,-35,20,15,11,'CENTRAL BANK',true);
  building(65,30,13,12,9,'CITY HOUSE');
  building(-55,65,14,12,9,'RIVERSIDE HOUSE');
  building(100,-20,15,12,10,'HILLSIDE HOUSE');
  building(-120,-90,16,13,10,'OLD TOWN HOUSE');
  building(80,105,15,13,10,'AIRPORT HOUSE');

  // Armored cash van near the bank becomes an optional side mission target.
  const van = new THREE.Group(); van.position.set(-57,0,-35); scene.add(van);
  box(van,0,1.2,0,5,2.2,2.2,mat(0x26313a,.32,.65),true);
  box(van,0,2.35,0,2.7,.25,1.9,mat(0x10151b,.22,.7),true);
  box(van,0,1.15,1.15,2.5,1.3,.12,mat(0x10151b,.22,.8));

  const spawnPolice = () => {
    if (police.length >= Math.min(6, 1 + wantedLevel)) return;
    const angle = Math.random()*Math.PI*2, dist = 38 + Math.random()*18;
    const car = new THREE.Group();
    car.position.copy(player.root.position).add(new THREE.Vector3(Math.cos(angle)*dist,0,Math.sin(angle)*dist));
    const body=box(car,0,1,0,4.3,1.5,7.2,mat(0x101820,.3,.7),true);
    box(car,0,1.8,0,3.2,.55,3.1,mat(0x17212b,.2,.65),true);
    box(car,-1.4,1.75,0,.45,.25,1.6,mat(0x0a0d12,.2,.7));
    const red=new THREE.MeshBasicMaterial({color:0xff334d}), blue=new THREE.MeshBasicMaterial({color:0x3d8cff});
    box(car,-.55,2.2,0,.65,.18,.45,red); box(car,.55,2.2,0,.65,.18,.45,blue);
    car.userData.speed=8+wantedLevel*1.7; car.userData.life=0; scene.add(car); police.push(car);
  };

  const setWanted = (level) => {
    wantedLevel = THREE.MathUtils.clamp(level,0,5);
    wanted.style.display = wantedLevel ? 'block' : 'none';
    wanted.querySelector('.wanted-stars').textContent = '★'.repeat(wantedLevel)+'☆'.repeat(5-wantedLevel);
    wanted.querySelector('.wanted-stars').style.color = wantedLevel >= 3 ? '#ff5366' : '#fff';
    while(police.length < Math.min(6, wantedLevel+1)) spawnPolice();
  };

  const beginHeist = () => {
    if (heist || wantedLevel) return;
    heist = { timer:12, progress:0, reward:1800 };
    banner.style.display='block'; banner.textContent='BANK HEIST • SECURE THE VAULT';
    toast('BANK HEIST STARTED — 12 SECONDS');
  };

  const enter = (item) => {
    if (item.inside) {
      player.root.position.set(item.doorWorld.x,item.doorWorld.y,item.doorWorld.z+3);
      item.inside=false; item.interior.visible=false; toast('EXITED '+item.name);
    } else {
      const p=item.g.position.clone(); p.y=0; player.root.position.copy(p).add(new THREE.Vector3(0,0,-item.g.position.z*0));
      player.root.position.set(p.x,p.y,p.z);
      item.inside=true; item.interior.visible=true;
      // Keep the interior at the same coordinates, but raise the player slightly so the room is readable.
      player.root.position.y=.15;
      toast('ENTERED '+item.name);
      if(item.bank) beginHeist();
    }
  };

  interact.onclick = () => {
    const nearest = interactables.filter(x=>player.root.position.distanceTo(x.doorWorld)<7).sort((a,b)=>player.root.position.distanceTo(a.doorWorld)-player.root.position.distanceTo(b.doorWorld))[0];
    if(nearest) enter(nearest);
  };

  addEventListener('keydown', e=>{
    if(e.key.toLowerCase()==='e') interact.click();
    if(e.key.toLowerCase()==='r' && wantedLevel===0 && !heist) beginHeist();
  });

  addEventListener('zyven:crime', e => setWanted(Math.max(wantedLevel, e.detail?.level||1)));

  const tick = () => {
    const now=performance.now(), dt=Math.min(.05,(now-last)/1000); last=now;
    const nearest=interactables.filter(x=>player.root.position.distanceTo(x.doorWorld)<7).sort((a,b)=>player.root.position.distanceTo(a.doorWorld)-player.root.position.distanceTo(b.doorWorld))[0];
    interact.style.display=nearest?'block':'none';
    if(nearest) interact.textContent=nearest.inside?'EXIT BUILDING':(nearest.bank?'START BANK HEIST':'ENTER '+nearest.name);

    if(heist){
      heist.timer-=dt; heist.progress=Math.max(0,1-heist.timer/12); banner.textContent=`BANK HEIST • VAULT ${Math.round(heist.progress*100)}%`;
      if(heist.timer<=0){ addCoins(heist.reward); heist=null; setWanted(2); banner.textContent='ESCAPE! POLICE ALERTED'; toast('+1,800 CITY CASH • 2 STAR WANTED'); setTimeout(()=>banner.style.display='none',2600); }
    }

    for(let i=police.length-1;i>=0;i--){
      const car=police[i]; const dx=player.root.position.x-car.position.x, dz=player.root.position.z-car.position.z, len=Math.hypot(dx,dz)||1;
      car.position.x += dx/len*car.userData.speed*dt; car.position.z += dz/len*car.userData.speed*dt; car.rotation.y=Math.atan2(dx,dz); car.userData.life+=dt;
      if(wantedLevel===0 || car.userData.life>55){scene.remove(car); police.splice(i,1);}
      else if(len<4.8){ player.health=Math.max(0,player.health-(wantedLevel*1.8*dt)); }
    }

    if(wantedLevel>0){
      wantedCooldown += dt;
      if(wantedCooldown>35 && police.length===0){ wantedLevel=0; wanted.style.display='none'; wantedCooldown=0; toast('WANTED LEVEL CLEARED'); }
    }
    requestAnimationFrame(tick);
  };
  tick();
});
