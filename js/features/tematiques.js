// ═══════════════════════════════════
// REPTES — lista, finalización y CRUD (sin DELETE desde UI)
// (Nom del fitxer, tematiques.js, encara sense renombrar — pendent, vegeu CHANGELOG/tasca)
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { t, applyTranslations } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from '../ui/toast.js';
import { confirmAction, openModal, closeModal } from '../ui/modals.js';
import { saveObjectives, saveSettings, getActiveAllPhotos, getVotingProgress } from '../core/data.js';
import { getPhotoScore, assignPositionPoints, renderRanking } from './ranking.js';
import { renderAdminGallery, compressImage } from './fotos.js';
import { updateVoteButtonsState } from './votacio.js';
import { refreshAdminDashboard } from '../screens/admin.js';
import { getActiveCalendar } from './calendari.js';
import { CLOUDINARY_PRESET, CLOUDINARY_URL, _dbMode } from '../core/config.js';

// FASE 4/5 (pla multi-repte, FEM_reptes.md — FET, 2026-07-17): cada targeta
// de repte gestiona ara ella mateixa la seva pujada i votació, amb 2
// desplegables de mode (calendari/obert/tancat, un per fase) i 4 camps de
// data natius (<input type="date">). Substitueix els vells masters globals
// (botons de plàstic al Panell de Control) i la card "Calendari" global —
// ambdues retirades (punt 1 del pla, ara efectiu).
// Reptes FINALITZATS (revisat 2026-07-18): mateixa targeta i mateixos camps
// que un repte actiu — es veuen tots (desplegables i dates), però `disabled`
// (mateix criteri que "Eliminar i Tornar a Pujar"/peu de foto quan la pujada
// és tancada: visible, no amagat, però no es pot tocar).
export function renderObjectivesList() {
  const el = document.getElementById('objectives-list');
  if (state.objectives.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>${t('no_objectives')}</p></div>`;
    return;
  }
  // Ordre descendent per data de creació del repte (2026-07-18, petició
  // Pablo): el repte vigent (sempre el més recent) surt a dalt de tot, sense
  // haver de fer scroll — cada cop hi haurà més reptes a la llista. Es
  // construeix una còpia ordenada NOMÉS per pintar; state.objectives es
  // queda tal qual (cap altra funció en depèn de l'ordre).
  const sortedObjectives = [...state.objectives]
    .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
  el.innerHTML = sortedObjectives.map(obj => {
    const isActive   = obj.status === 'active';
    const isFinished = obj.status === 'finished';
    const statusBadge = isActive
      ? `<span class="badge badge-green">● ${t("active_badge")}</span>`
      : isFinished
        ? `<span class="badge badge-gray">✓ ${t("finished_badge")}</span>`
        : `<span class="badge badge-yellow">${t("inactive_badge")}</span>`;
    const finalizeBtn = isActive
      ? `<button type="button" class="btn btn-danger btn-sm" onclick="finalizeObjective('${obj.id}')">${t("finalize_btn")}</button>`
      : '';
    const editBtn = !isFinished
      ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openObjectiveModal('${obj.id}')">${t("edit_btn")}</button>`
      : '';

    const cal = getActiveCalendar(obj.id) || {};
    const uploadMode = cal.uploadMode || 'calendari';
    const votingMode = cal.votingMode || 'calendari';
    const photosCount = getActiveAllPhotos(obj.id).length;
    const votesCount  = getVotingProgress(obj.id).voted;
    // Estat EFECTIU d'avui (ja recalculat per applyPhaseModes/
    // applyAllActiveCalendars en carregar la pantalla i en cada canvi): amb
    // mode 'obert'/'tancat' sempre coincideix amb el mode; amb 'calendari'
    // depèn de si avui cau dins del rang de dates. El color del desplegable
    // segueix aquest booleà EFECTIU (no el mode triat) — decisió revisada
    // 2026-07-18: "quan es selecciona Calendari, el text també es mostri en
    // vermell o en verd segons si avui està dins (verd) o fora (vermell)".
    const uploadEffective = !!obj.uploads_enabled;
    const votingEffective = !!obj.voting_enabled;
    const locked = isFinished;   // repte finalitzat: camps visibles però disabled

    // El desplegable de mode es dibuixa amb l'etiqueta "Control" i el mateix
    // aspecte (alçada/vora/mida) que els camps de data del costat.
    const modeField = (phase, value, effective) => `
      <label class="obj-date-field">
        <span>${t('phase_control_label')}</span>
        <select class="obj-mode-select ${effective ? 'eff-open' : 'eff-closed'}" ${locked ? 'disabled' : ''}
                onchange="setPhaseMode('${obj.id}','${phase}',this.value);">
          <option value="calendari" ${value === 'calendari' ? 'selected' : ''}>${t('mode_option_calendari')}</option>
          <option value="obert" ${value === 'obert' ? 'selected' : ''}>${t('mode_option_obert')}</option>
          <option value="tancat" ${value === 'tancat' ? 'selected' : ''}>${t('mode_option_tancat')}</option>
        </select>
      </label>`;

    const dateField = (label, field, value) => `
      <label class="obj-date-field">
        <span>${label}</span>
        <input type="date" value="${value || ''}" ${locked ? 'disabled' : ''} onchange="updateCalendarDate('${obj.id}','${field}',this.value)">
      </label>`;

    // Cada fase (Pujada / Votació) agrupada en una única capsa fina:
    // 1a línia "Etiqueta - n fotos/vots" en un sol text; 2a línia el
    // desplegable de mode (etiquetat "Control") i les seves 2 dates, tots
    // tres amb el mateix aspecte de camp.
    const phaseBox = (phase, label, mode, effective, count, startField, startLabel, startVal, endField, endLabel, endVal) => `
      <div class="obj-phase-box">
        <div class="obj-phase-box-header">${label} - ${count}</div>
        <div class="obj-phase-controls">
          ${modeField(phase, mode, effective)}
          ${dateField(startLabel, startField, startVal)}
          ${dateField(endLabel,   endField,   endVal)}
        </div>
      </div>`;

    return `
    <div class="objective-card${locked ? ' objective-card-locked' : ''}">
      <div class="obj-row obj-row-main">
        <div class="obj-info">
          <div class="obj-title">${obj.title}</div>
          <div class="obj-desc">${obj.description || ''}</div>
        </div>
        ${statusBadge}
        ${editBtn}
        ${finalizeBtn}
      </div>
      <div class="obj-row obj-row-phases">
        ${phaseBox('upload', t('cal_upload_label'), uploadMode, uploadEffective,
                    t('photos_uploaded_count').replace('{n}', photosCount),
                    'uploadStart', t('date_upload_start_label'), cal.uploadStart,
                    'uploadEnd',   t('date_upload_end_label'),   cal.uploadEnd)}
        ${phaseBox('voting', t('cal_voting_label'), votingMode, votingEffective,
                    t('votes_received_count').replace('{n}', votesCount),
                    'votingStart', t('date_voting_start_label'), cal.votingStart,
                    'votingEnd',   t('date_voting_end_label'),   cal.votingEnd)}
      </div>
    </div>`;
  }).join('');
  // Re-apply translations to newly rendered elements
  applyTranslations();
}

