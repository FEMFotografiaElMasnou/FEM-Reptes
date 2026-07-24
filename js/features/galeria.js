// ═══════════════════════════════════
// GALERIA HISTÒRICA — fotos de reptes finalitzats, amb filtres repte/autor
// ═══════════════════════════════════
// Mostra fotos de reptes amb status 'finished'. L'admin (pel ROL real, encara
// que estigui "veient com a participant") veu a més el repte ACTUAL. Els socis
// només veuen els finalitzats. El visor a pantalla completa (lightbox) es reutilitza
// tal qual; aquí construïm la llista i el carrusel de la card.
//
// DESPLEGABLES EXCLOENTS: en triar un valor concret en un, l'altre torna a 'all'.
// Com que cada soci puja UNA sola foto per repte, mai coincideixen repte+autor
// concrets, així que no hi ha capçaleres de grup; sempre una sola graella.
import { state } from '../core/state.js';
import { t } from '../core/i18n.js';
import { openFullscreen } from '../ui/lightbox.js';

// Estat dels filtres (àmbit de mòdul). 'all' = tots.
let _galFilterObj    = 'all';
let _galFilterAuthor = 'all';

// Data d'un repte per ordenar cronològicament (tancament > inici > id)
function _objDate(obj) {
  return obj.end_date || obj.start_date || '';
}

// Nom de l'autor a partir del seu id
function _authorName(userId) {
  const u = state.users.find(x => x.id === userId);
  return (u && u.name) ? u.name : '—';
}

// ¿Qui mira és admin pel ROL real? (no per actingAsAdmin, que és false en mode
// "veure com a participant"). Volem que l'admin vegi el repte actual igualment.
function _isAdminRole() {
  return !!(state.currentUser && state.currentUser.role === 'admin');
}

// Ids dels reptes visibles a la galeria segons el rol:
//  · soci  → només 'finished'
//  · admin → 'finished' + el repte ACTUAL (state.currentObjective)
function _visibleObjectiveIds() {
  const ids = new Set(
    state.objectives.filter(o => o.status === 'finished').map(o => o.id)
  );
  if (_isAdminRole() && state.currentObjective) ids.add(state.currentObjective.id);
  return ids;
}

// Fotos dels reptes visibles, enriquides.
// Font: les publicades de sempre; si qui mira és admin, també les NO publicades
// del repte ACTUAL (perquè durant el repte en curs encara no estan publicades).
export function getFinishedGalleryPhotos() {
  const visibleIds = _visibleObjectiveIds();
  const currentId  = state.currentObjective ? state.currentObjective.id : null;

  let source = state.publishedPhotos;
  if (_isAdminRole() && currentId) {
    source = state.publishedPhotos.concat(
      state.photos.filter(p => p.objectiveId === currentId)
    );
  }

  return source
    .filter(p => visibleIds.has(p.objectiveId))
    .map(p => {
      const obj = state.objectives.find(o => o.id === p.objectiveId);
      return {
        id:             p.id,
        url:            p.url,
        fileName:       p.fileName || 'foto.jpg',
        caption:        p.caption || '',
        authorId:       p.userId,
        authorName:     _authorName(p.userId),
        objectiveId:    p.objectiveId,
        objectiveTitle: obj ? obj.title : '—',
        objDate:        obj ? _objDate(obj) : '',
        submittedAt:    p.submitted_at || '',
      };
    });
}

// Reptes visibles, més recents a dalt (per al desplegable)
function _visibleObjectivesSorted() {
  const ids = _visibleObjectiveIds();
  return state.objectives
    .filter(o => ids.has(o.id))
    .slice()
    .sort((a, b) => String(_objDate(b)).localeCompare(String(_objDate(a))));
}

// ── Comparadors d'ordenació de fotos ──
// Més nova primer (per data de pujada; desempat per id descendent)
function _byNewest(a, b) {
  const d = String(b.submittedAt).localeCompare(String(a.submittedAt));
  if (d !== 0) return d;
  return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
}
// Autor A→Z (desempat: més nova primer)
function _byAuthorAZ(a, b) {
  const d = a.authorName.localeCompare(b.authorName, undefined, { sensitivity: 'base' });
  return d !== 0 ? d : _byNewest(a, b);
}

