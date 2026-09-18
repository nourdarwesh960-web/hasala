/* ══════════════════════════════════════════════════════════════
   HASALA SYNC — Google Sheets per-user backup
   - Auto-sync with debounce (5s after last change)
   - Manual load from cloud
   ══════════════════════════════════════════════════════════════ */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpM-49gQfDXwKYkyms38rwOJhHLJrV39gC4STt-JRx9o_WhrEPwYwBM3Cz8tMSkF9e/exec';
const SYNC_KEY = 'hasala.sync.v1';
function getSession() {
  try {
    const raw = localStorage.getItem('hasala.auth.v1');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function getSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastSync: null, lastError: null, enabled: true };
}
function saveSyncMeta(meta) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(meta)); } catch {}
}
async function callApi(payload) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'network', message: e.message };
  }
}
// ═══ Mute financial data — what we send ═══
function extractSyncPayload(state) {
  return {
    accounts: state.accounts || [],
    transactions: state.transactions || [],
    goals: state.goals || [],
    budgets: state.budgets || [],
    debts: state.debts || [],
    installments: state.installments || [],
    recurring: state.recurring || [],
    reminders: state.reminders || [],
    custodies: state.custodies || [],
    categories: state.categories || [],
  };
}
// ═══ Sync (upload to sheet) ═══
export async function syncToCloud(state) {
  const session = getSession();
  if (!session) return { ok: false, error: 'not_logged_in' };
  const meta = getSyncMeta();
  if (!meta.enabled) return { ok: false, error: 'disabled' };
  const data = extractSyncPayload(state);
  const result = await callApi({
    action: 'sync_data',
    userId: session.userId,
    email: session.email,
    name: session.name || '',
    data: data,
  });
  if (result.ok) {
    saveSyncMeta({ ...meta, lastSync: Date.now(), lastError: null });
  } else {
    saveSyncMeta({ ...meta, lastError: result.error });
  }
  return result;
}
// ═══ Load from cloud ═══
export async function loadFromCloud() {
  const session = getSession();
  if (!session) return { ok: false, error: 'not_logged_in' };
  const result = await callApi({
    action: 'load_data',
    userId: session.userId,
  });
  return result;
}
// ═══ Status ═══
export function getSyncStatus() {
  const meta = getSyncMeta();
  const session = getSession();
  return {
    enabled: meta.enabled,
    lastSync: meta.lastSync,
    lastError: meta.lastError,
    isLoggedIn: !!session,
  };
}
export function setSyncEnabled(enabled) {
  const meta = getSyncMeta();
  saveSyncMeta({ ...meta, enabled });
}
// ═══ Debounced auto-sync ═══
let syncTimer = null;
let lastSyncedState = null;
export function scheduleSync(state, onDone) {
  if (syncTimer) clearTimeout(syncTimer);
  // ما نبعثش نفس الحاجة مرتين
  const key = JSON.stringify(state).length + '_' + (state.transactions || []).length + '_' + (state.accounts || []).length;
  if (key === lastSyncedState) return;
  syncTimer = setTimeout(async () => {
    const result = await syncToCloud(state);
    if (result.ok) {
      lastSyncedState = key;
      if (onDone) onDone(result);
    }
    syncTimer = null;
  }, 5000);
}
export function cancelScheduledSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}