export async function finalizeObjective(id) {
  confirmAction(
    t('confirm_finalize_title'),
    t('confirm_finalize_msg'),
    async () => {
      showLoader(t('finalizing_objective'));
      const obj = state.objectives.find(o => o.id === id);
      if (!obj) { hideLoader(); return; }

      // 1. CALCULAR POSICIONS I GUARDAR PUNTS AL RÀNQUING GLOBAL
      const rankedPhotos = state.publishedPhotos
        .map(photo => ({ photo, score: getPhotoScore(photo.id) }))
        .sort((a, b) => b.score - a.score);
      const withPoints = assignPositionPoints(rankedPhotos);

      for (const { photo, points } of withPoints) {
        const userId = photo.userId;
        if (!state.generalRanking[userId]) {
          state.generalRanking[userId] = { totalScore: 0, participations: 0 };
        }
        state.generalRanking[userId].totalScore += points;
        state.generalRanking[userId].participations += 1;
      }

      // 2. Marcar temática como finalizada
      obj.status = 'finished';
      obj.end_date = new Date().toISOString().split('T')[0];
      // FASE 2: el repte finalitzat també tanca els seus propis flags (font de
      // veritat des d'ara), no només el mirall global.
      obj.uploads_enabled = false;
      obj.voting_enabled  = false;
      state.currentObjective = null;
      await saveObjectives();

      // 3. Desactivar uploads y voting (mirall global — la resta de pantalles
      // encara el llegeixen; sense repte actiu, tot false és correcte)
      state.settings.uploads_enabled = false;
      state.settings.voting_enabled  = false;
      state.settings.namesRevealed   = false;
      await saveSettings(); // Esto también guarda el generalRanking
      // FASE 4/5: els vells checkboxes globals #toggle-upload/#toggle-voting
      // ja no existeixen (retirats amb la card "Controls" del Panell de
      // Control) — l'estat es reflecteix ara als desplegables de cada
      // targeta de repte, repintats per renderObjectivesList() més avall.

      // 4. Limpiar estado local (els registres es conserven a Supabase per historial)
      state.photos = [];
      state.publishedPhotos = [];
      state.votes = [];
      state.selectedPhotos = new Set();

      // 6. Refrescar UI
      renderObjectivesList();
      renderAdminGallery();
      refreshAdminDashboard();
      renderRanking('ranking-current-list', 'ranking-general-list');
      updateVoteButtonsState();
      hideLoader();
      showToast(t("objective_finalized"), "success");
    }
  );
}

