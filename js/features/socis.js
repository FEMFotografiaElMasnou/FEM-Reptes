// ═══════════════════════════════════
// SOCIS — tabla, edición inline, reset de contraseña y CRUD
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { sb } from '../core/config.js';
import { t } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal, confirmAction } from '../ui/modals.js';
import { updateUser, loadAllData, hasUserVoted, getActiveAllPhotos } from '../core/data.js';
import { renderAdminGallery } from './fotos.js';
import { refreshAdminDashboard } from '../screens/admin.js';

// ── INLINE MEMBER EDITS ──
export async function toggleRole(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  if (user.id === state.currentUser.id) { showToast(t('no_change_own_role'), 'error'); return; }
  // El badge només alterna Admin↔Soci (com sempre). Els Experts no es toquen des
  // d'aquí — canviar el rol d'un Expert (o convertir algú en Expert) es fa només
  // des del modal "Editar soci" (openMemberModal), per evitar que un clic ràpid
  // al badge faci saltar un Expert a Admin per accident.
  if (user.role === 'expert') return;
  user.role = user.role === 'admin' ? 'participant' : 'admin';
  await updateUser(userId, { role: user.role });
  renderMembersTable();
  showToast(t('role_changed') + ' ' + (user.role === 'admin' ? 'Admin' : t('member_role_name')) + ' ✅', 'success');
}

export function inlineEditName(userId, el) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  const current = user.name;
  const input = document.createElement('input');
  input.value = current;
  input.style.cssText = 'background:var(--surface2);border:1px solid var(--accent);border-radius:6px;padding:4px 8px;color:var(--text);font-family:var(--font-body);font-size:14px;width:130px;outline:none;';
  el.replaceWith(input);
  input.focus();
  input.select();
  async function save() {
    const newName = input.value.trim();
    if (newName && newName !== current) {
      user.name = newName;
      await updateUser(userId, { display_name: newName });
      showToast(t('name_updated'), 'success');
    }
    renderMembersTable();
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = current; input.blur(); }
  });
}

// ── PASSWORD RESET (admin) ──
export function resetMemberPassword(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;

  const msg = t('member_reset_confirm_msg').replace('{name}', user.name);

  // Reuse generic confirm modal
  document.getElementById('confirm-title').textContent = t('member_reset_confirm_title');
  document.getElementById('confirm-msg').textContent   = msg;
  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = t('yes_btn');

  // Replace handler (clone trick to drop previous listeners)
  const newBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newBtn, okBtn);
  newBtn.addEventListener('click', async () => {
    closeModal('modal-confirm');
    await doResetMemberPassword(userId);
  });

  openModal('modal-confirm');
}

export async function doResetMemberPassword(userId) {
  // Single UPDATE — only the password field, all other data preserved
  const { error } = await sb.from('users').update({ password: '' }).eq('id', userId);
  if (error) {
    showToast('❌ Error', 'error');
    return;
  }
  // Update local state (state.users ja no porta `password`: buidar-lo a la BD
  // és el que fa que fem_login() retorni 'reset_required' al pròxim accés)
  renderMembersTable();
  showToast(t('member_reset_done'), 'success');
}

// ═══════════════════════════════════
// MEMBERS
// ═══════════════════════════════════
export function renderMembersTable() {
  const tbody = document.getElementById('members-tbody');
  if (state.users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">${t('no_members')}</td></tr>`;
    return;
  }
  // Build a Set of userIds that have uploaded a photo to the ACTIVE objective
  const uploaderIds = new Set(
    getActiveAllPhotos().map(p => p.userId)
  );
  tbody.innerHTML = state.users.map((u, idx) => {
    const voted    = hasUserVoted(u.id);
    const uploaded = uploaderIds.has(u.id);
    return `
      <tr>
        <td style="color:var(--text-muted);font-family:var(--font-mono);">${idx+1}</td>
        <td>
          <span
            style="cursor:pointer;border-bottom:1px dashed var(--border);padding-bottom:1px;"
            onclick="inlineEditName('${u.id}', this)"
            title="${t('edit_name_tooltip')}"
          >${u.name}</span>
        </td>
        <td style="font-family:var(--font-mono);font-size:12px;">${u.email || u.username}</td>
        <td>
          ${u.role === 'expert'
            ? `<span class="badge badge-blue" title="${t('edit_member_tooltip')}">${t('expert_role_name')}</span>`
            : `<span
                class="badge ${u.role==='admin'?'badge-red':'badge-yellow'}"
                style="cursor:pointer;user-select:none;"
                onclick="toggleRole('${u.id}')"
                title="${t('edit_role_tooltip')}"
              >${u.role==='admin'?'Admin':t('member_role_name')}</span>`
          }
        </td>
        <td>${uploaded?'<span class="badge badge-green">✓ Sí</span>':'<span class="badge badge-gray">No</span>'}</td>
        <td>${voted?'<span class="badge badge-green">✓ Sí</span>':'<span class="badge badge-gray">No</span>'}</td>
        <td style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openMemberModal('${u.id}')" title="${t('edit_member_tooltip')}" style="padding:4px 10px;font-size:13px;">✏️</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="resetMemberPassword('${u.id}')" title="${t('reset_pwd_tooltip')}" style="padding:4px 10px;font-size:13px;">🔄 ${t('member_reset_pwd')}</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteMember('${u.id}')">${t("delete_btn")}</button>
        </td>
      </tr>
    `;
  }).join('');
}

