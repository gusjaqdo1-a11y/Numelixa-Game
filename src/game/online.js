import Peer from 'peerjs';

const MAX_PLAYERS = 4;
const ROOM_PREFIX = 'zyven-room-';

function makeCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out='';
  for(let i=0;i<6;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export class OnlineRoom {
  constructor({onPlayerCount=()=>{},onRemoteState=()=>{},onStatus=()=>{},onVoice=()=>{}}={}){
    this.onPlayerCount=onPlayerCount; this.onRemoteState=onRemoteState; this.onStatus=onStatus; this.onVoice=onVoice;
    this.peer=null; this.connections=new Map(); this.roomCode=''; this.host=false; this.localStream=null; this.calls=new Map();
    this.id='';
  }
  async create(){
    this.destroy(); this.host=true; this.roomCode=makeCode();
    await this.openPeer(`${ROOM_PREFIX}${this.roomCode}`);
    this.onStatus(`ROOM ${this.roomCode} READY`); return this.roomCode;
  }
  async join(code){
    code=String(code||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
    if(code.length!==6) throw new Error('Room code must be 6 characters');
    this.destroy(); this.host=false; this.roomCode=code;
    await this.openPeer();
    this.connectToHost(code);
    this.onStatus(`JOINING ${code}…`); return code;
  }
  openPeer(id){
    return new Promise((resolve,reject)=>{
      this.peer=new Peer(id,{debug:0});
      this.peer.on('open',id=>{this.id=id;resolve(id)});
      this.peer.on('error',e=>{this.onStatus(`NETWORK: ${e.type||'ERROR'}`);reject(e)});
      this.peer.on('connection',conn=>this.accept(conn));
      this.peer.on('call',call=>this.acceptCall(call));
    });
  }
  connectToHost(code){
    const conn=this.peer.connect(`${ROOM_PREFIX}${code}`,{reliable:true,serialization:'json'});
    this.accept(conn);
  }
  accept(conn){
    conn.on('open',()=>{
      this.connections.set(conn.peer,conn);
      conn.send({type:'hello',id:this.id,host:this.host});
      this.onPlayerCount(this.connections.size+1);
      this.onStatus(`ONLINE • ${this.connections.size+1}/${MAX_PLAYERS}`);
    });
    conn.on('data',msg=>{
      if(msg?.type==='state') this.onRemoteState(conn.peer,msg);
      if(msg?.type==='voice-ready') this.onStatus('VOICE CONNECTED');
    });
    conn.on('close',()=>{this.connections.delete(conn.peer);this.onPlayerCount(this.connections.size+1)});
    conn.on('error',()=>this.connections.delete(conn.peer));
  }
  broadcast(state){
    const msg={type:'state',...state};
    for(const conn of this.connections.values()) if(conn.open) conn.send(msg);
  }
  async enableVoice(){
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Voice requires HTTPS and microphone permission');
    this.localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    for(const peerId of this.connections.keys()) this.callPeer(peerId);
    this.onStatus('MIC ON • VOICE READY');
  }
  callPeer(peerId){
    if(!this.localStream||this.calls.has(peerId)) return;
    const call=this.peer.call(peerId,this.localStream); if(!call)return;
    this.calls.set(peerId,call);
    call.on('stream',stream=>this.playStream(peerId,stream));
    call.on('close',()=>this.calls.delete(peerId));
  }
  acceptCall(call){
    if(!this.localStream){call.answer();}
    else call.answer(this.localStream);
    this.calls.set(call.peer,call);
    call.on('stream',stream=>this.playStream(call.peer,stream));
    call.on('close',()=>this.calls.delete(call.peer));
  }
  playStream(peerId,stream){
    let audio=document.querySelector(`audio[data-peer="${peerId}"]`);
    if(!audio){audio=document.createElement('audio');audio.dataset.peer=peerId;audio.autoplay=true;audio.playsInline=true;audio.style.display='none';document.body.appendChild(audio)}
    audio.srcObject=stream; this.onVoice(peerId);
  }
  leave(){this.destroy();this.onPlayerCount(1);this.onStatus('OFFLINE');}
  destroy(){
    for(const c of this.connections.values()) c.close(); this.connections.clear();
    for(const c of this.calls.values()) c.close(); this.calls.clear();
    this.localStream?.getTracks().forEach(t=>t.stop()); this.localStream=null;
    this.peer?.destroy(); this.peer=null; this.roomCode='';
  }
}
