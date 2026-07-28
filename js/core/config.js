// ═══════════════════════════════════
// CONFIGURATION — ENVIRONMENTS (Supabase + Cloudinary)
// ═══════════════════════════════════
// NOTA DE SEGURETAT: les claus "anon" de Supabase estan dissenyades per ser
// exposades al client — la seguretat real recau en les Row Level Security (RLS)
// policies de Supabase, NO en amagar la clau.
// ─────────────────────────────────────────────────────────────────────────────
import { state } from './state.js';
import { showToast } from '../ui/toast.js';
import { logout, enterAsEmail } from '../screens/login.js';
import { loadAllData, loadAppTexts } from './data.js';
import { t, applyTranslations } from './i18n.js';

export const SUPABASE_CONFIGS = {
  normal: {
    url: 'https://ogqqcgbgcqowvywaolln.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXFjZ2JnY3Fvd3Z5d2FvbGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTYzNTIsImV4cCI6MjA4OTA3MjM1Mn0.f4JGoy2BQmir9veKMp_Fk1GqjMGGbMr4YMUK1iH9wfM',
  },
  test: {
    url: 'https://xxydxdsiunfwzkcffdai.supabase.co',   // ← substitueix per la URL del projecte test
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eWR4ZHNpdW5md3prY2ZmZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDQ5MDYsImV4cCI6MjA5NDMyMDkwNn0.OmI1ShqJe4v1__JpaCzh2nGcwqtNWns5TC45el6sFsw',   // ← substitueix per la anon key del projecte test
  },
};

// Estat del mode actiu — persisteix en localStorage (per no perdre-ho en recàrrega)
export let _dbMode = localStorage.getItem('femvotacions_dbmode') === 'test' ? 'test' : 'normal';

// Client Supabase actiu — es pot reassignar amb switchDbMode()
export let sb = null;

function _createSupabaseClient(mode) {
  const cfg = SUPABASE_CONFIGS[mode];
  if (!window.supabase || !window.supabase.createClient) return null;
  return window.supabase.createClient(cfg.url, cfg.key);
}

// Exportada perquè la pantalla de Textos pugui obrir un client puntual cap a
// l'entorn NO actiu (botó "Replica a les dues bases") sense tocar la sessió
// activa ni l'estat de l'app — és només un client JS nou, cap query pròpia.
export function getClientForMode(mode) {
  return _createSupabaseClient(mode);
}

sb = _createSupabaseClient(_dbMode);

if (!sb) {
  console.error('Supabase client failed to initialize. Check CDN script.');
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#ff6b6b;font-family:sans-serif;"><h2>❌ Error: Supabase no s\'ha carregat</h2><p>Comprova la connexió a internet i recarrega.</p></div>';
  });
}

// ── MODE SWITCH (Normal ↔ Test) ──────────────────────────────────────────────
// Canvia la base de dades activa, reinicia l'estat i torna al login.
// Impacte Supabase: 0 queries addicionals (només crea un nou client JS).
export async function switchDbMode(newMode) {
  if (newMode === _dbMode) return;
  if (newMode !== 'normal' && newMode !== 'test') return;

  // Guardem l'email actual ABANS de reiniciar l'estat (per a l'auto-login a Test)
  const prevEmail = (state.currentUser && state.currentUser.email) ? state.currentUser.email : null;

  _dbMode = newMode;
  localStorage.setItem('femvotacions_dbmode', _dbMode);

  // Recrea el client apuntant a la nova BD
  sb = _createSupabaseClient(_dbMode);

  // Torna a carregar els textos des de l'entorn nou (Normal i Test poden tenir
  // valors diferents a app_texts si s'han editat per separat) i repinta.
  try { await loadAppTexts(); applyTranslations(); } catch (_) {}

  // Reinicia estat en memòria (evita barrejar dades de les dues BD)
  state.users             = [];
  state.objectives        = [];
  state.photos            = [];
  state.votes             = [];
  state.settings          = { uploads_enabled: false, voting_enabled: false, namesRevealed: false, rankingHidden: false, force_hide_upload: false, force_hide_vote: false, force_hide_resultats: false, force_hide_classificacio: false };
  state.generalRanking    = {};
  state.currentObjective  = null;
  state.currentUser       = null;
  state.adminViewingAsParticipant = false;

  // Actualitza el botó i el segell visualment
  _updateDbModeButton();

  // AUTO-LOGIN només en anar a TEST (entorn de proves): si el mateix email existeix
  // a la BD de test, hi entrem directe sense demanar contrasenya. Tornar a NORMAL
  // (producció) sempre demana login per seguretat.
  if (newMode === 'test' && prevEmail) {
    try {
      await loadAllData();
      if (enterAsEmail(prevEmail)) {
        showToast(t('db_mode_changed').replace('{mode}', '🔴 ' + t('db_mode_test')), 'error');
        return;
      }
    } catch (e) {
      console.error('Auto-login a Test ha fallat, es demana login:', e);
    }
  }

  // Fallback (no s'ha trobat l'usuari a test) o tornada a Normal → login
  // await: logout() és asíncrona des del 28/07 (tanca també la sessió d'Auth).
  await logout();

  const modeLabel = _dbMode === 'test' ? ('🔴 ' + t('db_mode_test')) : ('🟢 ' + t('db_mode_normal'));
  showToast(t('db_mode_changed').replace('{mode}', modeLabel), _dbMode === 'test' ? 'error' : 'success');
}

// Mostra/amaga el segell "TEST" (indicador global, independent de la pantalla)
export function _updateTestStamp() {
  const stamp = document.getElementById('test-stamp');
  if (!stamp) return;
  stamp.textContent = t('test_stamp_label');
  stamp.style.display = _dbMode === 'test' ? 'flex' : 'none';
}

export function _updateDbModeButton() {
  _updateTestStamp();
  // Actualiza todos los botones Normal/Test (cabecera + card del panel de control)
  const btns = document.querySelectorAll('.db-mode-btn');
  btns.forEach(btn => {
    if (_dbMode === 'test') {
      btn.textContent       = t('db_mode_test');
      btn.style.background   = 'rgba(255,59,48,0.15)';
      btn.style.borderColor  = 'rgba(255,59,48,0.5)';
      btn.style.color        = '#ff3b30';
    } else {
      btn.textContent       = t('db_mode_normal');
      btn.style.background   = 'rgba(52,199,89,0.15)';
      btn.style.borderColor  = 'rgba(52,199,89,0.5)';
      btn.style.color        = '#34c759';
    }
  });
}

export const CLOUDINARY_CLOUD  = 'dz1n0g9yg';
export const CLOUDINARY_PRESET = 'Fem_Apps';
export const CLOUDINARY_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

window.switchDbMode = switchDbMode;
// Exposats via window perquè applyTranslations() (i18n.js) els pugui refrescar
// en canviar d'idioma sense crear un import circular config.js ↔ i18n.js.
window._updateDbModeButton = _updateDbModeButton;
window._updateTestStamp    = _updateTestStamp;
