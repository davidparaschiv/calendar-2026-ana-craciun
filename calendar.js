export const YEAR = 2026;
export const TIME_ZONE = 'Europe/Bucharest';
export function calendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
  const part = name => Number(parts.find(p => p.type === name).value);
  return { year:part('year'), month:part('month'), day:part('day') };
}
export function isUnlocked(day, now = new Date()) {
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  const date = calendarDate(now);
  return date.year > YEAR || (date.year === YEAR && date.month === 12 && date.day >= day);
}
export function isToday(day, now = new Date()) {
  const date = calendarDate(now);
  return date.year === YEAR && date.month === 12 && date.day === day;
}
export function readOpened(storage) {
  try { const value=JSON.parse(storage.getItem('advent-2026-opened') || '[]'); return new Set(Array.isArray(value) ? value.filter(d => Number.isInteger(d) && d>=1 && d<=31) : []); }
  catch { return new Set(); }
}
export function doorBounds(day) {
  const index=day-1, row=Math.floor(index/4), col=index%4;
  const offset=row === 7 ? 46 : 0;
  return { x:24 + col*88 + offset, y:552 + row*112, width:78, height:100 };
}

// Keep the design in 390 logical units, but draw enough pixels for the display.
export function renderMetrics(cssWidth, devicePixelRatio = 1) {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 390;
  const density = Number.isFinite(devicePixelRatio) ? Math.min(3, Math.max(2, devicePixelRatio)) : 2;
  const pixelWidth = Math.ceil(width * density);
  const zoom = pixelWidth / 390;
  return { width:pixelWidth, height:Math.ceil(1540 * zoom), zoom, textResolution:Math.max(2, Math.ceil(zoom)) };
}
