'use strict';
/* 入力（タッチ／マウス／キーボード／コントローラー。ERA ARMS から流用）
   メニュー：押した方向にカーソルが動き、決定しても先頭に戻らない。戦場：マスのカーソル（上＝奥） */
function setMode(pad){document.body.classList.toggle('pad',pad)}
function focusables(){const root=$('#ov').classList.contains('show')?$('#ov'):$('#app');return [...root.querySelectorAll('.f')].filter(e=>e.offsetParent!==null)}
function curFocus(){return $('.foc')}
function setFocus(e,scroll){$$('.foc').forEach(x=>x.classList.remove('foc'));if(!e)return;e.classList.add('foc');ui.fk=e.dataset.k;ui.fr=e.getBoundingClientRect();if(scroll)e.scrollIntoView({block:'nearest',inline:'nearest'})}
function restoreFocus(){const fs=focusables();if(!fs.length)return;let e=fs.find(x=>x.dataset.k===ui.fk);
 if(!e&&ui.fr){let bd=1e9;const cx=ui.fr.left+ui.fr.width/2,cy=ui.fr.top+ui.fr.height/2;fs.forEach(x=>{const r=x.getBoundingClientRect(),d=Math.hypot(r.left+r.width/2-cx,r.top+r.height/2-cy);if(d<bd){bd=d;e=x}})}
 if(!e)e=fs.find(x=>x.dataset.y)||fs.find(x=>x.classList.contains('pri'))||fs[0];e.classList.add('foc');ui.fk=e.dataset.k}
function moveFocus(dx,dy){setMode(true);if(gridOn()){gridDir(dx,dy);render();return}
 const fs=focusables();if(!fs.length)return;const c=curFocus();if(!c||!fs.includes(c))return setFocus(fs[0],true);const r=c.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bs=1e9;
 fs.forEach(x=>{if(x===c)return;const q=x.getBoundingClientRect(),ex=q.left+q.width/2-cx,ey=q.top+q.height/2-cy,al=ex*dx+ey*dy,pp=Math.abs(ex*dy)+Math.abs(ey*dx);if(al<4)return;if(pp>al*2.5+20)return;const s=al+pp*2.2;if(s<bs){bs=s;best=x}});
 if(best){setFocus(best,true);sfx('sel')}}
function padAct(k){setMode(true);auInit();const cmb=G&&scr==='game'&&G.phase==='combat'&&!ui.ov;
 if(k==='a'){if(gridOn()){gridTap(ui.cur.x,ui.cur.y);render()}else{const c=curFocus();if(c)doClick(c)}}
 else if(k==='b'){if(ui.ov){ui.ov=null;render()}else if(ui.mode||ui.sel){ui.mode=null;ui.sel=null;render()}else{const b=$('[data-b]');if(b)doClick(b)}}
 else if(k==='y'){const root=$('#ov').classList.contains('show')?$('#ov'):$('#app');const y=root.querySelector('[data-y]');if(y)doClick(y)}
 else if(k==='x'){if(cmb){ACT.look();render()}}
 else if(k==='st'){if(G&&scr==='game'){ui.ov=ui.ov?null:{k:'menu'};render()}}
 else if(k==='lb'||k==='rb'){if(cmb){cycle(k==='rb'?1:-1);sfx('sel');render()}}}
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'){if(e.key==='Enter'||e.key==='Escape')e.target.blur();return}
 const k=e.key.toLowerCase(),m={arrowleft:[-1,0],arrowright:[1,0],arrowup:[0,-1],arrowdown:[0,1]}[k];if(m){e.preventDefault();moveFocus(m[0],m[1]);return}
 const b={enter:'a',' ':'a',z:'a',escape:'b',x:'b',e:'y',q:'lb',w:'rb',c:'x',m:'st'}[k];if(b){e.preventDefault();padAct(b)}});
const GP={prev:{},rep:0,dir:null};
function pollPad(t){requestAnimationFrame(pollPad);const gs=navigator.getGamepads?navigator.getGamepads():[];let g=null;for(const x of gs){if(x&&x.connected){g=x;break}}if(!g)return;
 const bt=i=>g.buttons[i]&&g.buttons[i].pressed,map={0:'a',1:'b',2:'x',3:'y',4:'lb',5:'rb',9:'st'};
 for(const i in map){const p=bt(i);if(p&&!GP.prev[i])padAct(map[i]);GP.prev[i]=p}
 let dx=0,dy=0;if(bt(14)||g.axes[0]<-.55)dx=-1;else if(bt(15)||g.axes[0]>.55)dx=1;if(bt(12)||g.axes[1]<-.55)dy=-1;else if(bt(13)||g.axes[1]>.55)dy=1;if(dx&&dy){if(Math.abs(g.axes[0])>Math.abs(g.axes[1]))dy=0;else dx=0}
 const d=dx||dy?dx+','+dy:null;if(d!==GP.dir){GP.dir=d;GP.rep=t+380;if(d)moveFocus(dx,dy)}else if(d&&t>GP.rep){GP.rep=t+140;moveFocus(dx,dy)}
 if(g.axes[3]&&Math.abs(g.axes[3])>.3){const s=($('#ov').classList.contains('show')?$('#ov'):$('#app')).querySelector('.scroll');if(s)s.scrollTop+=g.axes[3]*14}}
requestAnimationFrame(pollPad);
