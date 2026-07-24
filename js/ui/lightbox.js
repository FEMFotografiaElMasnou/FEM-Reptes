// ═══════════════════════════════════
// FULLSCREEN IMAGE VIEWER + ZOOM + DESCARGAS
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { t } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from './toast.js';
import { getActiveAllPhotos, getParticipantNumber } from '../core/data.js';
import { getPhotoResultsBreakdown, formatScore, formatPosition } from '../features/ranking.js';

let _fullscreenFileName = 'foto.jpg';
let _lightboxPhotos = [];      // Array of {url, fileName} for navigation
let _lightboxCurrentIndex = 0; // Current photo index

// ═══════════════════════════════════
// CORTINETA DE PUNTUACIÓ (només Resultats Repte, si hi ha vot d'expert)
// ═══════════════════════════════════
let _scoreCurtainOpen = false;
let _currentBreakdown = null; // { objectiveId, blocks: [...] } o null

const _BLOCK_LABEL_KEYS = {
  expert: 'score_curtain_expert',
  socis:  'score_curtain_socis',
  all:    'score_curtain_all',
};

function _posColor(position) {
  if (position === 1) return '#f5c842';
  if (position === 2) return '#b0b8c8';
  if (position === 3) return '#c87941';
  return 'var(--text-muted)';
}

function _miniStarsHtml(score) {
  const pct = Math.max(0, Math.min(100, Math.round((score / 5) * 100)));
  return `<span class="mini-stars"><span class="empty">★★★★★</span><span class="filled" style="width:${pct}%">★★★★★</span></span>`;
}

function _scoreCurtainHtml(breakdown) {
  const blocks = breakdown.blocks.map(b => `
    <div class="score-block">
      <div class="score-block-head">
        <span class="score-block-name">${_escapeHtml(t(_BLOCK_LABEL_KEYS[b.key]))}</span>
        <span class="score-block-pos" style="color:${_posColor(b.position)}">${formatPosition(b.position)}</span>
        <span class="score-block-total">${formatScore(b.final)}</span>
      </div>
      <div class="score-crit-row"><span class="score-crit-label">${t('creativity')}</span>${_miniStarsHtml(b.creativity)}<span class="score-crit-val">${formatScore(b.creativity)}</span></div>
      <div class="score-crit-row"><span class="score-crit-label">${t('composition')}</span>${_miniStarsHtml(b.composition)}<span class="score-crit-val">${formatScore(b.composition)}</span></div>
      <div class="score-crit-row"><span class="score-crit-label">${t('theme')}</span>${_miniStarsHtml(b.theme)}<span class="score-crit-val">${formatScore(b.theme)}</span></div>
    </div>
  `).join('');
  return `<div class="score-blocks">${blocks}</div>`;
}

// Actualitza el context de la cortineta a partir del "photo" actiu al visor.
// Només es mostra el disparador ⭐ si la foto ve de Resultats Repte
// (resultsMode:true, vegeu ranking.js) i el seu repte té vot d'expert.
function _updateScoreContext(photoObj) {
  _closeScoreCurtain();
  const trigger = document.getElementById('lightbox-score-trigger');
  const photoId = photoObj && photoObj.resultsMode ? photoObj.id : null;
  _currentBreakdown = photoId ? getPhotoResultsBreakdown(photoId) : null;
  if (trigger) trigger.style.display = _currentBreakdown ? 'flex' : 'none';
}

function _closeScoreCurtain() {
  _scoreCurtainOpen = false;
  const panel = document.getElementById('lightbox-score-curtain');
  if (panel) panel.classList.remove('open');
}

export function toggleScoreCurtain() {
  if (!_currentBreakdown) return;
  const panel = document.getElementById('lightbox-score-curtain');
  if (!panel) return;
  _scoreCurtainOpen = !_scoreCurtainOpen;
  if (_scoreCurtainOpen) {
    panel.innerHTML = _scoreCurtainHtml(_currentBreakdown);
    panel.classList.add('open');
  } else {
    panel.classList.remove('open');
  }
}