// Omple els dos desplegables (repte i autor) a partir de les fotos disponibles
export function populateGalleryFilters() {
  const photos = getFinishedGalleryPhotos();
  const objSel = document.getElementById('gallery-filter-objective');
  const authSel = document.getElementById('gallery-filter-author');
  if (!objSel || !authSel) return;

  // ── Desplegable REPTE (cronològic, recent → antic)
  const objs = _visibleObjectivesSorted();
  objSel.innerHTML =
    `<option value="all">${t('gallery_all_objectives')}</option>` +
    objs.map(o => `<option value="${o.id}">${_escape(o.title)}</option>`).join('');
  objSel.value = _galFilterObj;

  // ── Desplegable AUTOR (alfabètic). Només autors que tenen alguna foto.
  const authorMap = new Map();
  photos.forEach(p => { if (!authorMap.has(p.authorId)) authorMap.set(p.authorId, p.authorName); });
  const authors = [...authorMap.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }));
  authSel.innerHTML =
    `<option value="all">${t('gallery_all_authors')}</option>` +
    authors.map(([id, name]) => `<option value="${id}">${_escape(name)}</option>`).join('');
  authSel.value = _galFilterAuthor;
}

// Llegeix els selects i repinta. Desplegables EXCLOENTS: si l'usuari tria un valor
// concret en un, l'altre torna a 'all'.
export function onGalleryFilterChange() {
  const objSel  = document.getElementById('gallery-filter-objective');
  const authSel = document.getElementById('gallery-filter-author');
  const newObj  = objSel  ? objSel.value  : 'all';
  const newAuth = authSel ? authSel.value : 'all';

  if (newObj !== _galFilterObj && newObj !== 'all') {
    // Ha triat un repte concret → reset autor
    _galFilterObj = newObj; _galFilterAuthor = 'all';
  } else if (newAuth !== _galFilterAuthor && newAuth !== 'all') {
    // Ha triat un autor concret → reset repte
    _galFilterAuthor = newAuth; _galFilterObj = 'all';
  } else {
    // Ha tornat a 'all' en algun → aplicar tal qual
    _galFilterObj = newObj; _galFilterAuthor = newAuth;
  }

  populateGalleryFilters();  // reflecteix el reset visual als <select>
  renderGallery();
}

// HTML d'una foto. `secondaryLabel` és la 2a línia del peu (autor o nom del repte
// segons la vista). Apunta `flat` perquè el visor navegui en l'ordre visual.
function _photoHtml(p, secondaryLabel, flat) {
  const idx = flat.length;
  flat.push({ url: p.url, fileName: p.fileName, author: p.authorName });
  return `
      <div class="gallery-photo" onclick="openGalleryLightbox(${idx})">
        <img src="${p.url}" alt="${_escape(p.fileName)}" loading="lazy">
        <div class="gallery-photo-meta">
          ${p.caption ? `<div class="gallery-photo-caption">${_escape(p.caption)}</div>` : ''}
          <div class="gallery-photo-author">${_escape(secondaryLabel)}</div>
        </div>
      </div>`;
}

// Pinta la galeria segons el cas:
//  · Autor concret           → graella simple, cronològic (nou→antic), peu = nom del REPTE
//  · Per defecte / repte conc → cards per repte (nou→antic), dins rejilla alfabètica
//                               per autor, peu = AUTOR
export function renderGallery() {
  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid || !empty) return;

  const all = getFinishedGalleryPhotos();
  let photos;
  if (_galFilterObj !== 'all')         photos = all.filter(p => p.objectiveId === _galFilterObj);
  else if (_galFilterAuthor !== 'all') photos = all.filter(p => p.authorId === _galFilterAuthor);
  else                                 photos = all;

  if (photos.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    window._galleryPhotosList = [];
    return;
  }
  empty.classList.add('hidden');

  const flat = [];
  let html = '';

  if (_galFilterAuthor !== 'all') {
    // ── VISTA AUTOR: una sola card amb el nom de l'autor a la capçalera (homogeni
    //    amb la vista per repte). Dins, graella cronològica (nou→antic), peu = repte.
    const authorName = _authorName(_galFilterAuthor);
    const ordered = photos.slice().sort(_byNewest);
    html += '<div class="gallery-objective-card">';
    html += `<div class="gallery-group-header">${_escape(authorName)}</div>`;
    html += '<div class="gallery-mosaic-grid">';
    for (const p of ordered) html += _photoHtml(p, p.objectiveTitle, flat);
    html += '</div></div>';
  } else {
    // ── VISTA PER REPTE: cards per repte (nou→antic), dins alfabètic per autor
    const byObj = new Map();
    for (const p of photos) {
      if (!byObj.has(p.objectiveId)) {
        byObj.set(p.objectiveId, { title: p.objectiveTitle, date: p.objDate, photos: [] });
      }
      byObj.get(p.objectiveId).photos.push(p);
    }
    const groups = [...byObj.values()]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));  // repte recent → antic
    for (const g of groups) {
      g.photos.sort(_byAuthorAZ);
      html += '<div class="gallery-objective-card">';
      html += `<div class="gallery-group-header">${_escape(g.title)}</div>`;
      html += '<div class="gallery-mosaic-grid">';
      for (const p of g.photos) html += _photoHtml(p, p.authorName, flat);
      html += '</div></div>';
    }
  }

  grid.innerHTML = html;
  window._galleryPhotosList = flat;
}

