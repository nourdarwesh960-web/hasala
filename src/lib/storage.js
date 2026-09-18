import { STORAGE_KEY } from './constants';
export function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return null; return JSON.parse(raw); }
  catch { return null; }
}
export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.error('Failed to save state', e); }
}
export function clearState() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }