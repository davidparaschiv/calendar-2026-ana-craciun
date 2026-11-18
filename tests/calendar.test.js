import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { calendarDate, isUnlocked, readOpened, doorBounds } from '../calendar.js';
import { memories } from '../memories.js';

test('future dates stay closed; current and past dates open',()=> {
 for(let day=1;day<=31;day++) {
  assert.equal(isUnlocked(day,new Date('2026-11-30T21:59:59Z')),false);
  assert.equal(isUnlocked(day,new Date('2026-12-01T00:00:00+02:00')),day===1);
  assert.equal(isUnlocked(day,new Date('2026-12-15T12:00:00+02:00')),day<=15);
  assert.equal(isUnlocked(day,new Date('2026-12-31T12:00:00+02:00')),true);
  assert.equal(isUnlocked(day,new Date('2027-01-01T00:00:00+02:00')),true);
  assert.equal(isUnlocked(day,new Date('2025-12-31T12:00:00+02:00')),false);
 }
});
test('midnight follows Romanian time, independently of the device timezone',()=> {
 assert.deepEqual(calendarDate(new Date('2026-11-30T22:00:00Z')),{year:2026,month:12,day:1});
 assert.equal(isUnlocked(2,new Date('2026-12-01T21:59:59Z')),false);
 assert.equal(isUnlocked(2,new Date('2026-12-01T22:00:00Z')),true);
 for(const invalid of [0,32,-1,1.5,'1',NaN]) assert.equal(isUnlocked(invalid),false);
});
test('31 dates have unique photos, descriptions, and existing relative assets',async()=> {
 assert.equal(memories.length,31);
 assert.deepEqual(memories.map(m=>m.day),Array.from({length:31},(_,i)=>i+1));
 assert.equal(new Set(memories.map(m=>m.src)).size,31);
 for(const m of memories) {
  assert.ok(m.description.trim());
  assert.match(m.src,/^assets\/photos\/.+\.jpg$/);
  await access(new URL('../'+m.src,import.meta.url));
 }
 assert.ok(memories.some(m=>m.description.endsWith('Te pupa bebelicu 😘')));
 assert.equal((await readdir(new URL('../',import.meta.url))).includes('CNAME'),false);
});
test('opened state tolerates blocked storage and corrupt data',()=> {
 assert.equal(readOpened({getItem:()=>{throw new Error('disabled');}}).size,0);
 for(const value of ['bad','{}','null','"text"']) assert.equal(readOpened({getItem:()=>value}).size,0);
 assert.deepEqual([...readOpened({getItem:()=>'[1,2,32,"3",-1]'})],[1,2]);
});
test('all mobile touch targets fit inside the calendar and do not overlap',()=> {
 const bounds=memories.map(m=>doorBounds(m.day));
 for(const b of bounds) { assert.ok(b.width>=44&&b.height>=44);assert.ok(b.x>=0&&b.x+b.width<=390);assert.ok(b.y+b.height<=1540); }
 for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++) {
  const a=bounds[i],b=bounds[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
 }
});

test('the application interface and descriptions have no Romanian diacritics',async()=> {
 const {readFile}=await import('node:fs/promises');
 for(const file of ['index.html','app.js','calendar.js','quiz.js','memories.js','style.css']) {
  const content=await readFile(new URL('../'+file,import.meta.url),'utf8');
  assert.doesNotMatch(content,/[ăâîșțşţĂÂÎȘȚŞŢ]/,file);
 }
});
