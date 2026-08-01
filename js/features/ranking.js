// ═══════════════════════════════════
// RANKING — cálculo client-side y render
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { t } from '../core/i18n.js';
import { getActivePublishedPhotos, getDisplayName } from '../core/data.js';
import { openFullscreen } from '../ui/lightbox.js';

// ── Taula de punts per posició al rànquing global ───────────────
const POSITION_POINTS = [25, 18, 15, 12, 10, 8, 7, 6, 5, 4];

export function getPointsForPosition(position) {
  // position: 1-indexed
  if (position <= 10) return POSITION_POINTS[position - 1];
  // Posició 11 → 1.0099, 12 → 1.0098, 13 → 1.0097...
  const decimalOffset = (position - 10) / 10000; // 11→0.0001, 12→0.0002…
  return 1.01 - decimalOffset;
}

// Assigna punts de tabla a una llista ordenada de fotos amb score.
export function assignPositionPoints(rankedList) {
  const result = [];
  let lastAssignedPosition = 0;
  let previousScore = null;

  rankedList.forEach((item) => {
    let effectivePosition;
    if (previousScore !== null && item.score === previousScore) {
      // Empat: hereta la mateixa posició que l'anterior
      effectivePosition = lastAssignedPosition;
    } else {
      // No empat: posició consecutiva (no es salta encara que hi hagi hagut empats)
      effectivePosition = lastAssignedPosition + 1;
    }
    result.push({
      ...item,
      position: effectivePosition,
      points: getPointsForPosition(effectivePosition),
    });
    lastAssignedPosition = effectivePosition;
    previousScore = item.score;
  });

  return result;
}

// Format a 0–5 score with 2 decimals and Catalan comma (e.g. 4.2333 → "4,23")
export function formatScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return '0,00';
  return score.toFixed(2).replace('.', ',');
}

// Set de userIds que han ENVIAT (es_esborrany=false) en aquest repte, filtrat
// opcionalment per l'origen del vot:
//   'all'    → tothom que ha enviat (comportament original, sense filtrar)
//   'expert' → només usuaris amb role === 'expert'
//   'socis'  → tothom que NO és expert (participants i admins, és a dir "socis")
function _submittedUserIdsForScope(objectiveId, scope) {
  const ids = new Set();
  for (const [key, val] of Object.entries(state.submittedVoting || {})) {
    if (!val || val.es_esborrany !== false) continue;
    const sepIdx = key.lastIndexOf('__');
    if (sepIdx === -1) continue;
    const uid = key.slice(0, sepIdx);
    const oid = key.slice(sepIdx + 2);
    if (oid !== String(objectiveId)) continue;
    if (scope === 'all') { ids.add(uid); continue; }
    const u = state.users.find(x => x.id === uid);
    const isExpert = !!(u && u.role === 'expert');
    if (scope === 'expert' && isExpert) ids.add(uid);
    if (scope === 'socis' && !isExpert) ids.add(uid);
  }
  return ids;
}

// Hi ha algun expert que hagi enviat vot per aquest repte? Determina si té
// sentit mostrar el desglossament "Votació Expert / Vots Socis / Tots els Vots".
export function objectiveHasExpertVoting(objectiveId) {
  return _submittedUserIdsForScope(objectiveId, 'expert').size > 0;
}

export function getPhotoScoreBreakdown(photoId, scope = 'all') {
  // Desglossament de la puntuació d'una foto: mitja per criteri + nota final.
  // `scope` permet restringir el càlcul a un subconjunt de votants (vegeu
  // _submittedUserIdsForScope): 'all' (per defecte), 'expert' o 'socis'.
  const empty = { creativity: 0, theme: 0, composition: 0, final: 0 };

  // 1) Trobar la foto i el seu objectiveId (publicada o no: el repte actiu pot
  //    tenir fotos pujades encara no publicades, que l'admin també vol veure)
  const photo = state.publishedPhotos.find(p => p.id === photoId)
             || state.photos.find(p => p.id === photoId);
  if (!photo || !photo.objectiveId) return empty;
  const objectiveId = photo.objectiveId;

  // 2) Set de userIds que han ENVIAT (es_esborrany=false) en aquest repte,
  //    restringit a l'scope demanat.
  const submittedUserIds = _submittedUserIdsForScope(objectiveId, scope);

  const totalVotants = submittedUserIds.size;
  if (totalVotants === 0) return empty;

  // 3) Vots d'aquesta foto, només dels votants que han enviat
  const photoVotes = state.votes.filter(
    v => v.photoId === photoId && submittedUserIds.has(String(v.userId))
  );
  if (photoVotes.length === 0) return empty;

  // 4) Mitja per criteri: suma dels vots vàlids / total de votants del repte
  const avgCriterion = (key) => {
    const sum = photoVotes
      .filter(v => v[key] > 0)
      .reduce((acc, v) => acc + v[key], 0);
    return sum / totalVotants;
  };

  const creativity  = avgCriterion('creativity');
  const theme       = avgCriterion('theme');
  const composition = avgCriterion('composition');

  return { creativity, theme, composition, final: (creativity + theme + composition) / 3 };
}