// Obre el visor a pantalla completa amb tota la llista filtrada
export function openGalleryLightbox(index) {
  const photos = window._galleryPhotosList || [];
  if (photos.length === 0) return;
  const photo = photos[index];
  openFullscreen(photo.url, photo.fileName, photos, index);
}

// ═══════════════════════════════════
// CARRUSEL de la card GALERIA (pantalla principal)
// ═══════════════════════════════════
// Capes <img> que es fonen lentament amb brillantor baixa. Idempotent: si ja està
// actiu no es reconstrueix (evita parpelleig amb l'auto-refresh del dashboard).
let _carouselTimer  = null;
let _carouselActive = false;

export function startGalleryCarousel() {
  if (_carouselActive) return;
  const cont = document.getElementById('gallery-tile-carousel');
  if (!cont) return;
  const photos = getFinishedGalleryPhotos();
  if (photos.length === 0) return;

  // Barreja perquè l'ordre sigui calmat i variat
  const shuffled = photos.slice().sort(() => Math.random() - 0.5);

  cont.innerHTML = '';
  const layerA = document.createElement('img');
  const layerB = document.createElement('img');
  layerA.className = 'gallery-tile-layer';
  layerB.className = 'gallery-tile-layer';
  cont.appendChild(layerA);
  cont.appendChild(layerB);

  let front = layerA, back = layerB, idx = 0;
  front.src = shuffled[0].url;
  front.classList.add('visible');
  _carouselActive = true;

  if (shuffled.length === 1) return;  // una sola foto: sense animació

  _carouselTimer = setInterval(() => {
    idx = (idx + 1) % shuffled.length;
    back.src = shuffled[idx].url;
    back.classList.add('visible');
    front.classList.remove('visible');
    const tmp = front; front = back; back = tmp;
  }, 4500);
}

export function stopGalleryCarousel() {
  if (_carouselTimer) { clearInterval(_carouselTimer); _carouselTimer = null; }
  _carouselActive = false;
  const cont = document.getElementById('gallery-tile-carousel');
  if (cont) cont.innerHTML = '';
}

// ═══════════════════════════════════
// MOSAIC de VOTAR — targeta "La meva foto" quan la votació és oberta
// ═══════════════════════════════════
// Mosaic fix de fotos PUBLICADES del repte ACTUAL (no de reptes finalitzats,
// a diferència del carrusel de Galeria). La selecció es fixa un cop per
// repte/sessió: NO es torna a barrejar en cada refresc del dashboard
// (auto-refresh cada 30s a router.js), només quan canvia el repte actiu o
// falten fotos per completar el mosaic (p. ex. se n'ha eliminat alguna).
let _voteMosaicPhotoIds    = null;
let _voteMosaicObjectiveId = null;

function _shuffledPick(arr, n) {
  return arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
}

export function renderVoteMosaic(containerId, count = 6) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const objId = state.currentObjective ? state.currentObjective.id : null;
  const pool  = objId ? state.publishedPhotos.filter(p => p.objectiveId === objId) : [];

  // Repte nou (o primer cop en aquesta sessió): fixem una selecció nova
  if (_voteMosaicObjectiveId !== objId) {
    _voteMosaicObjectiveId = objId;
    _voteMosaicPhotoIds = _shuffledPick(pool, count).map(p => p.id);
  }

  // Recuperem les fotos ja fixades; si alguna ha desaparegut (eliminada),
  // completem el mosaic amb fotos noves del mateix repte.
  let chosen = _voteMosaicPhotoIds
    .map(id => pool.find(p => p.id === id))
    .filter(Boolean);
  if (chosen.length < Math.min(count, pool.length)) {
    const used  = new Set(chosen.map(p => p.id));
    const extra = _shuffledPick(pool.filter(p => !used.has(p.id)), count - chosen.length);
    chosen = chosen.concat(extra);
    _voteMosaicPhotoIds = chosen.map(p => p.id);
  }

  cont.innerHTML = chosen.map(p => `<img src="${p.url}" alt="" loading="lazy">`).join('');
}

// Escapa text per inserir-lo en HTML de forma segura
function _escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Exposa en window les funcions usades des d'onclick del HTML
window.onGalleryFilterChange = onGalleryFilterChange;
window.openGalleryLightbox   = openGalleryLightbox;
// Exposada perquè applyTranslations() (i18n.js) refresqui les opcions "Tots els
// reptes"/"Tots els autors" en canviar d'idioma, sense crear un import circular.
window._refreshGalleryFilters = populateGalleryFilters;
window._refreshGalleryGrid    = renderGallery;
