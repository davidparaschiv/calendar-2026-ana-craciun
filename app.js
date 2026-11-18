import { memories } from './memories.js';
import { questions, isCorrectAnswer, WRONG_ANSWER } from './quiz.js';
import { YEAR, calendarDate, isUnlocked, isToday, readOpened, doorBounds, renderMetrics, localPreviewEnabled } from './calendar.js?v=3';

const $ = id => document.getElementById(id);
let rendering = renderMetrics($('game').getBoundingClientRect().width, window.devicePixelRatio);
let game;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let storage;
try { storage = window.localStorage; } catch { storage = { getItem:()=>null, setItem:()=>{} }; }
const previewMode = localPreviewEnabled(window.location);
const openedKey = previewMode ? 'advent-2026-preview-opened' : 'advent-2026-opened';
const opened = readOpened(storage, openedKey);
const canOpenDay = day => (previewMode && memories.some(memory => memory.day === day)) || isUnlocked(day);
let snowEnabled = !reducedMotion.matches;
let scene;
let busy = false;
let activeButton;
let activeMemory;
const solvedQuestions = new Set();
let pendingAnimation;
let dateSignature = '';
const palette = { red:0xa91832, paper:0xfffaf6, ink:0x86243b, blue:0xc7e6f7 };
const buttons = new Map();
const announce = text => { $('announcement').textContent = text; };
const fmt = n => String(n).padStart(2,'0');

function buildControls() {
  for (const memory of memories) {
    const b = document.createElement('button');
    const box = doorBounds(memory.day);
    b.className = 'day-button';
    b.style.cssText = `left:${box.x/390*100}%;top:${box.y/1540*100}%;width:${box.width/390*100}%;height:${box.height/1540*100}%;`;
    b.addEventListener('click', () => openMemory(memory, b));
    $('controls').append(b);
    buttons.set(memory.day, b);
  }
  refreshControls();
}
function refreshControls() {
  for (const [day, button] of buttons) {
    const unlocked = canOpenDay(day);
    button.setAttribute('aria-disabled', String(!unlocked));
    button.setAttribute('aria-label', `${day} decembrie ${YEAR}. ${!unlocked ? 'Inca inchis. Se deschide pe '+day+' decembrie.' : opened.has(day) ? 'Amintire deschisa. Revede-o.' : 'Deschide amintirea.'}`);
  }
}
function refreshDate() {
  const d = calendarDate();
  const signature = `${d.year}-${d.month}-${d.day}`;
  if (signature === dateSignature) return;
  dateSignature = signature;
  refreshControls();
  scene?.redraw();
}

