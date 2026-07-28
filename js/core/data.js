// ═══════════════════════════════════
// SUPABASE DATA LAYER — carga, guardado y filtros por temática activa
// ═══════════════════════════════════
import { state, _localVoteEdits } from './state.js';
import { sb } from './config.js';
import { showToast } from '../ui/toast.js';
import { mergeTranslations } from './i18n.js';

// ═══════════════════════════════════
// TEXTOS DE LA INTERFÍCIE (app_texts, Fase 2 d'i18n)
// ═══════════════════════════════════
// Fetch separat de loadAllData(): els textos gairebé mai canvien, mentre que
// loadAllData() es crida molt sovint (cada pujada de foto, cada canvi de
// soci, l'auto-refresh...). Barrejar-ho tot allà voldria dir re-descarregar
// ~30KB de traduccions en cada refresc trivial. Es crida un cop a l'arrencada
// (login.js:init) i en canviar d'entorn (config.js:switchDbMode).
// Si Supabase no respon o la taula encara no existeix, l'app es queda amb
// el diccionari estàtic de i18n.js — no es trenca res.
// Totes les fotos d'aquesta app passen per compressImage() (fotos.js), que
// sempre les redibuixa a un <canvas> abans de pujar-les — els píxels
// resultants ja surten "de peu" independentment del tag EXIF Orientation
// original. Fotos pujades abans del fix d'Orientation a compressImage()
// (vegeu fotos.js) van quedar amb els píxels correctes però l'Orientation
// EXIF antic re-injectat, fent que Cloudinary/els navegadors les tornessin a
// girar per sobre. Afegint el flag `a_ignore` a la URL de lliurament de
// Cloudinary li diem que mai apliqui rotació pròpia — és segur fer-ho sempre
// per a totes les fotos d'aquesta app (noves i antigues), perquè cap depèn
// de l'EXIF per mostrar-se correctament.
function _noAutoRotateUrl(url) {
  if (!url) return url;
  return url.includes('/image/upload/a_ignore/')
    ? url
    : url.replace('/image/upload/', '/image/upload/a_ignore/');
}

export async function loadAppTexts() {
  try {
    const { data, error } = await sb.from('app_texts').select('lang,content');
    if (error || !data) {
      console.warn('loadAppTexts: sense resposta de Supabase, es fa servir el diccionari estàtic.', error);
      return;
    }
    data.forEach(row => mergeTranslations(row.lang, row.content));
  } catch (e) {
    console.warn('loadAppTexts: error de connexió, es fa servir el diccionari estàtic.', e);
  }
}

