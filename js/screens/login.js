// ═══════════════════════════════════
// PANTALLA LOGIN — acceso, registro, init, logout y contraseña forzada
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { sb, _dbMode } from '../core/config.js';
import { t, applyTranslations } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from '../ui/toast.js';
import { openModal, closeModal, confirmAction } from '../ui/modals.js';
import { loadAllData, loadAppTexts } from '../core/data.js';
import { showScreen, showAdminScreen, showParticipantScreen, stopAutoRefresh } from '../core/router.js';

// ═══════════════════════════════════
// PERSISTÈNCIA DE SESSIÓ (sessionStorage)
// ═══════════════════════════════════
// Manté la sessió mentre la pestanya estigui oberta; s'esborra en tancar-la o en
// fer logout. Evita haver de tornar a fer login en recarregar (F5). NO es desa
// mai la contrasenya: només id, name i role (dades no sensibles).
const SESSION_KEY = 'fem_user';
function saveSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, role: user.role }));
  } catch (_) {}
}
function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
}

// ═══════════════════════════════════
// INIT
// ═══════════════════════════════════
export async function init() {
  showLoader(t('connecting'));
  try {
    // Dades i textos en paral·lel: loadAppTexts() no bloqueja si triga o falla
    // (es queda amb el diccionari estàtic de i18n.js com a xarxa de seguretat).
    await Promise.all([loadAllData(), loadAppTexts()]);
  } catch(e) {
    console.error('init error:', e);
    showToast(t('supabase_connect_error_short'), 'error');
  }

  hideLoader();

  if (state.users.length === 0) {
    document.getElementById('setup-banner').style.display = 'block';
  }

  // Restaurar sessió guardada (evita re-login en recarregar la pàgina)
  const saved = readSession();
  if (saved && saved.id) {
    // Busquem l'usuari complet a state.users (carregat de Supabase) en lloc de
    // confiar cegament en el desat: si l'admin li ha canviat el rol, es reflecteix.
    const fullUser = state.users.find(u => u.id === saved.id);
    if (fullUser) {
      state.currentUser = fullUser;
      applyTranslations();
      if (fullUser.role === 'admin') showAdminScreen();
      else showParticipantScreen();
      return; // no mostrem la pantalla de login
    }
    clearSession(); // sessió invàlida (l'usuari ja no existeix)
  }

  applyTranslations();
}

export async function initializeDB() {
  const btn = document.getElementById('btn-init');
  btn.innerHTML = '<span class="loader"></span> ' + t('init_db_loader');
  btn.disabled  = true;

  const now = new Date().toISOString();

  // Insert default admin
  const { error } = await sb.from('users').upsert([{
    id:           'u_admin_1',
    display_name: 'Administrador',
    email:        'admin@femrank.cat',
    role:         'admin',
    password:     'admin123',
    created_at:   now,
  }], { onConflict: 'id' });

  // Init settings
  await sb.from('app_settings').upsert([
    { id: 'cfg_uploads',  key: 'uploads_enabled', value: 'true',  updated_at: now, updated_by: 'system' },
    { id: 'cfg_voting',   key: 'voting_enabled',  value: 'false', updated_at: now, updated_by: 'system' },
    { id: 'cfg_revealed', key: 'names_revealed',   value: 'false', updated_at: now, updated_by: 'system' },
  ], { onConflict: 'id' });

  if (!error) {
    await loadAllData();
    document.getElementById('setup-banner').style.display = 'none';
    document.getElementById('login-user').value = 'admin@femrank.cat';
    document.getElementById('login-pass').value  = 'admin123';
    showToast(t('db_initialized'), 'success');
  } else {
    btn.innerHTML = t('init_db_btn');
    btn.disabled  = false;
    showToast(t('sheets_error'), 'error');
  }
}

