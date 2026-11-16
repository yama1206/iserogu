'use strict';
/* 音（WebAudioで合成。ERA ARMS から流用） */
const AU={ctx:null,mg:null,nb:null,mode:'',step:0,next:0,mel:0};
function auInit(){if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}try{const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();AU.mg=AU.ctx.createGain();AU.mg.gain.value=.5;AU.mg.connect(AU.ctx.destination);const b=AU.ctx.createBuffer(1,AU.ctx.sampleRate*.4,AU.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=b;setInterval(seqTick,50)}catch(e){}}
function tone(f,d,ty,v,f2,t0){if(!AU.ctx)return;const c=AU.ctx,t=t0||c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AU.mg);o.start(t);o.stop(t+d+.05)}
function noise(d,v,fq,t0,q){if(!AU.ctx)return;const c=AU.ctx,t=t0||c.currentTime,s=c.createBufferSource(),g=c.createGain(),fl=c.createBiquadFilter();s.buffer=AU.nb;fl.type=q||'highpass';fl.frequency.value=fq||1000;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(AU.mg);s.start(t);s.stop(t+d+.02)}
const SFX={click:()=>tone(660,.06,'square',.08),sel:()=>tone(880,.04,'triangle',.07),no:()=>tone(160,.12,'square',.08),card:()=>{noise(.08,.12,2500);tone(520,.08,'triangle',.08,780)},
 hit:()=>{noise(.12,.3,700,0,'bandpass');tone(180,.12,'sawtooth',.14,60)},hurt:()=>{noise(.18,.34,300,0,'lowpass');tone(110,.2,'square',.16,50)},block:()=>{tone(900,.07,'square',.07,500);noise(.05,.15,3000)},
 heal:()=>{[523,659,784].forEach((f,i)=>tone(f,.18,'sine',.12,0,AU.ctx.currentTime+i*.07))},evade:()=>noise(.2,.14,4000),die:()=>{tone(300,.35,'sawtooth',.14,40);noise(.3,.2,400,0,'lowpass')},down:()=>tone(220,.6,'triangle',.2,55),
 buff:()=>tone(440,.2,'triangle',.1,880),deb:()=>tone(400,.25,'sawtooth',.08,150),turn:()=>{tone(392,.12,'triangle',.1);tone(587,.2,'triangle',.1,0,AU.ctx.currentTime+.1)},
 brk:()=>{noise(.25,.3,900,0,'bandpass');tone(700,.3,'square',.1,120)},
 win:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.3,'square',.09,0,AU.ctx.currentTime+i*.11))},lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,.45,'triangle',.14,0,AU.ctx.currentTime+i*.22))},step:()=>{noise(.08,.15,500,0,'lowpass')}};
function sfx(n){if(!META.se||!AU.ctx||!SFX[n])return;try{SFX[n]()}catch(e){}}
const MUS=[{r:50,sc:[0,3,5,7,10],bpm:84,w:'triangle',dr:2},{r:50,sc:[0,2,3,5,7,9,10],bpm:72,w:'triangle',dr:0}];
function music(){let m='t';if(G&&scr==='game'&&G.phase!=='prep')m='0'+(G.phase==='combat'?(G.cb.kind==='b'?'b':'c'):G.phase==='over'?'x':'m');if(m!==AU.mode){AU.mode=m;AU.step=0;if(AU.ctx)AU.next=AU.ctx.currentTime+.1}}
function prnd(s){let x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function seqTick(){if(!AU.ctx||AU.ctx.state!=='running')return;if(!META.bgm||AU.mode.endsWith('x')){AU.next=AU.ctx.currentTime+.1;return}
 const md=AU.mode,cmb=md.endsWith('c'),boss=md.endsWith('b'),M=md==='t'?MUS[1]:MUS[0],spb=60/(M.bpm*(boss?1.22:cmb?1.12:1))/4,hz=n=>440*Math.pow(2,(n-69)/12),deg=(d,o)=>M.r+(boss?-2:0)+M.sc[((d%M.sc.length)+M.sc.length)%M.sc.length]+12*(Math.floor(d/M.sc.length)+(o||0));
 while(AU.next<AU.ctx.currentTime+.15){const s=AU.step,t=AU.next,bar=Math.floor(s/16),st=s%16,prog=[0,3,4,0,0,5,3,4][bar%8],seed=(md==='t'?7:1)*100+(bar%8)*16+st+(cmb||boss?999:0);
  if(st%8===0||(cmb||boss)&&st%4===0)tone(hz(deg(prog,-1)),spb*(cmb||boss?3:7),'triangle',.1,0,t);
  if(st%4===2&&!cmb&&!boss)tone(hz(deg(prog+2,0)),spb*2,'sine',.035,0,t);
  if(st%2===0){const r=prnd(seed);if(r<(cmb||boss?.75:.55)){if(st===0)AU.mel=prog+M.sc.length;AU.mel+=[-2,-1,-1,1,1,2,0][Math.floor(prnd(seed+.5)*7)];AU.mel=Math.max(prog+2,Math.min(prog+M.sc.length*2,AU.mel));tone(hz(deg(AU.mel,0)),spb*(r<.2?3.5:1.8),M.w,.075,0,t)}}
  const dr=M.dr+(cmb||boss?1:0);if(dr>=1&&st%8===0)tone(110,.16,'sine',.22,45,t);if(dr>=2&&st%8===4)noise(.1,.1,1500,t);if(dr>=3&&(st%4===2))noise(.03,.05,6000,t);if(dr>=3&&boss&&st%16===14)tone(110,.12,'sine',.2,45,t);
  AU.next+=spb;AU.step++}}