async function openMemory(memory, button) {
  // Recheck the actual date at the moment of opening, including after midnight.
  if (!canOpenDay(memory.day)) {
    announce(`Putina rabdare! Aceasta amintire se deschide pe ${memory.day} decembrie ${YEAR}.`);
    scene?.lockedFeedback(memory.day);
    return;
  }
  if (busy || $('memory-dialog').open) return;
  busy = true;
  activeButton = button;
  $('memory-title').textContent = `${memory.day} decembrie`;
  activeMemory = memory;
  const needsAnswer = Boolean(questions[memory.day]) && !solvedQuestions.has(memory.day);
  $('quiz-form').hidden = !needsAnswer;
  $('memory-content').hidden = needsAnswer;
  $('quiz-answer').value = '';
  $('quiz-answer').removeAttribute('aria-invalid');
  $('quiz-feedback').textContent = '';
  $('memory-description').textContent = '';
  $('memory-photo').removeAttribute('src');
  $('memory-photo').alt = '';
  if (needsAnswer) {
    $('quiz-question').textContent = questions[memory.day].text;
    document.querySelector('.eyebrow').textContent = 'O MICA CHEIE CATRE O AMINTIRE';
  } else {
    revealMemory(memory);
  }
  try {
    if (!reducedMotion.matches) {
      const bounds = button.getBoundingClientRect();
      const door = document.createElement('div');
      door.className = 'flip-door';
      door.setAttribute('aria-hidden','true');
      const front = document.createElement('div');
      front.className = 'flip-door-face flip-door-front';
      front.textContent = fmt(memory.day);
      const back = document.createElement('div');
      back.className = 'flip-door-face flip-door-back';
      back.textContent = '❄';
      door.append(front, back);
      Object.assign(door.style, {left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});
      document.body.append(door);
      const targetWidth = Math.min(440,innerWidth-28);
      const targetHeight = Math.min(620,innerHeight-28);
      pendingAnimation = door.animate([
        {transform:'perspective(1000px) rotateY(0deg)',borderRadius:'13px'},
        {transform:'perspective(1000px) rotateY(90deg)',offset:.45},
        {left:`${(innerWidth-targetWidth)/2}px`,top:`${(innerHeight-targetHeight)/2}px`,width:`${targetWidth}px`,height:`${targetHeight}px`,transform:'perspective(1000px) rotateY(180deg)',borderRadius:'22px'}
      ],{duration:1100,easing:'cubic-bezier(.22,.68,.22,1)',fill:'forwards'});
      try { await pendingAnimation.finished; } catch { /* Escape cancels the opening. */ }
      door.remove();
      if (!pendingAnimation || pendingAnimation.playState === 'idle') return;
      pendingAnimation = null;
    }
    // The date can change while the animation runs, so check again.
    if (!canOpenDay(memory.day)) return;
    $('memory-dialog').showModal();
    document.body.classList.add('modal-open');
    if (!reducedMotion.matches) $('memory-dialog').animate([{opacity:0,transform:'scale(.95)'},{opacity:1,transform:'scale(1)'}],{duration:230,easing:'ease-out'});
    if (needsAnswer) $('quiz-answer').focus({preventScroll:true});
    else markOpened(memory.day);
  } finally { busy = false; }
}
function markOpened(day) {
  opened.add(day);
  try { storage.setItem(openedKey,JSON.stringify([...opened])); } catch { /* Storage is optional. */ }
  refreshControls();
  scene?.redraw();
}
function revealMemory(memory) {
  if (!canOpenDay(memory.day)) return;
  $('quiz-form').hidden = true;
  $('memory-content').hidden = false;
  document.querySelector('.eyebrow').textContent = 'O AMINTIRE DOAR PENTRU TINE';
  $('memory-description').textContent = memory.description;
  $('memory-photo').alt = `Amintirea din ${memory.day} decembrie. ${memory.description}`;
  $('photo-error').hidden = true;
  $('memory-photo').src = memory.src;
}
$('quiz-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!activeMemory || !canOpenDay(activeMemory.day)) { closeMemory(); return; }
  if (!isCorrectAnswer(activeMemory.day, $('quiz-answer').value)) {
    $('quiz-feedback').textContent = WRONG_ANSWER;
    $('quiz-answer').setAttribute('aria-invalid','true');
    $('quiz-answer').focus({preventScroll:true});
    return;
  }
  solvedQuestions.add(activeMemory.day);
  revealMemory(activeMemory);
  markOpened(activeMemory.day);
  announce('Corect, Mami! Amintirea ta te asteapta.');
  $('close-dialog').focus({preventScroll:true});
});
function closeMemory() { $('memory-dialog').close(); }
$('close-dialog').addEventListener('click',closeMemory);
$('back-calendar').addEventListener('click',closeMemory);
$('memory-dialog').addEventListener('close',()=> { document.body.classList.remove('modal-open'); activeButton?.focus({preventScroll:true}); });
$('memory-dialog').addEventListener('click',event=> { if (event.target === $('memory-dialog')) { const r=event.target.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) closeMemory(); } });
$('memory-photo').addEventListener('error',()=> { $('photo-error').hidden=false; });
$('memory-photo').addEventListener('load',()=> { $('photo-error').hidden=true; });
$('retry-photo').addEventListener('click',()=> { $('memory-photo').src = $('memory-photo').getAttribute('src'); });
document.addEventListener('keydown',event=> { if(event.key==='Escape' && pendingAnimation) { pendingAnimation.cancel(); pendingAnimation=null; } });
function updateSnowButton() {
  $('snow-toggle').setAttribute('aria-pressed',String(snowEnabled));
  $('snow-toggle').setAttribute('aria-label',snowEnabled?'Opreste ninsoarea':'Porneste ninsoarea');
  $('snow-toggle').querySelector('span').textContent=snowEnabled?'Ninsoare':'Fara ninsoare';
}
$('snow-toggle').addEventListener('click',()=> { snowEnabled=!snowEnabled; scene?.flakes.forEach(f=>f.node.setVisible(snowEnabled)); updateSnowButton(); });
reducedMotion.addEventListener('change',event=> { if(event.matches) { snowEnabled=false; scene?.flakes.forEach(f=>f.node.setVisible(false)); updateSnowButton(); } });

