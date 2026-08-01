// ═══════════════════════════════════
// ESTADO GLOBAL — fuente única de verdad
// ═══════════════════════════════════
// `state` nunca se reasigna (solo se mutan sus propiedades), por eso se puede
// importar con seguridad desde cualquier módulo. Lo mismo para `_localVoteEdits`.
//
// `_hasUnsavedVotes` SÍ se reasigna desde votacio.js (módulo distinto al que lo
// declara). Como los `import` de ES son de solo lectura, vive en `window` para
// poder reasignarlo sin cambiar la lógica original (window._hasUnsavedVotes).

export const state = {
  currentUser:     null,
  users:           [],
  objectives:      [],
  photos:          [],          // not yet published
  publishedPhotos: [],
  votes:           [],          // raw vote rows from sheet
  settings:        { uploads_enabled: false, voting_enabled: false, force_hide_upload: false, force_hide_vote: false, force_hide_resultats: false, force_hide_classificacio: false },
  generalRanking:  {},          // { odorI : { odorScore: 0, participations: 0 }, ... }
  selectedPhotos:  new Set(),
  selectMode:      false,
  pendingFile:     null,
  // currentObjective: SINGULAR (model actual = un sol repte "active" que la
  // UI sap gestionar a la vegada). Fase 2 (FEM_reptes.md) ja permet que hi
  // hagi >1 repte amb status='active' a la BD, però aquest camp encara agafa
  // NOMÉS el primer que troba (state.objectives.find, a data.js/tematiques.js)
  // — la resta d'actius queden inerts (sense calendari/masters gestionables)
  // fins la Fase 3 (llista de reptes actius, no un de sol) i la Fase 4 (UI).
  currentObjective: null,
  // reptesCalendari RETIRAT (Racionalització BD 2026-07): els camps de
  // calendari (uploadStart/uploadEnd/votingStart/votingEnd/uploadMode/
  // votingMode) ara viuen directament a cada element de `objectives`
  // (vegeu data.js) — la taula `reptes_calendari` ha quedat absorbida.
  adminViewingAsParticipant: false,  // true when admin is browsing the participant view
  // ─── AUTOSAVE VOTING ─────────────────────────────────────────────
  // Map keyed by `${userId}__${objectiveId}` → { es_esborrany, submitted_at }
  // es_esborrany = true  → user can still vote
  // es_esborrany = false → user already submitted; voting locked for that objective
  submittedVoting: {},
};

// Flag: true when user has given stars but not yet saved.
// En window porque se reasigna desde votacio.js (otro módulo).
window._hasUnsavedVotes = false;

// Buffer: stores the user's local vote edits that haven't been saved yet
// Key: photoId, Value: { creativity, theme, composition }
export const _localVoteEdits = {};

// ¿El usuario MANDA como admin AHORA MISMO?
// Devuelve false cuando un admin está viendo la app "com a participant":
// en ese modo la vista debe comportarse EXACTAMENTE como la de un socio normal.
// Usar este helper (en vez de `currentUser.role === 'admin'`) en todo lo que
// afecte a la EXPERIENCIA de la pantalla participante.
export function actingAsAdmin() {
  return !!(state.currentUser
    && state.currentUser.role === 'admin'
    && !state.adminViewingAsParticipant);
}

// Exponer en window para los pocos accesos globales heredados (debug / consola)
window.state = state;