// ═══════════════════════════════════
// LOGIN
// ═══════════════════════════════════
export async function handleLogin() {
  const username  = document.getElementById('login-user').value.trim();
  const password  = document.getElementById('login-pass').value;
  const errEl     = document.getElementById('login-error');
  const btn       = document.getElementById('login-btn');

  errEl.style.display = 'none';

  if (!username || !password) {
    errEl.style.display   = 'block';
    errEl.textContent     = t('login_fill_fields');
    return;
  }

  btn.innerHTML = '<span class="loader"></span> ' + t('checking_loader');
  btn.disabled  = true;

  // Only reload from Supabase if data is not already in memory (init() already loaded it)
  if (state.users.length === 0) {
    showLoader(t('connecting'));
    try {
      await loadAllData();
    } catch(e) {
      console.error('Login loadAllData error:', e);
    }
    hideLoader();
  }

  btn.innerHTML = t('enter_btn');
  btn.disabled  = false;

  if (state.users.length === 0) {
    document.getElementById('setup-banner').style.display = 'block';
    errEl.style.display = 'block';
    errEl.textContent   = t('no_users_found');
    return;
  }

  // ── Comprovació de contrasenya AL SERVIDOR (2026-07-28) ───────────────────
  // Abans això es feia aquí mateix, comparant state.users[i].password amb el
  // que s'havia escrit. Ja no és possible ni legítim: el client no pot llegir
  // la columna `password` des del 26/07/2026, i el que decideix qui entra és
  // Supabase Auth. A més, entrar per Auth és imprescindible per una segona
  // raó: des del 27/07 les polítiques RLS d'escriptura (votes,
  // photo_submissions, seguiment_votacio) exigeixen auth.uid(), o sigui que
  // sense sessió d'Auth l'usuari entraria però NO podria votar ni pujar foto.
  //
  // Tots els socis ja tenen compte a auth.users amb la seva contrasenya
  // d'abans (migració del 26/07), així que per a ells això és transparent.
  const input = username.toLowerCase().trim();

  const userByIdentity = state.users.find(u =>
    u.email.toLowerCase().trim() === input ||
    u.username.toLowerCase().trim() === input ||
    u.name.toLowerCase().trim() === input
  );

  // signInWithPassword() només entén emails; el camp accepta també el nom.
  const email = userByIdentity
    ? String(userByIdentity.email || '').toLowerCase().trim()
    : (input.includes('@') ? input : '');

  if (email) {
    const { error: authError } = await sb.auth.signInWithPassword({ email, password });
    if (!authError) {
      const profile = userByIdentity
        || state.users.find(u => String(u.email || '').toLowerCase().trim() === email);
      if (profile) {
        state.currentUser = profile;
        saveSession(profile);
        if (profile.role === 'admin') showAdminScreen();
        else showParticipantScreen();
        return;
      }
      // Sessió d'Auth vàlida però sense fila a public.users: estat
      // inconsistent. No el deixem entrar a mitges — l'app necessita el
      // perfil per saber-ne el rol.
      await sb.auth.signOut();
      console.error('Sessió d\'Auth vàlida però sense perfil a public.users:', email);
      errEl.style.display = 'block';
      errEl.textContent   = t('login_invalid');
      return;
    }
  }

  // ── Camí de reserva: RPC fem_login() ──────────────────────────────────────
  // Cobreix el cas legítim de la contrasenya reiniciada per un admin (queda
  // buida a public.users, i per tant Auth no la pot validar mai). Comprova al
  // servidor i no retorna mai la contrasenya.
  const { data: rows, error: rpcError } = await sb.rpc('fem_login', {
    p_identity: username,
    p_password: password,
  });

  if (rpcError) {
    console.error('fem_login error', rpcError);
    errEl.style.display = 'block';
    errEl.textContent   = t('login_invalid');
    return;
  }

  const result = (rows && rows[0]) || { status: 'invalid' };

  if (result.status === 'reset_required') {
    openNewPasswordModal({
      id: result.id, name: result.display_name, email: result.email,
      username: result.email, role: result.role,
    });
    return;
  }

  if (result.status !== 'ok') {
    errEl.style.display = 'block';
    errEl.textContent   = t('login_invalid');
    return;
  }

  // Sense sessió real d'Auth: entra, però les escriptures li fallaran per RLS.
  console.warn('Accés pel camí de reserva (fem_login): sense sessió d\'Auth, aquest compte no podrà votar ni pujar foto. Email:', result.email);

  const fallbackUser = {
    id: result.id, name: result.display_name, email: result.email,
    username: result.email, role: result.role,
  };
  state.currentUser = fallbackUser;
  saveSession(fallbackUser);
  if (fallbackUser.role === 'admin') showAdminScreen();
  else showParticipantScreen();
}