export async function loadAllData() {
  const results = await Promise.all([
    // `password` RETIRAT d'aquesta consulta (2026-07-28). El client ja no pot
    // llegir aquesta columna: es va revocar el SELECT per a anon/authenticated
    // el 26/07/2026 (FEM-Foto, sql/2026-07-26_login_seguretat_fem_login.sql) i
    // demanar-la feia fallar TOTA la càrrega amb "permission denied for table
    // users" — l'app es quedava sense dades i mostrava "Primera configuració".
    // La comprovació de contrasenya ara la fa el servidor: Supabase Auth i,
    // com a reserva, la RPC fem_login(). Vegeu handleLogin() a login.js.
    sb.from('users').select('id,display_name,email,role,created_at').order('id', { ascending: true }),
    // names_revealed afegit a la Fase 2 (multi-repte): vegeu FEM_reptes.md.
    // uploads_enabled/voting_enabled ja existien a la taula però eren lletra
    // morta fins la Fase 2 — ara SÍ que en depèn el mirall de state.settings.
    // cal_upload_start/end, cal_voting_start/end, upload_mode, voting_mode:
    // absorbits des de la taula `reptes_calendari` (eliminada) — Racionalització
    // BD 2026-07, vegeu Diagnostic_objectives_reptes_calendari.md. Abans calia
    // una segona consulta a part (`reptes_calendari`); ara tot un repte viu en
    // una sola fila d'`objectives`.
    // cover_image_url afegit (2026-07-24): imatge de fons de la capçalera del
    // repte, box "Repte / Foto pujada" (costat participant). Opcional.
    sb.from('objectives').select('id,name,description,status,uploads_enabled,voting_enabled,names_revealed,start_date,end_date,created_by,cal_upload_start,cal_upload_end,cal_voting_start,cal_voting_end,upload_mode,voting_mode,cover_image_url'),
    sb.from('photo_submissions').select('id,user_id,objective_id,file_name,file_url,original_url,file_size,published,revealed,submitted_at,caption'),
    sb.from('votes').select('id,user_id,photo_id,objective_id,creativity,theme,composition'),
    sb.from('app_settings').select('key,value'),
    sb.from('seguiment_votacio').select('user_id,objective_id,es_esborrany,submitted_at'),
  ]);

  // Check for connection errors
  const firstError = results.find(r => r.error);
  if (firstError) {
    console.error('Supabase loadAllData error:', firstError.error);
    showToast('❌ Error connectant amb Supabase: ' + (firstError.error.message || 'Comprova la URL i la clau.'), 'error');
    return;
  }

  const [usersRes, objectivesRes, photosRes, votesRes, settingsRes, seguimentRes] = results;
  const usersRaw      = usersRes.data || [];
  const objectivesRaw = objectivesRes.data || [];
  const photosRaw     = photosRes.data || [];
  const votesRaw      = votesRes.data || [];
  const settingsRaw   = settingsRes.data || [];
  const seguimentRaw  = seguimentRes.data || [];

  // ── Voting status (seguiment_votacio) → map keyed by `${userId}__${objectiveId}`
  state.submittedVoting = {};
  seguimentRaw.forEach(s => {
    const key = `${s.user_id}__${s.objective_id}`;
    state.submittedVoting[key] = {
      es_esborrany: s.es_esborrany,
      submitted_at: s.submitted_at,
    };
  });

  // ── Users
  state.users = (usersRaw || []).map(u => ({
    id:       String(u.id || ''),
    name:     u.display_name || '',
    email:    u.email || '',
    username: u.email || '',
    // password: ja no arriba de la BD (vegeu la consulta de loadAllData) i
    // per tant NO existeix a state.users. Qualsevol codi que el vulgui
    // comparar o mostrar està trencat per disseny: la contrasenya només la
    // pot validar el servidor.
    role:     u.role || 'participant',
    created_at: u.created_at || '',
  }));

  // ── Objectives
  // uploadStart/uploadEnd/votingStart/votingEnd/uploadMode/votingMode:
  // absorbits des de `reptes_calendari` (Racionalització BD 2026-07). Es
  // mantenen aquests noms de camp a `state` (no els de la columna, cal_...)
  // perquè calendari.js/tematiques.js no s'hagin de tocar — mateixa forma
  // que abans donava `getActiveCalendar()`.
  state.objectives = (objectivesRaw || []).map(o => ({
    id:              String(o.id || ''),
    title:           o.name || '',
    description:     o.description || '',
    status:          o.status || 'inactive',
    uploads_enabled: !!o.uploads_enabled,
    voting_enabled:  !!o.voting_enabled,
    names_revealed:  !!o.names_revealed,
    start_date:      o.start_date || '',
    end_date:        o.end_date || '',
    created_by:      o.created_by || '',
    uploadStart:     o.cal_upload_start || '',
    uploadEnd:       o.cal_upload_end   || '',
    votingStart:     o.cal_voting_start || '',
    votingEnd:       o.cal_voting_end   || '',
    uploadMode:      o.upload_mode || 'calendari',
    votingMode:      o.voting_mode || 'calendari',
    coverImageUrl:   o.cover_image_url || '',
  }));

  // ── Photos
  const allPhotos = (photosRaw || []).map(p => ({
    id:           String(p.id || ''),
    userId:       String(p.user_id || ''),
    objectiveId:  String(p.objective_id || ''),
    fileName:     p.file_name || '',
    url:          _noAutoRotateUrl(p.file_url || ''),
    originalUrl:  _noAutoRotateUrl(p.original_url || p.file_url || ''),
    fileSize:     p.file_size || '',
    published:    !!p.published,
    revealed:     !!p.revealed,
    submitted_at: p.submitted_at || '',
    caption:      p.caption || '',
  }));
  state.photos          = allPhotos.filter(p => !p.published);
  state.publishedPhotos = allPhotos.filter(p => p.published);

  // ── Votes
  state.votes = (votesRaw || []).map(v => ({
    id:          String(v.id || ''),
    userId:      String(v.user_id || ''),
    photoId:     String(v.photo_id || ''),
    objectiveId: String(v.objective_id || ''),
    creativity:  parseInt(v.creativity) || 0,
    theme:       parseInt(v.theme) || 0,
    composition: parseInt(v.composition) || 0,
    created_at:  v.created_at || '',
  }));

  // ── Re-apply any unsaved local vote edits on top of fresh data
  if (window._hasUnsavedVotes && state.currentUser) {
    const uid = state.currentUser.id;
    for (const [photoId, edits] of Object.entries(_localVoteEdits)) {
      let vote = state.votes.find(v => v.photoId === photoId && v.userId === uid);
      if (!vote) {
        vote = {
          id:          'v_' + Date.now() + '_' + Math.random().toString(36).slice(2),
          userId:      uid,
          photoId,
          objectiveId: state.currentObjective ? state.currentObjective.id : '',
          creativity:  0, theme: 0, composition: 0,
          created_at:  new Date().toISOString(),
        };
        state.votes.push(vote);
      }
      if (edits.creativity !== undefined)  vote.creativity  = edits.creativity;
      if (edits.theme !== undefined)       vote.theme       = edits.theme;
      if (edits.composition !== undefined) vote.composition = edits.composition;
    }
  }

  // ── Settings
  const sRows = settingsRaw || [];
  const parseSetting = (key, def) => {
    const r = sRows.find(s => s.key === key);
    return r ? (r.value === 'true') : def;
  };
  const parseJSON = (key, def) => {
    const r = sRows.find(s => s.key === key);
    if (r && r.value) {
      try { return JSON.parse(r.value); } catch (e) { return def; }
    }
    return def;
  };
  // uploads_enabled/voting_enabled/namesRevealed: FONT DE VERITAT des de la
  // Fase 2 = el repte actiu (objectives.uploads_enabled/voting_enabled/
  // names_revealed), NO app_settings. Es calculen uns quants línies més avall,
  // un cop es coneix state.currentObjective (mirall — vegeu comentari allà).
  // Les claus d'app_settings 'uploads_enabled'/'voting_enabled'/'names_revealed'
  // queden com a residu de l'etapa pre-Fase 2: ja no s'hi llegeix res.
  state.settings = {
    rankingHidden:   parseSetting('ranking_hidden', false),
    force_hide_upload:        parseSetting('force_hide_upload', false),
    force_hide_vote:          parseSetting('force_hide_vote', false),
    force_hide_resultats:     parseSetting('force_hide_resultats', false),
    force_hide_classificacio: parseSetting('force_hide_classificacio', false),
  };
  state.generalRanking = parseJSON('general_ranking', {});

  // ── Active objective
  state.currentObjective = state.objectives.find(o => o.status === 'active') || null;

  // ── Mirall (Fase 2 — pla multi-repte, FEM_reptes.md): uploads_enabled/
  // voting_enabled/namesRevealed a `state.settings` es mantenen NOMÉS perquè
  // participant.js/votacio.js/fotos.js/router.js/ranking.js encara els
  // llegeixen d'aquí (no es toquen fins la Fase 3/6). El valor real viu al
  // repte actiu; sense repte actiu, tot està tancat/no revelat.
  state.settings.uploads_enabled = state.currentObjective ? !!state.currentObjective.uploads_enabled : false;
  state.settings.voting_enabled  = state.currentObjective ? !!state.currentObjective.voting_enabled  : false;
  state.settings.namesRevealed   = state.currentObjective ? !!state.currentObjective.names_revealed  : false;

  // Calendari de reptes: RACIONALITZACIÓ BD 2026-07 — `reptes_calendari` (taula
  // a part) ha quedat absorbida dins `objectives` (columnes cal_upload_start/
  // end, cal_voting_start/end, upload_mode, voting_mode). Ja no cal una
  // segona consulta aquí: state.objectives ja porta aquests camps (vegeu
  // mapeig més amunt). `state.reptesCalendari` es retira.
}

