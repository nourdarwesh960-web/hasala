export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export function todayISO(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
export function parseISO(s) {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return todayISO(d); }
export function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const monthKey = (iso) => (iso || '').slice(0, 7);
export const sameMonth = (iso, ref) => monthKey(iso) === monthKey(ref);
export function shortDate(iso, lang) {
  const d = parseISO(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' });
}
export function fullDate(iso, lang) {
  const d = parseISO(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
export function fmtNum(n, dec = 0) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
}
export function freqPerMonth(freq) { return { daily: 30.44, weekly: 4.345, monthly: 1, yearly: 1 / 12 }[freq] || 1; }
export function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function download(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}export function fmtDateShort(iso, lang = 'ar') {
  if (!iso) return '';
  const d = parseISO(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' });
}
export function resizeImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}