export function openObjectiveModal(id) {
  document.getElementById('obj-edit-id').value = id || '';
  if (id) {
    const obj = state.objectives.find(o => o.id === id);
    document.getElementById('obj-modal-title').textContent = t('edit_objective_title');
    document.getElementById('obj-title').value  = obj.title;
    document.getElementById('obj-desc').value   = obj.description;
    document.getElementById('obj-status').value = obj.status;
    document.getElementById('obj-cover-url').value = obj.coverImageUrl || '';
    _renderObjCoverPreview(obj.coverImageUrl || '');
  } else {
    document.getElementById('obj-modal-title').textContent = t('new_objective_btn');
    document.getElementById('obj-title').value  = '';
    document.getElementById('obj-desc').value   = '';
    document.getElementById('obj-status').value = 'active';
    document.getElementById('obj-cover-url').value = '';
    _renderObjCoverPreview('');
  }
  openModal('modal-objective');
}

// ═══════════════════════════════════
// IMATGE DE FONS DEL REPTE (box "Repte / Foto pujada", 2026-07-24)
// ═══════════════════════════════════
// Puja/treu la preview del modal segons hi hagi o no URL de cover desada.
function _renderObjCoverPreview(url) {
  const prevEl = document.getElementById('obj-cover-preview');
  const rmBtn  = document.getElementById('btn-remove-cover');
  if (!prevEl) return;
  if (url) {
    prevEl.innerHTML = `<img src="${url}" alt="">`;
    prevEl.classList.remove('hidden');
    if (rmBtn) rmBtn.classList.remove('hidden');
  } else {
    prevEl.innerHTML = '';
    prevEl.classList.add('hidden');
    if (rmBtn) rmBtn.classList.add('hidden');
  }
}