export function getPhotoScore(photoId) {
  // Puntuació final d'una fotografia dins del repte (mitja de les 3 mitges de criteri).
  return getPhotoScoreBreakdown(photoId).final;
}

// Fotos que compten per a un repte concret:
//   · repte finalitzat → només les fotos que van concursar (publicades)
//   · repte no finalitzat (actual/inactiu, només visible per l'admin) → totes les
//     fotos pujades, encara que no estiguin publicades, per veure'n l'estat.
function _photoPoolForObjective(objId) {
  const obj = state.objectives.find(o => o.id === objId);
  const isFinished = !!(obj && obj.status === 'finished');
  return isFinished
    ? state.publishedPhotos.filter(p => p.objectiveId === objId)
    : [...state.publishedPhotos, ...state.photos].filter(p => p.objectiveId === objId);
}

// Rànquing detallat d'un repte concret (per id), ordenat per nota final.
export function computeRankingForObjective(objId) {
  return _photoPoolForObjective(objId)
    .map(photo => ({ photo, ...getPhotoScoreBreakdown(photo.id) }))
    .sort((a, b) => b.final - a.final);
}

// Rànquing d'un repte restringit a un scope de votants ('expert' | 'socis' | 'all'),
// amb posició assignada (1-indexada, empats hereten la mateixa posició).
function _rankingForObjectiveScoped(objId, scope) {
  const scored = _photoPoolForObjective(objId)
    .map(photo => ({ photo, ...getPhotoScoreBreakdown(photo.id, scope) }))
    .sort((a, b) => b.final - a.final);

  let lastPosition = 0;
  let previousScore = null;
  scored.forEach(item => {
    item.position = (previousScore !== null && item.final === previousScore)
      ? lastPosition
      : lastPosition + 1;
    lastPosition = item.position;
    previousScore = item.final;
  });
  return scored;
}

// Ordinal català curt per a posicions de rànquing (1r, 2n, 3r, 4t, 5è...).
export function formatPosition(position) {
  if (!position || position < 1) return '—';
  if (position === 1) return '1r';
  if (position === 2) return '2n';
  if (position === 3) return '3r';
  if (position === 4) return '4t';
  return position + 'è';
}

// Desglossament complet per a la cortineta de puntuació del visor de fotos:
// posició + nota (total i per criteri) en els tres blocs Expert/Socis/Tots.
// Retorna null si el repte de la foto no té cap vot d'expert (en aquest cas
// no s'ha de mostrar la cortineta ni el seu disparador).
export function getPhotoResultsBreakdown(photoId) {
  const photo = state.publishedPhotos.find(p => p.id === photoId)
             || state.photos.find(p => p.id === photoId);
  if (!photo || !photo.objectiveId) return null;
  const objectiveId = photo.objectiveId;
  if (!objectiveHasExpertVoting(objectiveId)) return null;

  const scopes = [
    { key: 'expert', labelKey: 'score_curtain_expert' },
    { key: 'socis',  labelKey: 'score_curtain_socis' },
    { key: 'all',    labelKey: 'score_curtain_all' },
  ];
  const blocks = scopes.map(({ key, labelKey }) => {
    const ranked = _rankingForObjectiveScoped(objectiveId, key);
    const entry = ranked.find(r => r.photo.id === photoId);
    return {
      key, labelKey,
      position:    entry ? entry.position    : null,
      creativity:  entry ? entry.creativity  : 0,
      theme:       entry ? entry.theme       : 0,
      composition: entry ? entry.composition : 0,
      final:       entry ? entry.final       : 0,
    };
  });
  return { objectiveId, blocks };
}

// Nom real de l'autor (els reptes finalitzats no són anònims; com a la galeria).
function _authorName(userId) {
  const u = state.users.find(x => x.id === userId);
  return (u && u.name) ? u.name : '—';
}