// Busca el títol/descripció de la foto a partir de la seva URL (evita haver de
// passar el text per tots els onclick que obren el visor).
function _captionForUrl(url) {
  const all = [...state.photos, ...state.publishedPhotos];
  const ph  = all.find(p => p.url === url || p.originalUrl === url);
  return (ph && ph.caption) ? ph.caption : '';
}
function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Mostra el text (títol/descripció) i, NOMÉS si se'n passa, el nom de l'autor.
// L'autor només arriba des de la galeria de reptes finalitzats; a la votació
// (anònima) no es passa, així que mai es revela.
function _showCaption(url, author) {
  const el = document.getElementById('fullscreen-caption');
  if (!el) return;
  const cap = _captionForUrl(url);
  let html = '';
  if (cap)    html += `<div>${_escapeHtml(cap)}</div>`;
  if (author) html += `<div style="margin-top:${cap ? '6px' : '0'};font-size:13px;opacity:0.85;">${_escapeHtml(author)}</div>`;
  el.innerHTML     = html;
  el.style.display = html ? 'block' : 'none';
}

export function openFullscreen(url, fileName, photosList, startIndex) {
  const modal = document.getElementById('modal-fullscreen');
  const img   = document.getElementById('fullscreen-img');
  const downloadBtn = document.getElementById('btn-fullscreen-download');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const counter = document.getElementById('lightbox-counter');

  img.src = url;
  _fullscreenFileName = fileName || 'foto.jpg';
  const _startPhoto = (photosList && photosList.length) ? photosList[startIndex || 0] : null;
  _showCaption(url, _startPhoto && _startPhoto.author);
  _updateScoreContext(_startPhoto);

  // Setup navigation if photosList provided
  if (photosList && photosList.length > 1) {
    _lightboxPhotos = photosList;
    _lightboxCurrentIndex = startIndex || 0;
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    counter.style.display = 'block';
    updateLightboxCounter();
  } else {
    // Single photo mode - hide navigation
    _lightboxPhotos = [];
    _lightboxCurrentIndex = 0;
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    counter.style.display = 'none';
  }

  // Solo mostrar botón descarga a admins
  if (downloadBtn) {
    downloadBtn.style.display = actingAsAdmin() ? 'flex' : 'none';
  }

  // Habilitar zoom y resetear estado
  img.classList.add('zoomable');
  resetZoom();

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function navigateLightbox(direction) {
  if (_lightboxPhotos.length === 0) return;

  _lightboxCurrentIndex += direction;

  // Wrap around
  if (_lightboxCurrentIndex < 0) {
    _lightboxCurrentIndex = _lightboxPhotos.length - 1;
  } else if (_lightboxCurrentIndex >= _lightboxPhotos.length) {
    _lightboxCurrentIndex = 0;
  }

  const photo = _lightboxPhotos[_lightboxCurrentIndex];
  const img = document.getElementById('fullscreen-img');
  img.src = photo.url;
  _fullscreenFileName = photo.fileName || 'foto.jpg';
  _showCaption(photo.url, photo.author);
  _updateScoreContext(photo);

  // Resetear zoom al cambiar de foto
  resetZoom();

  updateLightboxCounter();
}

export function updateLightboxCounter() {
  const counter = document.getElementById('lightbox-counter');
  if (counter && _lightboxPhotos.length > 0) {
    counter.textContent = `${_lightboxCurrentIndex + 1} ${t('photo_of')} ${_lightboxPhotos.length}`;
  }
}

export function handleLightboxClick(event) {
  // Close only if clicking on the background (not on image or buttons)
  if (event.target.id === 'modal-fullscreen') {
    closeFullscreen();
  }
}

export function closeFullscreen() {
  const img = document.getElementById('fullscreen-img');
  document.getElementById('modal-fullscreen').style.display = 'none';
  if (img) {
    img.src = '';
    img.classList.remove('zoomable', 'zoomed');
    img.style.transform = '';
  }
  // Resetear estado de zoom
  _zoomLevel = 1; _zoomTx = 0; _zoomTy = 0;
  _pinchStartDist = 0; _isPanning = false; _mousePanActive = false;
  document.body.style.overflow = '';
  _lightboxPhotos = [];
  _lightboxCurrentIndex = 0;
  const cap = document.getElementById('fullscreen-caption');
  if (cap) { cap.textContent = ''; cap.style.display = 'none'; }
  _closeScoreCurtain();
  _currentBreakdown = null;
  const trigger = document.getElementById('lightbox-score-trigger');
  if (trigger) trigger.style.display = 'none';
}

// Wrapper para el botón de descarga del lightbox (antes el onclick usaba la
// variable global _fullscreenFileName, que ahora es de módulo).
export function downloadCurrentFullscreen() {
  downloadPhoto(document.getElementById('fullscreen-img').src, _fullscreenFileName || 'foto.jpg');
}

export async function downloadPhoto(url, fileName) {
  try {
    showToast(t('downloading'), 'info');
    const res  = await fetch(url);
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = fileName || 'foto.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch (err) {
    // Fallback: open in new tab
    console.warn('Download failed, opening in new tab:', err);
    window.open(url, '_blank');
  }
}

export async function downloadAllPhotos() {
  // Solo descargar fotos de la temática activa
  const allPhotos = getActiveAllPhotos();
  if (allPhotos.length === 0) {
    showToast(t('no_photos_download'), 'error');
    return;
  }

  const btn = document.getElementById('btn-download-all');
  const origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '<span class="loader"></span>'; btn.disabled = true; }
  showLoader(t('preparing_zip').replace('{count}', allPhotos.length));

  try {
    const zip = new JSZip();
    // Sanitize folder name
    const rawName = state.currentObjective ? state.currentObjective.title : 'FEM';
    const folderName = rawName.replace(/[^a-zA-Z0-9àáèéíïòóúüçñÀÁÈÉÍÏÒÓÚÜÇÑ _-]/g, '').replace(/\s+/g, '_') || 'fotos';
    const folder = zip.folder(folderName);

    for (let i = 0; i < allPhotos.length; i++) {
      const photo = allPhotos[i];
      const num = getParticipantNumber(photo.userId);
      const idx = String(i + 1).padStart(2, '0');
      const ext = (photo.fileName || 'foto.jpg').split('.').pop() || 'jpg';
      const fname = `${idx}_participant_${num}.${ext}`;

      try {
        const res = await fetch(photo.url);
        const blob = await res.blob();
        folder.file(fname, blob);
      } catch (err) {
        console.warn('Failed to fetch photo for ZIP:', fname, err);
      }
    }

    // Generate with explicit MIME type to avoid Windows security warnings
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'STORE',  // No compression (photos are already compressed JPEGs) — faster
    });

    const zipName = folderName + '_fotos.zip';

    const url = URL.createObjectURL(new Blob([zipBlob], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    showToast(t('zip_downloaded').replace('{count}', allPhotos.length), 'success');
  } catch (err) {
    console.error('ZIP download error:', err);
    showToast(t('zip_error'), 'error');
  }

  hideLoader();
  if (btn) { btn.innerHTML = origText; btn.disabled = false; }
}