// Selecció d'imatge de fons al modal de repte: comprimeix (mida de banner,
// no cal la resolució completa d'una foto de concurs) i puja directament a
// Cloudinary — mateix flux que uploadPhoto() (fotos.js) però sense pas
// intermedi de "preview abans de confirmar": el repte encara no s'ha desat,
// així que la URL només queda efectiva quan es prem "Guardar" (saveObjective()
// la llegeix de #obj-cover-url).
export async function handleObjectiveCoverSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast(t('select_valid_image'), 'error'); return; }

  showLoader(t('uploading'));
  try {
    const fileToUpload = await compressImage(file, 1600, 1600, 0.85);

    if (!CLOUDINARY_PRESET || CLOUDINARY_PRESET === 'YOUR_PRESET') {
      throw new Error('Cloudinary upload preset not configured');
    }
    const formData = new FormData();
    formData.append('file',          fileToUpload);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    const baseFolder = _dbMode === 'test' ? 'FemReptes_TEST' : 'FemReptes';
    formData.append('folder', baseFolder + '/_cover_reptes');

    const res  = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) throw new Error('Cloudinary: ' + data.error.message);
    if (!data.secure_url) throw new Error('Resposta inesperada de Cloudinary');

    document.getElementById('obj-cover-url').value = data.secure_url;
    _renderObjCoverPreview(data.secure_url);
    hideLoader();
  } catch (err) {
    hideLoader();
    console.error('Cover image upload error:', err);
    showToast(t('upload_error_generic'), 'error');
  } finally {
    // Permet re-seleccionar el mateix fitxer si cal tornar-ho a intentar
    e.target.value = '';
  }
}

export function removeObjectiveCover() {
  document.getElementById('obj-cover-url').value = '';
  _renderObjCoverPreview('');
}

export async function saveObjective() {
  const id            = document.getElementById('obj-edit-id').value;
  const title         = document.getElementById('obj-title').value.trim();
  const description   = document.getElementById('obj-desc').value.trim();
  const status        = document.getElementById('obj-status').value;
  const coverImageUrl = document.getElementById('obj-cover-url').value.trim();

  if (!title) { showToast(t('title_required'), 'error'); return; }

  // FASE 2 (pla multi-repte, FEM_reptes.md — FET): ja no es bloqueja crear un
  // repte nou si n'hi ha un altre actiu o no finalitzat. Abans hi havia aquí
  // un bloqueig ("objective_already_active"/"objective_not_finished") que
  // limitava l'app a un sol repte actiu a la vegada; es retira a propòsit.
  //
  // FASE 4/5 (FET): cada repte actiu ja té la seva pròpia targeta amb
  // desplegables de mode i dates (renderObjectivesList) i el seu propi
  // calendari (reptes_calendari, per objective_id) — dos reptes actius a la
  // vegada ja es gestionen de manera independent. Únic punt encara pendent
  // (Fase 6): el costat participant només mostra la targeta de pujada/
  // mosaic de votació del PRIMER repte actiu que troba
  // (`state.currentObjective`); amb 2+ reptes actius, els socis només
  // interactuen amb el primer fins que la Fase 6 repeteixi aquell bloc per
  // cada repte actiu.

  if (id) {
    // Editing existing: only update title, description and cover image, keep status unchanged
    const obj = state.objectives.find(o => o.id === id);
    if (obj) { obj.title = title; obj.description = description; obj.coverImageUrl = coverImageUrl; }
  } else {
    // New objective is always created as active
    state.objectives.push({
      id: 'obj_' + Date.now(), title, description, status: 'active',
      uploads_enabled: false, voting_enabled: false,
      start_date: new Date().toISOString().split('T')[0], end_date: '',
      created_by: state.currentUser.id,
      coverImageUrl,
    });
  }

  state.currentObjective = state.objectives.find(o => o.status === 'active') || null;
  await saveObjectives();
  closeModal('modal-objective');
  renderObjectivesList();
  refreshAdminDashboard();
  showToast(t('objective_saved'), 'success');
}

// Exponer en window las funciones usadas desde onclick del HTML
window.renderObjectivesList = renderObjectivesList;
window.finalizeObjective = finalizeObjective;
window.openObjectiveModal = openObjectiveModal;
window.saveObjective = saveObjective;
window.handleObjectiveCoverSelect = handleObjectiveCoverSelect;
window.removeObjectiveCover = removeObjectiveCover;
