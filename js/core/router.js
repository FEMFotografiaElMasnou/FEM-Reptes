// ═══════════════════════════════════
// ROUTER — pantallas, navegación, modo BD y auto-refresh
// (hub de orquestación: importa renders de features/screens)
// ═══════════════════════════════════
import { state, actingAsAdmin } from './state.js';
import { sb, _dbMode, _updateDbModeButton, switchDbMode } from './config.js';
import { applyTranslations, t } from './i18n.js';
import { loadAllData } from './data.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal } from '../ui/modals.js';
import { renderRanking } from '../features/ranking.js';
import { renderAdminVotingGrid, renderVotingGrid } from '../features/votacio.js';
import { renderAdminGallery } from '../features/fotos.js';
import { renderMembersTable } from '../features/socis.js';
import { renderObjectivesList } from '../features/tematiques.js';
import { applyAllActiveCalendars } from '../features/calendari.js';
import { refreshAdminDashboard } from '../screens/admin.js';
import { refreshParticipantDashboard, showParticipantMain } from '../screens/participant.js';

// ── BOTTOM NAV HELPERS ──
export function setActiveNav(id) {
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

export function scrollToUpload() {
  setTimeout(() => {
    const el = document.getElementById('upload-section') || document.getElementById('upload-done-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ═══════════════════════════════════
// SCREENS
// ═══════════════════════════════════
export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

export function showAdminScreen() {
  startAutoRefresh();
  showScreen('admin');
  applyTranslations();
  _updateDbModeButton();
  document.getElementById('admin-username').textContent = state.currentUser.name;
  applyAllActiveCalendars();   // aplica mode+dates de cada repte actiu (Fase 4/5)
  refreshAdminDashboard();
  renderAdminGallery();
  renderAdminVotingGrid();
  renderObjectivesList();
  renderMembersTable();
  renderRanking('ranking-current-list', 'ranking-general-list');
  if (typeof window.renderTextsList === 'function') window.renderTextsList();
}

export function showParticipantScreen() {
  startAutoRefresh();
  showScreen('participant');
  applyTranslations();
  document.getElementById('participant-username').textContent = state.currentUser.name;
  // BUG corregit 2026-07-18: applyAllActiveCalendars() només es cridava des
  // de showAdminScreen()/_refreshUI() (branca admin) — un soci que entrés
  // sense que cap admin hagués obert el Panell de Control aquell dia es
  // quedava amb l'estat que hi hagués a la BD des de l'últim cop (persistit
  // per un admin o pel cron diari), no amb el que tocaria AVUI. Es recalcula
  // també aquí perquè cada soci vegi sempre l'estat correcte del SEU repte.
  applyAllActiveCalendars();

  const isAdminViewing = state.currentUser.role === 'admin' && state.adminViewingAsParticipant;
  const roleBadge  = document.getElementById('participant-role-badge');
  const logoutBtn  = document.getElementById('btn-participant-logout');
  const logoutX    = document.getElementById('btn-participant-logout-x');

  if (isAdminViewing) {
    roleBadge.textContent   = 'PARTICIPANT ⇄';
    roleBadge.className     = 'role-badge admin admin-toggle';
    roleBadge.onclick       = toggleAdminParticipantView;
    roleBadge.title         = 'Tornar al panell admin';
    roleBadge.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (logoutX)   logoutX.style.display   = 'flex';
  } else {
    roleBadge.textContent   = '';
    roleBadge.className     = 'role-badge';
    roleBadge.onclick       = null;
    roleBadge.title         = '';
    roleBadge.style.display = '';
    // Sense inline: mana el CSS (escriptori → "Sortir" de text; mòbil → la ✕ del media query)
    if (logoutBtn) logoutBtn.style.display = '';
    if (logoutX)   logoutX.style.display   = '';
  }

  showParticipantMain();
}

// ═══════════════════════════════════
// MODE BD + ADMIN ↔ PARTICIPANT VIEW TOGGLE
// ═══════════════════════════════════
export function toggleDbMode() {
  const next = _dbMode === 'normal' ? 'test' : 'normal';
  const modeLabel = next === 'test' ? (t('db_mode_test') + ' 🔴') : (t('db_mode_normal') + ' 🟢');
  // Confirm before switching — accidental switches could be confusing
  document.getElementById('confirm-title').textContent = t('confirm_switch_db_title');
  document.getElementById('confirm-msg').textContent   =
    t('confirm_switch_db_msg').replace('{mode}', modeLabel);
  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = t('confirm_switch_db_btn');
  const newBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newBtn, okBtn);
  newBtn.addEventListener('click', () => {
    closeModal('modal-confirm');
    switchDbMode(next);
  });
  openModal('modal-confirm');
}

export function toggleAdminParticipantView() {
  if (!state.currentUser || state.currentUser.role !== 'admin') return;

  if (!state.adminViewingAsParticipant) {
    // Switch to participant view
    state.adminViewingAsParticipant = true;
    showParticipantScreen();
    showToast('👁 Veient com a participant', 'info');
  } else {
    // Return to admin panel
    state.adminViewingAsParticipant = false;
    showAdminScreen();
    showToast('🔧 Tornat al panell admin', 'success');
  }
}

// ═══════════════════════════════════
// TAB SWITCHING (genérico, admin + participant)
// ═══════════════════════════════════
export function switchTab(group, tab) {
  const tabId = `${group}-tab-${tab}`;
  const content = document.getElementById(tabId);
  if (!content) return;
  content.parentElement.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  content.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${group}'`) && btn.getAttribute('onclick').includes(`'${tab}'`)) {
      btn.closest('.tab-nav').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
}

// ═══════════════════════════════════
// AUTO-REFRESH — Optimized light polling
// ═══════════════════════════════════
let autoRefreshTimer = null;
let _lastPollSignature = '';

export function startAutoRefresh() {
  stopAutoRefresh();
  // Build initial signature
  _lastPollSignature = _buildSignature();

  autoRefreshTimer = setInterval(async () => {
    if (!state.currentUser) return;

    try {
      // LIGHT POLL: only 2 small queries instead of 5 full SELECT *
      const [settingsRes, photosCountRes, votesCountRes] = await Promise.all([
        sb.from('app_settings').select('key,value'),
        sb.from('photo_submissions').select('id', { count: 'exact', head: true }),
        sb.from('votes').select('id', { count: 'exact', head: true }),
      ]);

      // Build a lightweight signature from the poll results
      const sRows = settingsRes.data || [];
      const getSetting = (k) => { const r = sRows.find(s => s.key === k); return r ? r.value : ''; };
      const newSig = [
        getSetting('uploads_enabled'),
        getSetting('voting_enabled'),
        getSetting('force_hide_upload'),
        getSetting('force_hide_vote'),
        getSetting('force_hide_resultats'),
        getSetting('force_hide_classificacio'),
        photosCountRes.count || 0,
        votesCountRes.count || 0,
      ].join('|');

      // Only do full reload if something actually changed
      if (newSig !== _lastPollSignature) {
        _lastPollSignature = newSig;
        await loadAllData();
        _refreshUI();
      }
    } catch (err) {
      console.warn('Auto-refresh poll error:', err);
    }
  }, 30000); // every 30 seconds (was 15s)
}

function _buildSignature() {
  return [
    String(state.settings.uploads_enabled),
    String(state.settings.voting_enabled),
    String(state.settings.force_hide_upload),
    String(state.settings.force_hide_vote),
    String(state.settings.force_hide_resultats),
    String(state.settings.force_hide_classificacio),
    state.photos.length + state.publishedPhotos.length,
    state.votes.length,
  ].join('|');
}

function _refreshUI() {
  if (!state.currentUser) return;
  if (actingAsAdmin()) {
    applyAllActiveCalendars();   // aplica mode+dates de cada repte actiu (Fase 4/5)
    refreshAdminDashboard();
    renderAdminGallery();
    if (!window._hasUnsavedVotes) renderAdminVotingGrid();
    renderRanking('ranking-current-list', 'ranking-general-list');
    renderMembersTable();
  } else {
    // Mateix fix que a showParticipantScreen(): recalcular abans de repintar,
    // no dependre només de l'últim valor persistit (per un admin o pel cron).
    applyAllActiveCalendars();
    refreshParticipantDashboard();
    applyTranslations();
    if (!window._hasUnsavedVotes) {
      const votingPanel = document.getElementById('participant-panel-voting');
      if (votingPanel && !votingPanel.classList.contains('hidden')) {
        renderVotingGrid('participant-voting-grid');
      }
    }
    const rankingPanel = document.getElementById('participant-panel-ranking');
    if (rankingPanel && !rankingPanel.classList.contains('hidden')) {
      renderRanking('p-ranking-current-list', 'p-ranking-general-list');
    }
    const mainPanel = document.getElementById('participant-panel-main');
    if (mainPanel && !mainPanel.classList.contains('hidden')) {
      showParticipantMain();
    }
  }
}

export function stopAutoRefresh() {
  if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
}

// Exponer en window las funciones usadas desde onclick del HTML
window.setActiveNav = setActiveNav;
window.scrollToUpload = scrollToUpload;
window.showScreen = showScreen;
window.showAdminScreen = showAdminScreen;
window.showParticipantScreen = showParticipantScreen;
window.toggleDbMode = toggleDbMode;
window.toggleAdminParticipantView = toggleAdminParticipantView;
window.switchTab = switchTab;