// Entra directament com l'usuari amb aquest email (sense demanar contrasenya).
// L'usem en canviar a mode TEST: qui prem el botó ja és un admin autenticat, així
// que reentrem amb el mateix email a la BD de proves sense re-login. Retorna
// true si ha trobat l'usuari i ha entrat; false si no existeix en aquesta BD.
export function enterAsEmail(email) {
  if (!email) return false;
  const target = String(email).toLowerCase().trim();
  const u = state.users.find(x => String(x.email || '').toLowerCase().trim() === target);
  if (!u) return false;
  state.currentUser = u;
  saveSession(u);
  applyTranslations();
  if (u.role === 'admin') showAdminScreen();
  else showParticipantScreen();
  return true;
}

export function logout() {
  stopAutoRefresh();
  state.currentUser = null;
  clearSession();
  state.adminViewingAsParticipant = false;
  showScreen('login');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value  = '';
  // Show/hide TEST mode banner on login screen
  const testBanner = document.getElementById('login-test-banner');
  if (testBanner) testBanner.style.display = _dbMode === 'test' ? 'block' : 'none';
}

// ═══════════════════════════════════
// FORCED NEW PASSWORD (member, after admin reset)
// ═══════════════════════════════════
let _pendingPasswordUser = null;

export function openNewPasswordModal(user) {
  _pendingPasswordUser = user;
  document.getElementById('new-pwd-input').value = '';
  document.getElementById('new-pwd-repeat-input').value = '';
  document.getElementById('new-pwd-error').style.display = 'none';
  openModal('modal-new-password');
  setTimeout(() => document.getElementById('new-pwd-input').focus(), 100);
}

export async function saveNewPassword() {
  const p1 = document.getElementById('new-pwd-input').value;
  const p2 = document.getElementById('new-pwd-repeat-input').value;
  const errEl = document.getElementById('new-pwd-error');

  if (!p1 || p1.length < 4) {
    errEl.textContent = t('new_pwd_short');
    errEl.style.display = 'block';
    return;
  }
  if (p1 !== p2) {
    errEl.textContent = t('new_pwd_mismatch');
    errEl.style.display = 'block';
    return;
  }
  if (!_pendingPasswordUser) return;

  // (2026-07-28) Abans això era un UPDATE directe sobre public.users. Ara no
  // serviria de res i seria perillós: (a) la RLS només deixa fer UPDATE a
  // `users` a un admin autenticat, i qui arriba aquí encara no té sessió; i
  // (b) escriure la contrasenya només a public.users deixaria auth.users amb
  // l'antiga, o sigui que el soci es quedaria sense poder entrar. La RPC
  // fem_set_new_password() escriu les dues taules alhora, i només ho accepta
  // mentre la contrasenya actual sigui buida (el mateix invariant que fa que
  // fem_login retorni 'reset_required').
  const { data: ok, error } = await sb.rpc('fem_set_new_password', {
    p_user_id: _pendingPasswordUser.id,
    p_new_password: p1,
  });

  if (error || !ok) {
    if (error) console.error('fem_set_new_password error', error);
    errEl.textContent = t('generic_error');
    errEl.style.display = 'block';
    return;
  }

  // Establir la sessió real d'Auth amb la contrasenya NOVA: aquest camí no
  // passa per handleLogin(), i sense sessió el soci entraria però no podria
  // votar ni pujar foto (RLS). Best-effort: si falla, no li tanquem la porta.
  try {
    await sb.auth.signInWithPassword({
      email: String(_pendingPasswordUser.email || '').toLowerCase().trim(),
      password: p1,
    });
  } catch (e) {
    console.warn('No s\'ha pogut obrir sessió d\'Auth després del canvi de contrasenya', e);
  }

  // Update local state and proceed with login
  state.currentUser = _pendingPasswordUser;
  saveSession(_pendingPasswordUser);
  closeModal('modal-new-password');

  if (_pendingPasswordUser.role === 'admin') {
    showAdminScreen();
  } else {
    showParticipantScreen();
  }
  _pendingPasswordUser = null;
}

// ═══════════════════════════════════
// REGISTER / UNSUBSCRIBE
// ═══════════════════════════════════
export function showLoginTab() {
  document.getElementById('form-login').style.display    = 'block';
  document.getElementById('form-register').style.display = 'none';
  document.getElementById('tab-login').classList.add('active-tab');
  document.getElementById('tab-register').classList.remove('active-tab');
  document.getElementById('login-error').style.display   = 'none';
}

export function showRegisterTab() {
  document.getElementById('form-login').style.display    = 'none';
  document.getElementById('form-register').style.display = 'block';
  document.getElementById('tab-register').classList.add('active-tab');
  document.getElementById('tab-login').classList.remove('active-tab');
  document.getElementById('login-error').style.display   = 'none';
}