// Keyboard navigation for fullscreen
document.addEventListener('keydown', e => {
  const modal = document.getElementById('modal-fullscreen');
  if (modal && modal.style.display === 'flex') {
    if (e.key === 'Escape') closeFullscreen();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }
});

// Touch/swipe navigation for fullscreen (mobile)
let _touchStartX = 0;
let _touchEndX = 0;

document.addEventListener('touchstart', e => {
  const modal = document.getElementById('modal-fullscreen');
  if (modal && modal.style.display === 'flex') {
    _touchStartX = e.changedTouches[0].screenX;
  }
}, { passive: true });

document.addEventListener('touchend', e => {
  const modal = document.getElementById('modal-fullscreen');
  if (modal && modal.style.display === 'flex' && _lightboxPhotos.length > 1) {
    _touchEndX = e.changedTouches[0].screenX;
    const diff = _touchStartX - _touchEndX;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left = next
        navigateLightbox(1);
      } else {
        // Swipe right = previous
        navigateLightbox(-1);
      }
    }
  }
}, { passive: true });

// ═══════════════════════════════════
// ZOOM EN PANTALLA COMPLETA — rueda del ratón + pinch en táctil
// ═══════════════════════════════════
let _zoomLevel = 1;
let _zoomTx = 0;
let _zoomTy = 0;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP_WHEEL = 0.15;

// Estado táctil (pinch + pan)
let _pinchStartDist = 0;
let _pinchStartZoom = 1;
let _panStartX = 0;
let _panStartY = 0;
let _panStartTx = 0;
let _panStartTy = 0;
let _isPanning = false;

export function applyZoomTransform() {
  const img = document.getElementById('fullscreen-img');
  if (!img) return;
  img.style.transform = `translate(${_zoomTx}px, ${_zoomTy}px) scale(${_zoomLevel})`;
  if (_zoomLevel > 1) {
    img.classList.add('zoomed');
  } else {
    img.classList.remove('zoomed');
  }
}