class AdventScene extends Phaser.Scene {
  constructor() { super('Advent'); }
  preload() { this.load.svg('christmas','assets/christmas.svg',{width:1560,height:740}); }
  create() {
    scene=this;
    this.cameras.main.setOrigin(0,0).setZoom(rendering.zoom);
    this.ui=this.add.container(0,0);
    this.redraw();
    this.flakes = Array.from({length:42},(_,i)=> {
      const node=this.add.graphics().setDepth(20).setAlpha(.25+Math.random()*.35);
      node.lineStyle(1,0x9cdaff,1);
      const radius=i%3===0?3:1.5;
      if(i%3===0) for(let a=0;a<3;a++) { const t=a*Math.PI/3;node.lineBetween(-Math.cos(t)*radius,-Math.sin(t)*radius,Math.cos(t)*radius,Math.sin(t)*radius); }
      else { node.fillStyle(0xbce5ff);node.fillCircle(0,0,radius); }
      node.setPosition(Math.random()*390,Math.random()*1540).setVisible(snowEnabled);
      return {node,speed:10+Math.random()*20,phase:Math.random()*6};
    });
    $('loading').remove();
  }
  text(x,y,value,size=12,color='#86243b',serif=false) {
    const t=this.add.text(x,y,value,{fontFamily:serif?'Georgia, serif':'Arial, sans-serif',fontSize:`${size}px`,color,align:'center',lineSpacing:7,resolution:rendering.textResolution}).setOrigin(.5,0);
    this.ui.add(t);return t;
  }
  redraw() {
    this.ui.removeAll(true);
    const g=this.add.graphics();this.ui.add(g);
    g.fillStyle(palette.paper).fillRect(0,0,390,1540);
    g.fillStyle(palette.red).fillRect(0,0,390,380);
    // A fine garland above the winter scene.
    g.lineStyle(1,0xe8b9c1,.5);g.beginPath();g.moveTo(-10,72);
    for(let x=0;x<=400;x+=8)g.lineTo(x,72+Math.sin(x/390*Math.PI)*16);
    g.strokePath();
    for(let x=18;x<390;x+=35) { const y=72+Math.sin(x/390*Math.PI)*16;g.lineStyle(1,0xe8b9c1,.8).lineBetween(x,y,x,y+7);g.fillStyle(x%2?0xc7e6f7:0xffeee1,.9).fillCircle(x,y+9,2.5); }
    this.text(73,28,'PENTRU ANA',10,'#fff1ec').setLetterSpacing(2);
    this.text(195,112,'Un decembrie\ncu noi.',43,'#fffaf6',true);
    this.text(195,228,'31 de zile. 31 de amintiri. O singura iubire.',11,'#f4d8df');
    this.ui.add(this.add.image(195,313,'christmas').setDisplaySize(390,185));
    this.text(195,409,'DECEMBRIE 2026',10,'#a91832').setLetterSpacing(3);
    this.text(195,433,'Mici usi, amintiri mari.',26,'#86243b',true);
    const d=calendarDate();
    const status = previewMode ? 'PREVIZUALIZARE LOCALA · Toate zilele sunt deschise.' : d.year<YEAR || (d.year===YEAR && d.month<12) ? 'Povestea noastra incepe pe 1 decembrie.' : d.year===YEAR && d.month===12 ? 'Deschide ziua de azi. Pastreaza magia de maine.' : 'Toate amintirile noastre te asteapta aici.';
    this.text(195,474,status,11,'#a07179');
    const count=[...opened].filter(day=>canOpenDay(day)).length;
    this.text(195,503,`${count} / 31 amintiri descoperite`,10,'#a07179');
    g.fillStyle(0xf0e3e2).fillRoundedRect(125,526,140,3,2);
    if(count)g.fillStyle(palette.red).fillRoundedRect(125,526,140*count/31,3,2);
    for(const m of memories)this.drawDoor(m);
    this.text(195,1478,'Fiecare zi, un motiv sa te iubesc.',17,'#a91832',true);
    this.text(195,1512,'FACUT CU DRAG, DE BEBE  ·  ♥',8,'#a07179').setLetterSpacing(1.6);
  }
  drawDoor(memory) {
    const day=memory.day,b=doorBounds(day),unlocked=canOpenDay(day),seen=opened.has(day)&&unlocked,today=isToday(day);
    const blue=day%7===0;
    const white=day%4===2;
    const fill=seen?0xe6f1f5:blue?0xcfe7f3:white?0xfffaf6:day%3===0?0xc33b50:0xa91832;
    const ink=seen||blue||white?'#94253d':'#fff8f0';
    const bg=this.rexUI.add.roundRectangle(0,0,0,0,11,fill).setStrokeStyle(today?2:1,today?0x79bee3:white?0xe2c8cd:fill);
    const text=this.add.text(0,0,fmt(day),{fontFamily:'Georgia, serif',fontSize:'29px',color:ink,resolution:rendering.textResolution});
    const card=this.rexUI.add.label({x:b.x+b.width/2,y:b.y+b.height/2,width:b.width,height:b.height,background:bg,text,align:'center',space:{top:0,bottom:20}}).layout();
    this.ui.add(card);
    const graphics=this.add.graphics();this.ui.add(graphics);
    const color=Phaser.Display.Color.HexStringToColor(ink).color;
    const cx=b.x+b.width/2,cy=b.y+75;
    graphics.lineStyle(1,color,.6);
    if(seen) { graphics.beginPath();graphics.moveTo(cx-4,cy);graphics.lineTo(cx-1,cy+3);graphics.lineTo(cx+5,cy-4);graphics.strokePath(); }
    else if(!unlocked) { graphics.strokeRoundedRect(cx-3,cy,6,5,1);graphics.beginPath();graphics.arc(cx,cy,2,-Math.PI,0);graphics.strokePath(); }
    else { graphics.strokeRect(cx-5,cy-3,10,8);graphics.lineBetween(cx,cy-5,cx,cy+5);graphics.lineBetween(cx-5,cy,cx+5,cy);graphics.strokeEllipse(cx-2,cy-5,4,3);graphics.strokeEllipse(cx+2,cy-5,4,3); }
    // Small winter accents in the corner of each door.
    graphics.lineStyle(.7,color,.3);
    if(day%3===0) { const x=b.x+65,y=b.y+15;graphics.lineBetween(x-3,y,x+3,y);graphics.lineBetween(x,y-3,x,y+3); }
    else { graphics.fillStyle(color,.17);graphics.fillCircle(b.x+65,b.y+15,2); }
    if(today) { const dot=this.add.circle(b.x+12,b.y+12,2.5,0x8bc9ec);this.ui.add(dot); }
  }
  lockedFeedback(day) {
    const b=doorBounds(day);
    const toast=this.add.container(195,b.y+50).setDepth(30);
    const back=this.rexUI.add.roundRectangle(0,0,218,42,12,0x682034,.98);
    const text=this.add.text(0,0,`Se deschide pe ${day} decembrie`,{fontFamily:'Arial',fontSize:'12px',color:'#fffaf6',resolution:rendering.textResolution}).setOrigin(.5);
    toast.add([back,text]);this.time.delayedCall(1800,()=>toast.destroy());
  }
  update(time,delta) {
    if(!snowEnabled || !this.flakes)return;
    const seconds=Math.min(delta,50)/1000;
    for(const flake of this.flakes) { flake.node.y+=flake.speed*seconds;flake.node.x+=Math.sin(time/2200+flake.phase)*seconds*4;if(flake.node.y>1545){flake.node.y=-5;flake.node.x=Math.random()*390;} }
  }
}
buildControls();updateSnowButton();
try {
  game = new Phaser.Game({type:Phaser.CANVAS,parent:'game',width:rendering.width,height:rendering.height,backgroundColor:'#fffaf6',transparent:false,render:{antialias:true},fps:{target:30},input:{touch:{capture:false},mouse:{preventDefaultWheel:false}},scale:{mode:Phaser.Scale.NONE,autoCenter:Phaser.Scale.NO_CENTER},plugins:{scene:[{key:'rexUI',plugin:rexuiplugin,mapping:'rexUI'}]},scene:AdventScene});
} catch(error) { if($('loading')) $('loading').textContent='Calendarul nu s-a incarcat. Reincarca pagina pentru a incerca din nou.'; console.error(error); }
function resizeRenderer() {
  const next = renderMetrics($('game').getBoundingClientRect().width, window.devicePixelRatio);
  if (!game || (next.width === rendering.width && next.height === rendering.height)) return;
  rendering = next;
  game.scale.resize(next.width,next.height);
  if (scene?.ui) {
    scene.cameras.main.setOrigin(0,0).setZoom(next.zoom);
    scene.redraw();
  }
}
new ResizeObserver(resizeRenderer).observe($('game'));
window.addEventListener('resize',resizeRenderer);
refreshDate();
setInterval(refreshDate,15000);
window.addEventListener('focus',refreshDate);
document.addEventListener('visibilitychange',()=> { if(!document.hidden)refreshDate(); });