// ═══════════════════════════════════
// SAVE HELPERS — SUPABASE
// ═══════════════════════════════════
// ⚠️ Aquesta funció NO la crida ningú (comprovat 2026-07-28 a tot el js/).
// Es deixa perquè no es fa neteja enmig d'una restauració de servei, però
// se li ha tret `password`: state.users ja no en té, i escriure-hi
// `undefined` de cop per a tots els socis és jugar amb foc a la taula més
// delicada de l'app. Si algun dia es torna a fer servir, la contrasenya s'ha
// de canviar amb fem_admin_set_password(), mai amb un upsert d'aquesta taula.
export async function saveUsers() {
  const rows = state.users.map(u => ({
    id:           u.id,
    display_name: u.name,
    email:        u.email || u.username,
    role:         u.role,
    created_at:   u.created_at || new Date().toISOString(),
  }));
  const { error } = await sb.from('users').upsert(rows, { onConflict: 'id' });
  if (error) console.error('saveUsers error', error);
  return !error;
}

// Efficient single-user update (used by toggleRole, inlineEditName)
export async function updateUser(userId, fields) {
  const { error } = await sb.from('users').update(fields).eq('id', userId);
  if (error) console.error('updateUser error', error);
  return !error;
}

export async function saveObjectives() {
  const rows = state.objectives.map(o => ({
    id:              o.id,
    name:            o.title,
    description:     o.description,
    status:          o.status,
    uploads_enabled: !!o.uploads_enabled,
    voting_enabled:  !!o.voting_enabled,
    names_revealed:  !!o.names_revealed,
    start_date:      o.start_date || null,
    end_date:        o.end_date || null,
    created_by:      o.created_by || (state.currentUser ? state.currentUser.id : null),
    // Racionalització BD 2026-07: camps de calendari absorbits d'aquí (abans
    // vivien a `reptes_calendari`, taula retirada).
    cal_upload_start: o.uploadStart || null,
    cal_upload_end:   o.uploadEnd   || null,
    cal_voting_start: o.votingStart || null,
    cal_voting_end:   o.votingEnd   || null,
    upload_mode:      o.uploadMode  || 'calendari',
    voting_mode:      o.votingMode  || 'calendari',
    cover_image_url:  o.coverImageUrl || null,
  }));
  const { error } = await sb.from('objectives').upsert(rows, { onConflict: 'id' });
  if (error) console.error('saveObjectives error', error);
  return !error;
}