export function openMemberModal(id) {
  document.getElementById('member-edit-id').value = id || '';
  if (id) {
    const u = state.users.find(u => u.id === id);
    document.getElementById('member-modal-title').textContent = t('edit_member_title');
    document.getElementById('member-name').value     = u.name;
    document.getElementById('member-username').value = u.email || u.username;
    // Sempre en blanc: el client ja no pot llegir la contrasenya (i no ha de
    // poder). Buit vol dir "no la canviïs", que és el que saveMember() ja feia.
    document.getElementById('member-password').value = '';
    document.getElementById('member-role').value     = u.role;
  } else {
    document.getElementById('member-modal-title').textContent = t('new_member_btn');
    ['member-name','member-username','member-password'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('member-role').value = 'participant';
  }
  openModal('modal-member');
}

export async function saveMember() {
  const id       = document.getElementById('member-edit-id').value;
  const name     = document.getElementById('member-name').value.trim();
  const email    = document.getElementById('member-username').value.trim();
  const password = document.getElementById('member-password').value;
  const role     = document.getElementById('member-role').value;

  if (!name || !email) { showToast(t('name_email_required'), 'error'); return; }

  if (id) {
    // (2026-07-28) Email i contrasenya ja NO es poden canviar amb un UPDATE
    // directe: viuen alhora a public.users i a auth.users, i tocar-ne només
    // una deixaria el soci sense poder entrar (o, pitjor, amb la contrasenya
    // antiga encara vàlida). Cada cosa té la seva RPC, que escriu les dues
    // taules dins la mateixa transacció.
    const prev = state.users.find(u => u.id === id);
    const emailChanged = !prev || String(prev.email || '').toLowerCase() !== email.toLowerCase();

    const { error } = await sb.from('users').update({ display_name: name, role }).eq('id', id);
    if (error) {
      showToast('❌ Error', 'error');
      return;
    }

    if (emailChanged) {
      const { data: okEmail, error: emailErr } = await sb.rpc('fem_admin_set_email', {
        p_user_id: id, p_new_email: email,
      });
      if (emailErr || !okEmail) {
        if (emailErr) console.error('fem_admin_set_email error', emailErr);
        showToast(t('email_exists'), 'error');
        return;
      }
    }

    if (password) {
      const { data: okPwd, error: pwErr } = await sb.rpc('fem_admin_set_password', {
        p_user_id: id, p_new_password: password,
      });
      if (pwErr || !okPwd) {
        if (pwErr) console.error('fem_admin_set_password error', pwErr);
        showToast('❌ Error canviant la contrasenya', 'error');
        return;
      }
    }
    // Update local state
    const u = state.users.find(u => u.id === id);
    if (u) { u.name = name; u.email = email; u.username = email; u.role = role; }
  } else {
    // (2026-07-28) L'alta ja no és un INSERT directe: crearia un compte coix,
    // present a public.users però no a auth.users, i el soci nou no podria
    // establir sessió d'Auth (per tant, ni votar ni pujar foto).
    // fem_admin_create_member() crea les dues files alhora. No es fa amb
    // supabase.auth.signUp() a propòsit: signUp() substituiria la sessió de
    // l'admin per la del compte acabat de crear.
    if (!password) { showToast(t('pass_required'), 'error'); return; }
    const { data: rows, error } = await sb.rpc('fem_admin_create_member', {
      p_name: name, p_email: email, p_password: password, p_role: role,
    });
    const created = (rows && rows[0]) || { status: 'invalid' };
    if (error || created.status !== 'ok') {
      if (error) console.error('fem_admin_create_member error', error);
      showToast(created.status === 'email_exists' ? t('email_exists') : '❌ Error', 'error');
      return;
    }
    state.users.push({
      id: created.id, name: created.display_name, email: created.email,
      username: created.email, role: created.role, created_at: created.created_at,
    });
  }

  closeModal('modal-member');
  renderMembersTable();
  showToast(t('member_saved'), 'success');
}

export async function deleteMember(id) {
  if (id === state.currentUser.id) { showToast(t('no_delete_self'), 'error'); return; }
  const user = state.users.find(u => u.id === id);
  const userName = user ? user.name : id;
  confirmAction(t('delete_member'), t('confirm_delete_member').replace('{name}', userName), async () => {
    // (2026-07-28) Esborrar només la fila de public.users deixaria el compte
    // d'auth.users orfe, i aquella adreça quedaria ocupada per sempre: la
    // persona no s'hauria pogut tornar a donar d'alta mai. fem_delete_account()
    // esborra les dues. Fotos i vots segueixen caient per CASCADE.
    const { data: okDel, error: delErr } = await sb.rpc('fem_delete_account', { p_user_id: id });
    if (delErr || !okDel) {
      console.error('fem_delete_account error', delErr);
      showToast('❌ Error', 'error');
      return;
    }
    await loadAllData();
    renderMembersTable();
    renderAdminGallery();
    refreshAdminDashboard();
    showToast(t('member_deleted'), 'success');
  });
}

// Exponer en window las funciones usadas desde onclick del HTML
window.toggleRole = toggleRole;
window.inlineEditName = inlineEditName;
window.resetMemberPassword = resetMemberPassword;
window.deleteMember = deleteMember;
window.openMemberModal = openMemberModal;
window.saveMember = saveMember;
// Exposada perquè applyTranslations() (i18n.js) repinti la taula de socis en
// canviar d'idioma (el seu contingut es genera dinàmicament amb t()).
window._refreshMembersTable = renderMembersTable;