export async function handleRegister() {
  const name   = document.getElementById('reg-name').value.trim();
  const email  = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass   = document.getElementById('reg-pass').value;
  const pass2  = document.getElementById('reg-pass2').value;
  const errEl  = document.getElementById('login-error');
  const btn    = document.getElementById('register-btn');

  errEl.style.display = 'none';

  // Validations
  if (!name || !email || !pass || !pass2) {
    errEl.style.display = 'block'; errEl.textContent = t('register_fill_fields'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.style.display = 'block'; errEl.textContent = t('register_invalid_email'); return;
  }
  if (pass.length < 6) {
    errEl.style.display = 'block'; errEl.textContent = t('register_pass_short'); return;
  }
  if (pass !== pass2) {
    errEl.style.display = 'block'; errEl.textContent = t('register_pass_mismatch'); return;
  }

  btn.innerHTML = '<span class="loader"></span> ' + t('registering_loader');
  btn.disabled  = true;
  showLoader(t('creating_account'));

  const newUser = {
    id:         'u_' + Date.now(),
    name,
    email,
    username:   email,
    password:   pass,
    role:       'participant',
    created_at: new Date().toISOString(),
  };

  // (2026-07-28) Abans era un INSERT directe a public.users. Això ara crearia
  // un compte coix: existiria a public.users però no a auth.users, i per tant
  // el soci nou no podria establir sessió d'Auth — entraria i no podria ni
  // votar ni pujar foto (RLS des del 27/07). fem_register_account() crea les
  // dues files dins la mateixa transacció. El rol el fixa el servidor a
  // 'participant': no és paràmetre, així que ningú es pot crear un admin
  // cridant l'RPC per API.
  const { data: rows, error } = await sb.rpc('fem_register_account', {
    p_name:     newUser.name,
    p_email:    newUser.email,
    p_password: pass,
  });

  const result = (rows && rows[0]) || { status: 'invalid' };

  if (!error && result.status === 'email_exists') {
    hideLoader();
    errEl.style.display = 'block';
    errEl.textContent   = t('register_email_exists');
    btn.innerHTML = t('create_account_btn'); btn.disabled = false; return;
  }

  if (!error && result.status === 'ok') {
    // Sessió real d'Auth per al compte acabat de crear.
    try {
      await sb.auth.signInWithPassword({ email: newUser.email, password: pass });
    } catch (e) {
      console.warn('No s\'ha pogut obrir sessió d\'Auth després del registre', e);
    }
    await loadAllData();
    const savedUser = state.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    state.currentUser = savedUser || newUser;
    saveSession(state.currentUser);
    document.getElementById('reg-name').value  = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-pass').value  = '';
    document.getElementById('reg-pass2').value = '';
    hideLoader();
    showToast(t('account_created') + ', ' + name + ' 🎉', 'success');
    showParticipantScreen();
  } else {
    if (error) console.error('fem_register_account error', error);
    errEl.style.display = 'block';
    errEl.textContent   = t('register_error');
  }

  hideLoader();
  btn.innerHTML = t('create_account_btn'); btn.disabled = false;
}

export function confirmUnsubscribe() {
  confirmAction(
    t('unsubscribe_title'),
    t('unsubscribe_msg'),
    handleUnsubscribe
  );
}

export async function handleUnsubscribe() {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;

  // (2026-07-28) Mateixa RPC que la baixa feta per un admin: esborra la fila
  // de public.users I el compte d'auth.users. Si només s'esborrés la primera,
  // el compte d'Auth quedaria orfe i aquella adreça no es podria tornar a fer
  // servir mai. Fotos i vots segueixen caient per CASCADE.
  const { data: okDel, error: delErr } = await sb.rpc('fem_delete_account', { p_user_id: uid });
  if (delErr || !okDel) {
    console.error('fem_delete_account error', delErr);
    showToast(t('generic_error'), 'error');
    return;
  }

  showToast(t('account_deleted'), 'info');
  await new Promise(r => setTimeout(r, 1500));
  logout();
}

// Exponer en window las funciones usadas desde onclick del HTML
window.handleLogin = handleLogin;
window.logout = logout;
window.initializeDB = initializeDB;
window.saveNewPassword = saveNewPassword;
window.showLoginTab = showLoginTab;
window.showRegisterTab = showRegisterTab;
window.handleRegister = handleRegister;
window.confirmUnsubscribe = confirmUnsubscribe;
window.init = init;