export async function saveVotes() {
  const uid = state.currentUser ? state.currentUser.id : null;
  if (!uid) return false;

  // Build the user's vote rows
  const myVoteRows = state.votes
    .filter(v => String(v.userId) === String(uid))
    .filter(v => v.creativity > 0 || v.theme > 0 || v.composition > 0)
    .map(v => ({
      id:           v.id,
      user_id:      v.userId,
      photo_id:     v.photoId,
      objective_id: v.objectiveId,
      creativity:   v.creativity,
      theme:        v.theme,
      composition:  v.composition,
      created_at:   v.created_at || new Date().toISOString(),
    }));

  // Delete this user's old votes for this objective, then insert fresh
  const objId = state.currentObjective ? state.currentObjective.id : null;
  if (objId) {
    await sb.from('votes').delete().eq('user_id', uid).eq('objective_id', objId);
  } else {
    await sb.from('votes').delete().eq('user_id', uid);
  }

  if (myVoteRows.length > 0) {
    const { error } = await sb.from('votes').insert(myVoteRows);
    if (error) { console.error('saveVotes insert error', error); return false; }
  }
  return true;
}

export async function saveSettings() {
  const updatedBy = state.currentUser ? state.currentUser.id : 'system';
  const now = new Date().toISOString();
  const rows = [
    { id: 'cfg_uploads',  key: 'uploads_enabled', value: String(state.settings.uploads_enabled),  updated_at: now, updated_by: updatedBy },
    { id: 'cfg_voting',   key: 'voting_enabled',  value: String(state.settings.voting_enabled),   updated_at: now, updated_by: updatedBy },
    { id: 'cfg_revealed', key: 'names_revealed',   value: String(state.settings.namesRevealed),    updated_at: now, updated_by: updatedBy },
    { id: 'cfg_ranking_hidden', key: 'ranking_hidden', value: String(state.settings.rankingHidden), updated_at: now, updated_by: updatedBy },
    { id: 'cfg_force_hide_upload',        key: 'force_hide_upload',        value: String(state.settings.force_hide_upload),        updated_at: now, updated_by: updatedBy },
    { id: 'cfg_force_hide_vote',          key: 'force_hide_vote',          value: String(state.settings.force_hide_vote),          updated_at: now, updated_by: updatedBy },
    { id: 'cfg_force_hide_resultats',     key: 'force_hide_resultats',     value: String(state.settings.force_hide_resultats),     updated_at: now, updated_by: updatedBy },
    { id: 'cfg_force_hide_classificacio', key: 'force_hide_classificacio', value: String(state.settings.force_hide_classificacio), updated_at: now, updated_by: updatedBy },
    { id: 'cfg_ranking',  key: 'general_ranking',  value: JSON.stringify(state.generalRanking),    updated_at: now, updated_by: updatedBy },
  ];
  const { error } = await sb.from('app_settings').upsert(rows, { onConflict: 'id' });
  if (error) console.error('saveSettings error', error);
  return !error;
}