// Pinta el rànquing detallat (nota final + 3 criteris) d'un repte finalitzat.
export function renderResultatsRepte(objId, listId) {
  const el = document.getElementById(listId);
  if (!el) return;
  const ranked = computeRankingForObjective(objId);
  if (ranked.length === 0) {
    const msg = t('no_data_voting');
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>${msg}</p></div>`;
    return;
  }
  const rankNums = ['gold', 'silver', 'bronze'];

  // Llista per al visor a pantalla completa. `resultsMode:true` + `id` és el
  // que activa (a lightbox.js) el disparador ⭐ i la cortineta de puntuació —
  // per això NOMÉS aquesta pantalla (Resultats Repte) construeix la llista així;
  // la Galeria fa servir el mateix openFullscreen() però sense aquests camps.
  window._resultatsPhotosList = ranked.map(({ photo }) => ({
    url: photo.url, fileName: photo.fileName, author: _authorName(photo.userId),
    id: photo.id, resultsMode: true,
  }));

  el.innerHTML = ranked.map(({ photo, creativity, theme, composition, final }, idx) => `
    <div class="rank-item rank-item-detailed">
      <div class="rank-num ${rankNums[idx] || ''}">${idx + 1}</div>
      <img class="rank-thumb" src="${photo.url}" alt="" style="cursor:pointer;" onclick="openResultatsLightbox(${idx})">
      <div class="rank-info">
        <div class="rank-name">${_authorName(photo.userId)}</div>
        <div class="rank-criteria">
          <span>${t('creativity')} ${formatScore(creativity)}</span>
          <span>${t('composition')} ${formatScore(composition)}</span>
          <span>${t('theme')} ${formatScore(theme)}</span>
        </div>
      </div>
      <div class="rank-score">${formatScore(final)}</div>
    </div>
  `).join('');
}

// Obre el visor a pantalla completa des de la pantalla Resultats Repte.
export function openResultatsLightbox(index) {
  const photos = window._resultatsPhotosList || [];
  if (photos.length === 0) return;
  openFullscreen(photos[index].url, photos[index].fileName, photos, index);
}
window.openResultatsLightbox = openResultatsLightbox;

export function computeCurrentRanking() {
  // Solo fotos de la temática activa
  return getActivePublishedPhotos().map(photo => ({
    photo,
    score: getPhotoScore(photo.id),
  })).sort((a, b) => b.score - a.score);
}

export function computeGeneralRanking() {
  // El rànquing global només mostra punts ja acumulats al finalitzar reptes.
  return Object.entries(state.generalRanking)
    .map(([userId, data]) => {
      const user = state.users.find(u => u.id === userId);
      return {
        user: user || { name: t('unknown_user'), id: userId },
        participations: data.participations || 0,
        totalScore: data.totalScore || 0,
      };
    })
    .filter(g => g.participations > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function renderRanking(currentListId, generalListId) {
  const rankNums = ['gold','silver','bronze'];

  // Current
  const ranked   = computeCurrentRanking();
  const currentEl = document.getElementById(currentListId);
  if (currentEl) {
    if (ranked.length === 0) {
      currentEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>${t('no_data_voting')}</p></div>`;
    } else {
      currentEl.innerHTML = ranked.map(({ photo, score }, idx) => `
        <div class="rank-item">
          <div class="rank-num ${rankNums[idx]||''}">${idx+1}</div>
          <img class="rank-thumb" src="${photo.url}" alt="">
          <div class="rank-info">
            <div class="rank-name">${getDisplayName(photo.userId)}</div>
            <div class="rank-meta">${formatScore(score)} ${t('points_label')}</div>
          </div>
          <div class="rank-score">${formatScore(score)}</div>
        </div>
      `).join('');
    }
  }

  const general   = computeGeneralRanking();
  const generalEl = document.getElementById(generalListId);
  if (generalEl) {
    const active = general.filter(g => g.participations > 0);
    if (active.length === 0) {
      generalEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏅</div><p>${t('no_participations')}</p></div>`;
    } else {
      generalEl.innerHTML = active.map(({ user, participations, totalScore }, idx) => `
        <div class="rank-item">
          <div class="rank-num ${rankNums[idx]||''}">${idx+1}</div>
          <div class="rank-info">
            <div class="rank-name">${user.name}</div>
            <div class="rank-meta">${participations} ${t('participations')}</div>
          </div>
          <div class="rank-score">${Math.trunc(totalScore)}</div>
        </div>
      `).join('');
    }
  }
}

window.renderRanking = renderRanking;
