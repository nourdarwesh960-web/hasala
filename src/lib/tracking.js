/* ══════════════════════════════════════════════════════════════
   HASALA TRACKING — sends anonymous usage stats to Google Sheets
   NO financial data is sent. Only: counts, time, device, language.
   ══════════════════════════════════════════════════════════════ */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpM-49gQfDXwKYkyms38rwOJhHLJrV39gC4STt-JRx9o_WhrEPwYwBM3Cz8tMSkF9e/exec';
const STORAGE_KEY = 'hasala.tracker.v1';
function generateUserId() {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
}
function getMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const fresh = {
    userId: generateUserId(),
    firstSeen: Date.now(),
    sessions: 0,
    enabled: true,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch (e) { /* ignore */ }
  return fresh;
}
function saveMeta(meta) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ }
}
function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}
async function send(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.indexOf('YOUR_SCRIPT') !== -1) return;
  const meta = getMeta();
  if (!meta.enabled) return;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('[tracking] failed silently', e.message);
  }
}
let sessionStart = Date.now();
let lastSentMinute = 0;
let heartbeatTimer = null;
let currentState = null;
let currentLang = 'ar';
let beforeUnloadHandler = null;
export function initTracking(state, lang) {
  currentState = state;
  currentLang = lang;
  const meta = getMeta();
  const now = Date.now();
  const isNewSession = !meta.lastVisit || (now - meta.lastVisit) > 30 * 60 * 1000;
  meta.lastVisit = now;
  if (isNewSession) meta.sessions = (meta.sessions || 0) + 1;
  saveMeta(meta);
  sessionStart = now;
  sendCurrent(isNewSession, 'session_start');
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    sendCurrent(false, 'heartbeat');
  }, 60 * 1000);
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  }
  beforeUnloadHandler = () => sendCurrent(false, 'session_end');
  window.addEventListener('beforeunload', beforeUnloadHandler);
}
export function stopTracking() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
}
export function updateTrackingState(state) {
  currentState = state;
}
export function updateTrackingLang(lang) {
  currentLang = lang;
}
export function trackAction(actionName) {
  sendCurrent(false, actionName);
}
export function setTrackingEnabled(enabled) {
  const meta = getMeta();
  meta.enabled = enabled;
  saveMeta(meta);
}
export function isTrackingEnabled() {
  return getMeta().enabled !== false;
}
function sendCurrent(isNewSession, action) {
  if (!currentState) return;
  const sessionMinutes = Math.round((Date.now() - sessionStart) / 60000);
  if (action === 'heartbeat' && sessionMinutes === lastSentMinute) return;
  if (action === 'heartbeat') lastSentMinute = sessionMinutes;
  const payload = {
    userId: getMeta().userId,
    name: currentState.profile && currentState.profile.name ? currentState.profile.name : '',
    lang: currentLang,
    device: detectDevice(),
    isNewSession: isNewSession,
    sessionMinutes: sessionMinutes,
    transactions: currentState.transactions ? currentState.transactions.length : 0,
    goals: currentState.goals ? currentState.goals.length : 0,
    budgets: currentState.budgets ? currentState.budgets.length : 0,
    accounts: currentState.accounts ? currentState.accounts.length : 0,
    lastAction: action,
  };
  send(payload);
}