// ── Filtrado por temática activa ─────────────────────────────────
// FASE 3 (pla multi-repte, FEM_reptes.md — FET): aquesta funció i
// getActivePublishedPhotos/getActiveAllPhotos/getActiveVotes/getVotingProgress
// de sota accepten ara un `objectiveId` explícit opcional. Si no se'n passa
// cap, mantenen el comportament d'abans (l'ÚNIC repte "actiu" global,
// state.currentObjective) — cap crida existent (admin.js, fotos.js,
// votacio.js, participant.js...) s'ha hagut de tocar. Això prepara el terreny
// perquè la Fase 4 pugui cridar-les amb l'id concret de cada targeta de
// repte quan n'hi hagi diverses alhora, sense trencar res d'avui.
export function getActiveObjectiveId() {
  return state.currentObjective ? state.currentObjective.id : null;
}
export function getActivePublishedPhotos(objectiveId) {
  const objId = objectiveId || getActiveObjectiveId();
  if (!objId) return [];
  return state.publishedPhotos.filter(p => p.objectiveId === objId);
}
export function getActiveAllPhotos(objectiveId) {
  // Publicadas + no publicadas, ambas filtradas por temática activa
  const objId = objectiveId || getActiveObjectiveId();
  if (!objId) return [];
  return [...state.photos, ...state.publishedPhotos].filter(p => p.objectiveId === objId);
}
export function getActiveVotes(objectiveId) {
  const objId = objectiveId || getActiveObjectiveId();
  if (!objId) return [];
  return state.votes.filter(v => v.objectiveId === objId);
}

// Progreso de votación por VOTANTES (temática, per defecte l'activa)
//   voted = socios que han enviado su votación definitiva (es_esborrany === false)
//   total = participantes (subieron foto) ∪ socios que enviaron definitiva
export function getVotingProgress(objectiveId) {
  const objId = objectiveId || getActiveObjectiveId();
  if (!objId) return { voted: 0, total: 0, pct: 0 };

  // Participantes: los que subieron foto a esta temática
  const uploaderIds = new Set(getActiveAllPhotos(objId).map(p => p.userId));

  // Votantes que enviaron definitiva (clave `${userId}__${objId}`, es_esborrany === false)
  const submitterIds = new Set(
    Object.entries(state.submittedVoting)
      .filter(([key, st]) => key.endsWith('__' + objId) && st && st.es_esborrany === false)
      .map(([key]) => key.slice(0, key.length - ('__' + objId).length))
  );

  const voterUniverse = new Set([...uploaderIds, ...submitterIds]);
  const total = voterUniverse.size;
  const voted = submitterIds.size;
  const pct   = total > 0 ? Math.round((voted / total) * 100) : 0;
  return { voted, total, pct };
}

// ═══════════════════════════════════
// PARTICIPANT NUMBER (anonymous) + helpers de usuario
// ═══════════════════════════════════
export function hasUserVoted(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return false;
  // Check if this user has at least one vote
  return state.votes.some(v => v.userId === userId);
}

export function getParticipantNumber(userId) {
  // Incluye a todos los usuarios (admin también participa)
  const idx = state.users.findIndex(u => u.id === userId);
  return idx >= 0 ? (idx + 1) : '?';
}

export function getDisplayName(userId) {
  if (state.settings.namesRevealed) {
    const u = state.users.find(u => u.id === userId);
    return u ? u.name : `Participant #${getParticipantNumber(userId)}`;
  }
  return `Participant #${getParticipantNumber(userId)}`;
}