export function resetZoom() {
  _zoomLevel = 1;
  _zoomTx = 0;
  _zoomTy = 0;
  const img = document.getElementById('fullscreen-img');
  if (img) {
    img.style.transition = 'transform 0.2s ease';
    applyZoomTransform();
    // quitar transición tras la animación para no entorpecer pan
    setTimeout(() => { if (img) img.style.transition = ''; }, 220);
  }
}

function handleWheelZoom(e) {
  const modal = document.getElementById('modal-fullscreen');
  if (!modal || modal.style.display !== 'flex') return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? ZOOM_STEP_WHEEL : -ZOOM_STEP_WHEEL;
  _zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, _zoomLevel + delta));
  if (_zoomLevel === 1) { _zoomTx = 0; _zoomTy = 0; }
  applyZoomTransform();
}

function pinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function handleFullscreenTouchStart(e) {
  const modal = document.getElementById('modal-fullscreen');
  if (!modal || modal.style.display !== 'flex') return;

  if (e.touches.length === 2) {
    // Inicio pinch
    _pinchStartDist = pinchDistance(e.touches);
    _pinchStartZoom = _zoomLevel;
    _isPanning = false;
  } else if (e.touches.length === 1 && _zoomLevel > 1) {
    // Inicio pan (solo si está ya zoomed)
    _isPanning = true;
    _panStartX = e.touches[0].clientX;
    _panStartY = e.touches[0].clientY;
    _panStartTx = _zoomTx;
    _panStartTy = _zoomTy;
  } else {
    _isPanning = false;
  }
}

function handleFullscreenTouchMove(e) {
  const modal = document.getElementById('modal-fullscreen');
  if (!modal || modal.style.display !== 'flex') return;

  if (e.touches.length === 2 && _pinchStartDist > 0) {
    e.preventDefault();
    const dist = pinchDistance(e.touches);
    const ratio = dist / _pinchStartDist;
    _zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, _pinchStartZoom * ratio));
    if (_zoomLevel === 1) { _zoomTx = 0; _zoomTy = 0; }
    applyZoomTransform();
  } else if (e.touches.length === 1 && _isPanning && _zoomLevel > 1) {
    e.preventDefault();
    _zoomTx = _panStartTx + (e.touches[0].clientX - _panStartX);
    _zoomTy = _panStartTy + (e.touches[0].clientY - _panStartY);
    applyZoomTransform();
  }
}

function handleFullscreenTouchEnd(e) {
  if (e.touches.length < 2) _pinchStartDist = 0;
  if (e.touches.length === 0) _isPanning = false;
}

// Mouse pan: si se hace clic y se arrastra estando zoom > 1
let _mousePanActive = false;
function handleFullscreenMouseDown(e) {
  if (_zoomLevel > 1 && e.target.id === 'fullscreen-img') {
    _mousePanActive = true;
    _panStartX = e.clientX;
    _panStartY = e.clientY;
    _panStartTx = _zoomTx;
    _panStartTy = _zoomTy;
    e.preventDefault();
  }
}
function handleFullscreenMouseMove(e) {
  if (!_mousePanActive) return;
  _zoomTx = _panStartTx + (e.clientX - _panStartX);
  _zoomTy = _panStartTy + (e.clientY - _panStartY);
  applyZoomTransform();
}
function handleFullscreenMouseUp() {
  _mousePanActive = false;
}

// Listeners globales para el zoom (se activan solo si el modal está visible — comprobado dentro de cada handler)
document.addEventListener('wheel', handleWheelZoom, { passive: false });
document.addEventListener('touchstart', handleFullscreenTouchStart, { passive: true });
document.addEventListener('touchmove', handleFullscreenTouchMove, { passive: false });
document.addEventListener('touchend', handleFullscreenTouchEnd, { passive: true });
document.addEventListener('mousedown', handleFullscreenMouseDown);
document.addEventListener('mousemove', handleFullscreenMouseMove);
document.addEventListener('mouseup', handleFullscreenMouseUp);

// Exponer en window las funciones usadas desde onclick del HTML (estático y dinámico)
window.openFullscreen = openFullscreen;
window.navigateLightbox = navigateLightbox;
window.closeFullscreen = closeFullscreen;
window.handleLightboxClick = handleLightboxClick;
window.downloadPhoto = downloadPhoto;
window.downloadAllPhotos = downloadAllPhotos;
window.downloadCurrentFullscreen = downloadCurrentFullscreen;
window.toggleScoreCurtain = toggleScoreCurtain;
