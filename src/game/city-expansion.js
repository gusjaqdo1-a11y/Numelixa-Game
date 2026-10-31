import * as THREE from 'three';

// ZYVEN CITY property layer: believable facades, furnished interiors, enter/exit flow,
// bank heist, wanted stars and police pursuit. Everything is fictional and game-only.
addEventListener('zyven:ready', (event) => {
  const { scene, player, box, mat, toast, addCoins } = event.detail;
  if (!scene || !player) return;

  const interact = document.createElement('button');
  interact.id = 'cityInteract';
  interact.textContent = 'ENTER / INTERACT';
  Object.assign(interact.style, {
    position:'fixed', right:'7vw', bottom:'19vh', zIndex:30, display:'none',
    padding:'14px 18px', border:'1px solid rgba(255,255,255,.24)', borderRadius:'16px',
    background:'rgba(8,12,20,.86)', color:'#fff', font:'800 13px system-ui',
    letterSpacing:'.08em', backdropFilter:'blur(16px)', boxShadow:'0 12px 40px rgba(0,0,0,.28)'
  });
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
  Object.assign(banner.style, { position:'fixed', left:'50%', top:'15vh', transform:'translateX(-50%)', zIndex:29, display:'none', padding:'12px 20px', borderRadius:'999px', background:'rgba(8,10,16,.88)', border:'1px solid rgba(255,255,255,.18)', color:'#fff', font:'900 12px system-ui', letterSpacing:'.12em', textTransform:'uppercase', backdropFilter:'blur(16px)' });
  document.querySelector('.game')?.appendChild(banner);

  const interiors = [];
  const interactables = [];
  const police = [];
  let wantedLevel = 0;
  let heist = null;
  let wantedCooldown = 0;
  let last = performance.now();

  const windowMat = (color=0x9fe9ff) => new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:.55, roughness:.18, metalness:.35});
  const wood = mat(0x6b4431,.55,.04);
  const concrete = mat(0x5b6269,.8,.04);
  const glass = new THREE.MeshStandardMaterial({color:0x8bdcff,roughness:.08,metalness:.15,transparent:true,opacity:.58});
  const plantMat = mat(0x276a45,.95);

  const addFacade = (g,w,d,h,bank=false) => {
    // Recessed windows, balconies, awnings and a proper entrance make the exterior read as a building.
    const floors = Math.max(2, Math.floor(h/3.3));
    for(let floor=1; floor<floors; floor++) {
      const y=1.9+floor*3.05;
      for(const side of [-1,1]) {
        for(let col=-1; col<=1; col++) {
          const win=box(g,col*(w*.28),y,side*(d/2+.035),w*.15,1.12,.06,windowMat(bank?0xffd36a:0x8edfff));
          win.castShadow=false;
        }
      }
      if(!bank && floor%2===0) {
        box(g,0,y-.72,d/2+.09,w*.76,.12,.75,concrete);
      }
    }
    const canopy=box(g,0,3.35,d/2+.18,bank?5.2:3.8,.22,.9,mat(bank?0x24374c:0x3e4d5c,.32,.3));
    canopy.castShadow=true;
    box(g,0,2.15,d/2+.12,bank?3.9:2.8,4.25,.12,glass);
    if(!bank) {
      const sign=box(g,0,h*.78,d/2+.13,w*.48,.55,.08,windowMat(0x72d9ff));
      sign.castShadow=false;
    }
  };

  const addInteriorFurniture = (interior,w,d,bank,name) => {
    // Furnishings are deliberately low-poly but physically placed so interiors feel occupied.
    box(interior,0,.05,0,w-1,.1,d-1,mat(0x262a2d,.92));
    box(interior,0,.02,0,w-1.5,.03,d-1.5,mat(bank?0x303438:0x4b342a,.98));
    box(interior,0,3.15,-d/2+.45,w-1,.18,.22,mat(0x4b535a,.5,.2));
    box(interior,-w/2+.3,2,0,.18,4,d-1,mat(0x171c21,.72));
    box(interior,w/2-.3,2,0,.18,4,d-1,mat(0x171c21,.72));
    if(bank) {
      for(let i=-1;i<=1;i++) {
        box(interior,i*3.2,1.1,-d*.18,2.2,2.2,.18,mat(0x4d5660,.35,.45));
        box(interior,i*3.2,1.25,-d*.31,2.2,.12,1.1,glass);
      }
      box(interior,0,1.25,-d*.44,w*.58,2.4,.22,mat(0x1c232a,.25,.65));
      for(let i=-2;i<=2;i++) box(interior,i*1.3,2.85,-d*.44,.82,.75,.22,mat(0xb8c4d0,.28,.75));
      box(interior,0,1.25,d*.28,4.4,2.1,.18,mat(0x252c32,.3,.55));
      box(interior,0,2.5,d*.29,3.7,.16,.55,windowMat(0xffc84d));
    } else {
      box(interior,0,.85,.15,4.6,1.45,2.15,wood);
      box(interior,0,1.62,-.75,3.9,.16,1.35,mat(0x2d5264,.48,.18));
      box(interior,-w*.27,.8,-d*.2,1.1,1.5,.65,mat(0x303941,.65,.05));
      box(interior,w*.27,.45,-d*.18,1.4,.7,1.05,wood);
      const plant=new THREE.Group(); plant.position.set(-w*.36,.7,d*.28); interior.add(plant);
      box(plant,0,.28,0,.42,.55,.42,wood);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.58,10,8),plantMat); crown.position.y=.9; crown.castShadow=true; plant.add(crown);
      box(interior,0,2.5,-d*.45,3.2,1.4,.08,mat(0x222a31,.45,.15));
      box(interior,0,2.5,-d*.405,2.8,1.05,.05,windowMat(0x5ec9ff));
    }
  };

  const building = (x,z,w,d,h,name,bank=false) => {
    const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
    const shell=box(g,0,h/2,0,w,h,d,mat(bank?0x1b2b3d:0x3b4147,.5,.2),true);
    // Add facade depth and roof parapet instead of a single plain cube.
    box(g,0,h+.22,0,w+.55,.48,d+.55,mat(bank?0x101820:0x2b3035,.36,.45),true);
    box(g,0,.95,d/2+.06,w*.9,.18,.12,mat(bank?0x0e141b:0x282d32,.4,.25));
    addFacade(g,w,d,h,bank);
    const door=box(g,0,1.45,d/2+.11,bank?3.6:2.45,2.9,.16,mat(bank?0x0c1117:0x22272b,.24,.62),true);
    const handle=box(g,bank?1.05:.7,1.35,d/2+.21,.08,.72,.04,windowMat(0xffd67a)); handle.castShadow=false;
    const interior=new THREE.Group(); interior.visible=false; interior.position.set(x,0,z); scene.add(interior);
    addInteriorFurniture(interior,w,d,bank,name);
    const item={g,interior,door,doorWorld:new THREE.Vector3(x,0,z+d/2+.11),name,bank,inside:false};
    interiors.push(item); interactables.push(item); return item;
  };

  const bank=building(-70,-35,20,15,11,'CENTRAL BANK',true);
  building(65,30,14,12,9,'CITY HOUSE');
  building(-55,65,15,13,9,'RIVERSIDE HOUSE');
  building(100,-20,16,13,10,'HILLSIDE HOUSE');
  building(-120,-90,17,14,10,'OLD TOWN HOUSE');
  building(80,105,16,14,10,'AIRPORT HOUSE');
  building(35,-100,14,12,9,'DOWNTOWN APARTMENT');
  building(-105,35,15,12,9,'WESTSIDE VILLA');

  // Street-level realism: fences, lamps and small planters around properties.
  for(const item of interactables){
    if(item.bank) continue;
    for(const side of [-1,1]){
      const lamp=new THREE.Group(); lamp.position.set(item.g.position.x+side*(item.g.scale.x*0+8),0,item.g.position.z+item.doorWorld.z*0+.0); scene.add(lamp);
      box(lamp,0,2.2,0,.14,4.4,.14,mat(0x252b30,.45,.65),true);
      const glow=new THREE.PointLight(0xffd99a,5,12,2); glow.position.y=4.1; lamp.add(glow);
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0xffd99a})); bulb.position.y=4.05; lamp.add(bulb);
    }
  }

  const van=new THREE.Group(); van.position.set(-57,0,-35); scene.add(van);
  box(van,0,1.2,0,5,2.2,2.2,mat(0x26313a,.32,.65),true);
  box(van,0,2.35,0,2.7,.25,1.9,mat(0x10151b,.22,.7),true);
  box(van,0,1.15,1.15,2.5,1.3,.12,mat(0x10151b,.22,.8));

  const spawnPolice=()=>{
    if(police.length>=Math.min(6,1+wantedLevel)) return;
    const angle=Math.random()*Math.PI*2,dist=38+Math.random()*18;
    const car=new THREE.Group(); car.position.copy(player.root.position).add(new THREE.Vector3(Math.cos(angle)*dist,0,Math.sin(angle)*dist));
    box(car,0,1,0,4.3,1.5,7.2,mat(0x101820,.3,.7),true);
    box(car,0,1.8,0,3.2,.55,3.1,mat(0x17212b,.2,.65),true);
    box(car,-1.4,1.75,0,.45,.25,1.6,mat(0x0a0d12,.2,.7));
    const red=new THREE.MeshBasicMaterial({color:0xff334d}),blue=new THREE.MeshBasicMaterial({color:0x3d8cff});
    box(car,-.55,2.2,0,.65,.18,.45,red); box(car,.55,2.2,0,.65,.18,.45,blue);
    car.userData.speed=8+wantedLevel*1.7; car.userData.life=0; scene.add(car); police.push(car);
  };

  const setWanted=(level)=>{
    wantedLevel=THREE.MathUtils.clamp(level,0,5); wantedCooldown=0;
    wanted.style.display=wantedLevel?'block':'none';
    wanted.querySelector('.wanted-stars').textContent='★'.repeat(wantedLevel)+'☆'.repeat(5-wantedLevel);
    wanted.querySelector('.wanted-stars').style.color=wantedLevel>=3?'#ff5366':'#fff';
    while(police.length<Math.min(6,wantedLevel+1)) spawnPolice();
  };

  const beginHeist=()=>{
    if(heist||wantedLevel) return;
    heist={timer:12,reward:1800}; banner.style.display='block'; banner.textContent='BANK HEIST • SECURE THE VAULT';
    toast('BANK HEIST STARTED — 12 SECONDS');
  };

  const enter=(item)=>{
    if(item.inside){
      player.root.position.set(item.doorWorld.x,item.doorWorld.y,item.doorWorld.z+3);
      item.inside=false; item.interior.visible=false; item.g.visible=true; toast('EXITED '+item.name);
    } else {
      player.root.position.set(item.g.position.x,.15,item.g.position.z);
      item.inside=true; item.g.visible=false; item.interior.visible=true;
      toast('ENTERED '+item.name); if(item.bank) beginHeist();
    }
  };

  interact.onclick=()=>{
    const nearest=interactables.filter(x=>player.root.position.distanceTo(x.doorWorld)<7).sort((a,b)=>player.root.position.distanceTo(a.doorWorld)-player.root.position.distanceTo(b.doorWorld))[0];
    if(nearest) enter(nearest);
  };
  addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e') interact.click();});
  addEventListener('zyven:crime',e=>setWanted(Math.max(wantedLevel,e.detail?.level||1)));

  const tick=()=>{
    const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
    const nearest=interactables.filter(x=>player.root.position.distanceTo(x.doorWorld)<7).sort((a,b)=>player.root.position.distanceTo(a.doorWorld)-player.root.position.distanceTo(b.doorWorld))[0];
    interact.style.display=nearest?'block':'none';
    if(nearest) interact.textContent=nearest.inside?'EXIT BUILDING':(nearest.bank?'START BANK HEIST':'ENTER '+nearest.name);

    if(heist){
      heist.timer-=dt; banner.textContent=`BANK HEIST • VAULT ${Math.round((1-heist.timer/12)*100)}%`;
      if(heist.timer<=0){addCoins(heist.reward);heist=null;setWanted(2);banner.textContent='ESCAPE! POLICE ALERTED';toast('+1,800 CITY CASH • 2 STAR WANTED');setTimeout(()=>banner.style.display='none',2600);}
    }

    for(let i=police.length-1;i>=0;i--){
      const car=police[i],dx=player.root.position.x-car.position.x,dz=player.root.position.z-car.position.z,len=Math.hypot(dx,dz)||1;
      car.position.x+=dx/len*car.userData.speed*dt; car.position.z+=dz/len*car.userData.speed*dt; car.rotation.y=Math.atan2(dx,dz); car.userData.life+=dt;
      if(wantedLevel===0||car.userData.life>55){scene.remove(car);police.splice(i,1);} else if(len<4.8){player.health=Math.max(0,player.health-(wantedLevel*1.8*dt));}
    }
    if(wantedLevel>0){wantedCooldown+=dt;if(wantedCooldown>35&&police.length===0){wantedLevel=0;wanted.style.display='none';wantedCooldown=0;toast('WANTED LEVEL CLEARED');}}
    requestAnimationFrame(tick);
  };
  tick();
});
