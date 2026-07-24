// ═══════════════════════════════════
// I18N - TRANSLATIONS
// ═══════════════════════════════════
export const TRANSLATIONS = {
  ca: {
    // Foto: títol/descripció opcional de l'autor
    caption_label: 'Títol / descripció (opcional)',
    caption_placeholder: 'Què vols transmetre amb la teva foto? (opcional)',
    // Nav
    logo_subtitle: 'Sistema de votació',
    // dashboard/view_db_title/view_db_subtitle: NO S'USEN des de 2026-07-18
    // (pestanya "Panell de Control" retirada, petició Pablo — vegeu
    // FEM_reptes.md/CHANGELOG.md). Es deixen per si calgués recuperar-ne el text.
    dashboard: 'Panel de Control', photos: 'Fotos', voting: 'Votació',
    ranking: 'Ranking', objectives: 'Reptes', members: 'Socis',
    logout: 'Sortir', welcome: 'Benvingut',
    // Login
    login_title: 'Accés', login_tab: 'Iniciar Sessió', register_tab: 'Registrar-se',
    username_label: 'Usuari / Email', password_label: 'Contrasenya',
    enter_btn: 'Entrar', connecting: 'Connectant...',
    // Register
    fullname_label: 'Nom Complet', email_label: 'Email',
    confirm_pass_label: 'Confirma la Contrasenya',
    create_account_btn: 'Crear compte',
    register_note: "El teu compte es crearà com a Soci. Podràs participar al concurs quan l'administrador activi la pujada de fotos.",
    // Dashboard
    active_objective: 'Repte Actual', my_photo: 'La meva foto', home_repte_label: 'Repte:',
    upload_photo_label: 'Puja la teva foto per participar',
    photo_pending: 'Foto pujada (pendent) ⏳', photo_published: 'Foto publicada ✅',
    // voting_progress/members_voted: obsoletes des de v0.1.28 (la barra n/m/% es
    // va treure del Panell de Control, vegeu FEM_reptes.md Fase 1). Es deixen
    // perquè no fem servir claus per esborrar sense revisar-ho (Fase 4/6 podria
    // voler-les recuperar per a una altra pantalla).
    voting_progress: 'Progrés de votacions', members_voted: 'votants',
    votes_received_title: 'Votacions rebudes',
    close_voting_btn: 'Tancar Votacions i Revelar Noms',
    // Photos
    manage_photos: 'Gestió de fotos', photos_subtitle: 'Fotos rebudes dels participants',
    publish_btn: 'Publicar Fotos', delete_selected: 'Eliminar Seleccionades',
    no_photos: "No s'han rebut fotos encara.",
    // Voting
    voting_title: 'Votació', save_votes_btn: 'Enviar Vots',
    your_photo: '⭐ La teva foto', creativity: 'Creativitat',
    theme: 'Temàtica', composition: 'Composició',
    voting_closed: "Les votacions no estan obertes encara 🔒",
    voting_closed_label: 'Votació tancada',
    already_voted: "Ja has votat ✅",
    // Cortineta de puntuació (visor de fotos a Resultats Repte)
    score_curtain_expert: 'Votació Expert', score_curtain_socis: 'Vots Socis',
    score_curtain_all: 'Tots els Vots',
    // Ranking
    current_ranking: 'Repte Actual', general_ranking: 'Ranking General',
    ranking_title: 'Ranking General', participations: 'participació(ns)',
    // Objectives
    objectives_title: 'Gestió de reptes', new_objective_btn: 'Nou Repte',
    obj_title_label: 'Títol', obj_desc_label: 'Descripció',
    finalize_btn: 'Finalitzar', edit_btn: 'Editar', delete_btn: 'Eliminar',
    active_badge: 'Actiu', finished_badge: 'Finalitzat', inactive_badge: 'Inactiu',
    save_btn: 'Guardar', cancel_btn: 'Cancel·lar',
    no_objectives: "No hi ha reptes. Crea'n un per començar.",
    confirm_upload_btn: 'Confirmar Pujada',
    no_active_objective: "No hi ha repte actiu. Crea'n un a la pestanya Reptes.",
    members_total: 'Total Socis',
    finalize_confirm_title: 'Finalitzar Repte',
    finalize_confirm_msg: "Finalitzar el concurs? Ja no es podran afegir ni modificar vots. Aquesta acció no es pot desfer.",
    // Members
    members_title: 'Gestió de socis', new_member_btn: 'Nou Soci',
    member_name: 'Nom', member_email: 'Email / Usuari', member_role: 'Rol',
    member_photo: 'Foto', member_voted: 'Votat', member_actions: 'Contrasenya',
    member_uploaded: 'Foto pujada', member_voted_h: 'Ha Votat',
    member_reset_pwd: 'Reset', member_reset_confirm_title: 'Resetejar contrasenya',
    member_reset_confirm_msg: 'Segur que vols resetejar la contrasenya de {name}? El soci haurà de crear-ne una de nova al pròxim accés. Les seves puntuacions i fotos NO es perden.',
    member_reset_done: '✓ Contrasenya resetejada',
    new_pwd_modal_title: 'Crea una nova contrasenya',
    new_pwd_modal_msg: 'L\'administrador ha resetejat la teva contrasenya. Introdueix-ne una de nova per continuar.',
    new_pwd_label: 'Nova contrasenya',
    new_pwd_repeat: 'Repeteix la contrasenya',
    new_pwd_save: 'Desar i entrar',
    new_pwd_mismatch: 'Les contrasenyes no coincideixen',
    new_pwd_short: 'La contrasenya ha de tenir almenys 4 caràcters',
    yes_btn: 'Sí, resetejar',
    // Settings
    uploads_toggle: 'Pujada de fotos', voting_toggle: 'Votacions obertes',
    cal_mark_upload: 'Marcar pujada', cal_mark_voting: 'Marcar votació',
    reveal_toggle: 'Revelar Noms',
    reveal_hint: '🔒 Tanca les votacions primer',
    hide_ranking_toggle: 'Ocultar Ranking General',
    // Upload
    upload_zone_title: 'Selecciona o arrossega la teva foto',
    upload_zone_subtitle: 'JPG, PNG, WEBP · Es comprimirà automàticament',
    confirm_upload_btn: 'Confirmar Pujada', cancel_btn2: 'Cancel·lar',
    delete_photo_btn: '🗑 Eliminar i Tornar a Pujar',
    // Toasts / Messages
    no_delete_self: 'No pots eliminar el teu propi compte',
    delete_member: 'Eliminar Soci',
    confirm_delete_member: "Eliminar {name} i totes les seves dades (fotos, vots)? Aquesta acció no es pot desfer.",
    member_deleted: 'Soci i totes les seves dades eliminats ✅',
    votes_saved: 'Vots guardats! ✅',
    photo_uploaded: 'Foto pujada correctament! ✅',
    photo_deleted: "Foto eliminada. Pots pujar-ne una de nova.",
    objective_saved: 'Repte guardat! ✅',
    objective_finalized: 'Concurs finalitzat! ✅',
    member_saved: 'Soci guardat! ✅',
    account_created: 'Compte creat! Benvingut/da',
    account_deleted: "Compte eliminat correctament. Fins aviat!",
    // Unsubscribe
    unsubscribe_title: 'Donar-se de Baixa',
    unsubscribe_msg: "Estàs segur que vols eliminar el teu compte? Es perdran totes les teves dades (foto, vots). Aquesta acció no es pot desfer.",
    unsubscribe_btn: '🚪 Baixa',
    // Confirm modal
    photos_received: 'Han Pujat',
    total_members: 'Total Socis',
    objective_modal_hint: 'Repte actual del concurs',
    confirm_yes: 'Confirmar', confirm_no: 'Cancel·lar',
    nav_home: 'Inici',
    nav_vote: 'Votar',
    nav_vote_sub: 'Accedeix a la votació de fotos',
    nav_ranking: 'Ranking',
    nav_ranking_sub: 'Veure la classificació',
    nav_resultats: 'Resultat Repte',
    nav_resultats_sub: 'Resultats dels reptes finalitzats',
    nav_classificacio: 'Classificació General',
    nav_classificacio_sub: 'Classificació acumulada',
    nav_class_general: 'Class.General',
    nav_class_reptes: 'Reptes',
    view_db_subtitle: 'Alterna vista i base de dades',
    view_as_participant: 'Veure com a participant',
    nav_gallery: 'Galeria',
    nav_gallery_sub: 'Fotos dels reptes finalitzats',
    embedded_back: '← Tornar',
    gallery_title: 'Galeria',
    gallery_filter_objective: 'Repte',
    gallery_filter_author: 'Autor',
    gallery_all_objectives: 'Tots els reptes',
    gallery_all_authors: 'Tots els autors',
    gallery_empty: 'Encara no hi ha reptes finalitzats.',
    nav_upload: 'Pujar Foto',
    nav_upload_sub: 'Puja la teva foto al concurs',
    // Force-hide toggles (admin)
    force_hide_section: 'Forçar ocultació de botons',
    force_hide_upload: 'Ocultar botó Pujar foto',
    force_hide_vote: 'Ocultar botó Votar',
    force_hide_resultats: 'Ocultar botó Resultat repte',
    force_hide_classificacio: 'Ocultar botó Classificació General',
    // Dashboard stats
    members_label: 'Participants',
    contest_management: 'Gestió del concurs',
    active_objective_sub: 'Repte actual del concurs',
    // Loader messages
    saving_cloud: 'Guardant al núvol...',
    compressing: 'Comprimint imatge...',
    uploading: 'Pujant foto...',
    connecting: 'Connectant...',
    loading: 'Carregant...',
    creating_account: 'Creant compte...',
    saving_votes_loader: 'Guardant vots...',
    // Extra toast messages
    email_exists: 'Aquest email/usuari ja existeix',
    title_required: 'El títol és obligatori',
    photos_deleted: 'Fotos eliminades ✅',
    pass_required: 'La contrasenya és obligatòria',
    no_pending_photos: 'No hi ha fotos pendents de publicar',
    no_change_own_role: 'No pots canviar el teu propi rol',
    name_updated: 'Nom actualitzat ✅',
    name_email_required: 'Nom i email/usuari són obligatoris',
    select_photo: 'Selecciona almenys una foto',
    select_photo_first: 'Selecciona una foto primer',
    select_valid_image: 'Selecciona una imatge vàlida',
    voting_closed_revealed: 'Votacions tancades i noms revelats! 🏆',
    sheets_error: '❌ Error amb Supabase. Comprova la URL i la clau.',
    objective_already_active: "❌ Ja hi ha un repte actiu. Finalitza'l abans de crear-ne un de nou.",
    objective_not_finished: "❌ El repte anterior no ha estat finalitzat. Canvia'l a Finalitzat primer.",
    role_changed: 'Rol canviat a',
    member_role_name: 'Soci',
    expert_role_name: 'Expert',
    confirm_close_voting: 'Tancar Votacions',
    confirm_close_voting_msg: "Estàs segur que vols tancar les votacions i revelar els noms?",
    confirm_delete_photo: 'Eliminar Foto',
    confirm_delete_photo_msg: "Vols eliminar la teva foto i pujar-ne una de diferent?",
    confirm_finalize_title: 'Finalitzar Repte',
    confirm_finalize_msg: "Finalitzar el concurs? Ja no es podran afegir ni modificar vots.",
    // Spectator mode
    spectator_mode: 'Espectador',
    participate_mode: 'Participar',
    view_photos: 'Veure Fotos',
    spectator_viewing: 'Mode visualització',
    no_photos_yet: 'Encara no hi ha fotos publicades',
    photo_of: 'de',
    // Phase 1 i18n cleanup — claus noves per eliminar hardcodes/ternaris
    checking_loader: 'Comprovant...',
    init_db_loader: 'Inicialitzant...',
    init_db_btn: 'Inicialitzar Base de Dades',
    no_users_found: "No s'han trobat usuaris a Supabase. Executa el SQL o prem Inicialitzar.",
    login_invalid: 'Usuari/email o contrasenya incorrectes.',
    login_fill_fields: 'Introdueix usuari/email i contrasenya.',
    registering_loader: 'Registrant...',
    register_fill_fields: 'Omple tots els camps.',
    register_invalid_email: 'Introdueix un email vàlid.',
    register_pass_short: 'La contrasenya ha de tenir mínim 6 caràcters.',
    register_pass_mismatch: 'Les contrasenyes no coincideixen.',
    register_email_exists: 'Aquest email ja està registrat. Inicia sessió.',
    register_error: 'Error en crear el compte. Torna-ho a intentar.',
    generic_error: '❌ Error',
    confirm_switch_db_title: 'Canviar Base de Dades',
    confirm_switch_db_msg: 'Canviaràs a mode {mode}.\nEs tancarà la sessió i caldrà tornar a entrar.',
    confirm_switch_db_btn: 'Canviar',
    db_mode_normal: 'Normal',
    db_mode_test: 'Test',
    test_stamp_label: 'Test',
    confirm_delete_photos_title: 'Eliminar Fotos',
    confirm_delete_photos_msg: 'Vols eliminar {count} foto(s)?',
    photos_published_count: '{count} foto(s) publicada(s) ✅',
    upload_error_generic: 'Error en pujar la foto.',
    upload_error_preset: 'Error: Upload Preset de Cloudinary no vàlid. Comprova la configuració.',
    upload_error_size: 'Error: La foto és massa gran fins i tot després de comprimir.',
    upload_error_permission: 'Error: Sense permisos per pujar a Cloudinary. Comprova el preset.',
    upload_save_warning: "⚠️ Foto pujada al núvol, però no s'ha pogut desar el registre. Contacta l'administrador.",
    publishing_photos_loader: 'Publicant fotos...',
    voting_open_until: 'Votacions obertes fins el {date}',
    upload_closed_msg: 'La pujada de fotos està tancada.',
    upload_closed_label: 'Pujada tancada',
    saving_generic: 'Desant...',
    caption_save_error: 'Error en desar el títol.',
    caption_saved: 'Títol desat! ✅',
    finalizing_objective: 'Finalitzant repte...',
    create_objective_first: '🔒 Crea un repte primer',
    no_active_objective_short: 'No hi ha repte actiu',
    // automation_save_error/automation_enabled_msg/automation_disabled_msg/
    // cal_mode_hint/cal_choose_mode_first/managed_by_calendar_msg: obsoletes
    // des de la Fase 4/5 (FEM_reptes.md) — pertanyien al vell automation_enabled
    // i a la graella visual de mes, retirats. Es deixen per si calgués
    // recuperar-ne el redactat (mateix criteri que voting_progress/members_voted).
    automation_save_error: "❌ Error en desar l'automatització",
    automation_enabled_msg: '⚡ Automatització activada: el calendari mana',
    automation_disabled_msg: 'Automatització desactivada: toggles manuals',
    upload_close_before_open: "La pujada no pot tancar abans d'obrir",
    voting_close_before_open: "La votació no pot tancar abans d'obrir",
    calendar_save_error: '❌ Error en desar el calendari',
    calendar_saved: '✅ Calendari desat',
    cal_upload_label: 'Pujada',
    cal_voting_label: 'Votació',
    // Fase 4/5: desplegables de mode (calendari/obert/tancat) i comptadors/
    // etiquetes de data de cada targeta de repte (tematiques.js)
    mode_option_calendari: 'Calendari',
    mode_option_obert: 'Obert',
    mode_option_tancat: 'Tancat',
    phase_control_label: 'Control',
    photos_uploaded_count: '{n} fotos pujades',
    votes_received_count: '{n} vots rebuts',
    date_upload_start_label: 'Inici pujada',
    date_upload_end_label: 'Fi pujada',
    date_voting_start_label: 'Inici votació',
    date_voting_end_label: 'Fi votació',
    no_photos_to_vote: 'No hi ha fotos publicades per votar.',
    already_voted_locked_msg: 'Ja has enviat la teva votació. La pantalla queda bloquejada.',
    voting_not_open_msg: 'Votacions no obertes — pots veure les fotos però encara no pots votar',
    voting_closed_error: '🔒 Les votacions estan tancades',
    already_voted_error: '🔒 Ja vas enviar la teva votació',
    confirm_send_vote_title: 'Enviar Votació Definitiva',
    confirm_send_vote_msg: 'Enviar votació definitiva? Un cop enviada NO podràs canviar cap vot.',
    sending_vote_loader: 'Enviant votació...',
    send_vote_error: '❌ Error en enviar. Torna-ho a intentar.',
    vote_sent_ok: '✅ Votació enviada correctament',
    votes_sent_btn: '✅ Vots Enviats',
    upload_enabled_msg: 'Pujada de fotos activada ✅',
    upload_disabled_msg: 'Pujada de fotos desactivada 🔒',
    publish_photos_first: '🔒 Publica les fotos primer',
    voting_opened_msg: 'Votacions obertes ✅ (pujada de fotos tancada)',
    voting_closed_ranking_msg: 'Votacions tancades · noms i rànquing revelats 🏆',
    no_photos_published_toast: 'Encara no hi ha fotos publicades 📷',
    admin_role_name: 'Admin',
    points_label: 'punts',
    no_data_voting: 'Sense dades de votació.',
    ranking_locked_msg: 'Disponible quan es tanquin les votacions.',
    general_ranking_hidden_msg: 'El Ranking General està amagat temporalment.',
    no_participations: 'Sense participacions.',
    unknown_user: 'Desconegut',
    downloading: 'Descarregant...',
    no_photos_download: 'No hi ha fotos per descarregar',
    zip_error: '❌ Error en crear el ZIP',
    preparing_zip: 'Preparant ZIP amb {count} foto(s)...',
    zip_downloaded: '{count} foto(s) descarregades en ZIP ✅',
    db_mode_changed: 'Base de dades canviada a {mode}',
    photo_stats: 'Total: {total} · Publicades: {published} · Pendents: {pending}',
    vote_objective_title: 'Votar el repte: {title}',
    button_not_found: 'Error: botó no trobat',
    tooltip_select_zoom: 'Clic: seleccionar · Doble clic: ampliar',
    tooltip_zoom: 'Ampliar',
    tooltip_download: 'Descarregar',
    edit_objective_title: 'Editar Repte',
    edit_member_title: 'Editar Soci',
    cal_mode_hint: 'Clic: marca el dia · un altre clic: omple el rang · clic al marcat: esborra',
    cal_choose_mode_first: 'Tria primer "Marcar pujada" o "Marcar votació"',
    voting_min_gap: "La votació ha d'obrir com a mínim 1 dia després de tancar la pujada",
    vote_save_error: "⚠️ El vot no s'ha pogut desar. Revisa la connexió.",
    unvoted_photos_warning: 'Tens {count} foto(es) sense valorar. Si envies ara, aquestes fotos no rebran cap vot teu i NO podràs canviar-ho després. Segur que vols enviar?',
    voted_label: '✓ Votat',
    supabase_connect_error_short: '❌ Error connectant amb Supabase',
    db_initialized: '✅ BD inicialitzada! admin@femrank.cat / admin123',
    managed_by_calendar_msg: "🔒 Gestionat pel calendari (apaga l'automatització per tocar-ho)",
    login_user_placeholder: "El teu email o nom d'usuari",
    reg_name_placeholder: 'El teu nom i cognoms',
    reg_pass_placeholder: 'Mínim 6 caràcters',
    obj_title_placeholder: 'Ex: Paisatges Urbans',
    obj_desc_placeholder: 'Ex: Fotos urbanístiques de la ciutat...',
    member_name_placeholder: 'Ex: Joan Garcia',
    member_username_placeholder: 'Ex: joan.garcia',
    // Ronda 2 — bugs funcionals reportats + sweep de textos estàtics d'index.html
    no_members: 'No hi ha socis.',
    edit_name_tooltip: 'Clica per editar el nom',
    edit_role_tooltip: 'Clica per alternar Admin/Soci',
    edit_member_tooltip: 'Editar soci (nom, email, contrasenya, rol)',
    reset_pwd_tooltip: 'Resetejar contrasenya',
    test_mode_banner: '🔴 MODE TEST — Base de dades de proves',
    toggle_db_mode_tooltip: 'Canviar base de dades (Normal / Test)',
    welcome_label: 'Benvingut,',
    hello_label: 'Hola,',
    menu_label: 'Menú',
    // controls_title/calendar_title/calendar_subtitle/calendar_no_obj_msg/
    // automation_label/save_calendar_btn/uploads_toggle/voting_toggle:
    // obsoletes des de la Fase 4/5 (cards "Controls"/"Calendari" retirades
    // del Panell de Control) — es deixen per si calgués recuperar-ne el text.
    controls_title: 'Controls',
    view_db_title: 'Vista i base de dades',
    calendar_title: 'Calendari',
    calendar_subtitle: 'Programació i històric dels reptes',
    calendar_no_obj_msg: "No hi ha repte actiu: només consulta de l'històric.",
    automation_label: 'Automatització',
    save_calendar_btn: 'Desar calendari',
    download_all_btn: '⬇ Descarregar Totes',
    voting_interface_title: 'Interfície de votació',
    voting_interface_subtitle: 'Vista idèntica a la dels participants',
    admin_upload_zone_subtitle: 'JPG, PNG, WEBP · Es comprimirà automàticament abans de pujar',
    participant_upload_zone_subtitle: 'JPG, PNG, WEBP · Sense límit de mida',
    photo_uploaded_static: 'Foto pujada correctament',
    ranking_current_title: 'Ranking — Repte Actual',
    voting_screen_title: 'Votació de fotos',
    voting_screen_subtitle: "Puntua cada foto de l'1 al 5. No pots votar la teva pròpia foto.",
    // Capçalera dinàmica de la pantalla de votació (v0.1.30, revisat v0.1.31):
    // repte concret + una sola línia d'estat que combina el recompte global
    // de vots rebuts amb la data límit / si ja s'ha enviat.
    voting_repte_title: 'Votació del repte: {title}',
    voting_status_pending_date: 'Total votacions rebudes: {n}. Tens fins el {date} per enviar la teva votació.',
    voting_status_pending_nodate: 'Total votacions rebudes: {n}. Encara no has enviat la teva votació.',
    voting_status_done: 'Total votacions rebudes: {n}. Ja vas enviar la teva votació.',
    no_photos_published: 'No hi ha fotos publicades.',
    ranking_screen_title: 'Ranking',
    general_tab: 'General',
    member_role_option: 'Participant/Soci',
    expert_role_option: 'Expert',
    admin_role_option: 'Administrador',
    setup_banner_msg: "No s'han trobat usuaris a la base de dades. Inicialitza per crear l'administrador per defecte.",
    table_username_header: 'Usuari',
    username_field_label: "Nom d'Usuari",
    setup_banner_title: '⚙️ Primera configuració',
    save_changes_btn: '💾 Desar canvis',
    // Fase 3 — pantalla Admin de Textos
    texts_nav_label: 'Textos',
    texts_title: 'Gestió de textos',
    texts_subtitle: "Edita els textos de l'aplicació (CA / ES)",
    save_all_texts_btn: 'Desar canvis a la base activa',
    texts_search_placeholder: 'Cerca per clau o text...',
    texts_col_key: 'Clau',
    no_texts_found: 'Cap text coincideix amb la cerca.',
    texts_save_error: '❌ Error en desar els textos',
    texts_saved: '✅ Textos desats',
    save_all_texts_both_btn: 'Desar canvis a les dues bases',
    texts_saved_both: '✅ Textos desats a Normal i Test',
  },
  es: {
    // Foto: título/descripción opcional del autor
    caption_label: 'Título / descripción (opcional)',
    caption_placeholder: '¿Qué quieres transmitir con tu foto? (opcional)',
    // Nav
    logo_subtitle: 'Sistema de votación',
    dashboard: 'Panel de Control', photos: 'Fotos', voting: 'Votación',
    ranking: 'Ranking', objectives: 'Retos', members: 'Socios',
    logout: 'Salir', welcome: 'Bienvenido',
    // Login
    login_title: 'Acceso', login_tab: 'Iniciar Sesión', register_tab: 'Registrarse',
    username_label: 'Usuario / Email', password_label: 'Contraseña',
    enter_btn: 'Entrar', connecting: 'Conectando...',
    // Register
    fullname_label: 'Nombre Completo', email_label: 'Email',
    confirm_pass_label: 'Confirma la Contraseña',
    create_account_btn: 'Crear cuenta',
    register_note: 'Tu cuenta se creará como Socio. Podrás participar en el concurso cuando el administrador active la subida de fotos.',
    // Dashboard
    active_objective: 'Reto Actual', my_photo: 'Mi foto', home_repte_label: 'Reto:',
    upload_photo_label: 'Sube tu foto para participar',
    photo_pending: 'Foto subida (pendiente) ⏳', photo_published: 'Foto publicada ✅',
    voting_progress: 'Progreso de votaciones', members_voted: 'votantes',
    votes_received_title: 'Votaciones recibidas',
    close_voting_btn: 'Cerrar Votaciones y Revelar Nombres',
    // Photos
    manage_photos: 'Gestión de fotos', photos_subtitle: 'Fotos recibidas de los participantes',
    publish_btn: 'Publicar Fotos', delete_selected: 'Eliminar Seleccionadas',
    no_photos: 'No se han recibido fotos todavía.',
    // Voting
    voting_title: 'Votación', save_votes_btn: 'Enviar Votos',
    your_photo: '⭐ Tu foto', creativity: 'Creatividad',
    theme: 'Temática', composition: 'Composición',
    voting_closed: 'Las votaciones no están abiertas todavía 🔒',
    already_voted: 'Ya has votado ✅',
    // Cortina de puntuación (visor de fotos en Resultados Reto)
    score_curtain_expert: 'Votación Experto', score_curtain_socis: 'Votos Socios',
    score_curtain_all: 'Todos los Votos',
    // Ranking
    current_ranking: 'Reto Actual', general_ranking: 'Ranking General',
    ranking_title: 'Ranking General', participations: 'participación(es)',
    // Objectives
    objectives_title: 'Gestión de retos', new_objective_btn: 'Nuevo Reto',
    obj_title_label: 'Título', obj_desc_label: 'Descripción',
    finalize_btn: 'Finalizar', edit_btn: 'Editar', delete_btn: 'Eliminar',
    active_badge: 'Activo', finished_badge: 'Finalizado', inactive_badge: 'Inactivo',
    save_btn: 'Guardar', cancel_btn: 'Cancelar',
    no_objectives: 'No hay retos. Crea uno para empezar.',
    finalize_confirm_title: 'Finalizar Reto',
    finalize_confirm_msg: "¿Finalizar el concurso? Ya no se podrán añadir ni modificar votos. Esta acción no se puede deshacer.",
    // Members
    members_title: 'Gestión de socios', new_member_btn: 'Nuevo Socio',
    member_name: 'Nombre', member_email: 'Email / Usuario', member_role: 'Rol',
    member_photo: 'Foto', member_voted: 'Votado', member_actions: 'Contraseña',
    member_uploaded: 'Foto subida', member_voted_h: 'Ha Votado',
    member_reset_pwd: 'Reset', member_reset_confirm_title: 'Resetear contraseña',
    member_reset_confirm_msg: '¿Seguro que quieres resetear la contraseña de {name}? El socio tendrá que crear una nueva en el próximo acceso. Sus puntuaciones y fotos NO se pierden.',
    member_reset_done: '✓ Contraseña reseteada',
    new_pwd_modal_title: 'Crea una nueva contraseña',
    new_pwd_modal_msg: 'El administrador ha reseteado tu contraseña. Introduce una nueva para continuar.',
    new_pwd_label: 'Nueva contraseña',
    new_pwd_repeat: 'Repite la contraseña',
    new_pwd_save: 'Guardar y entrar',
    new_pwd_mismatch: 'Las contraseñas no coinciden',
    new_pwd_short: 'La contraseña debe tener al menos 4 caracteres',
    yes_btn: 'Sí, resetear',
    // Settings
    uploads_toggle: 'Subida de fotos', voting_toggle: 'Votaciones abiertas',
    cal_mark_upload: 'Marcar subida', cal_mark_voting: 'Marcar votación',
    reveal_toggle: 'Revelar Nombres',
    reveal_hint: '🔒 Cierra las votaciones primero',
    hide_ranking_toggle: 'Ocultar Ranking General',
    // Upload
    upload_zone_title: 'Selecciona o arrastra tu foto',
    upload_zone_subtitle: 'JPG, PNG, WEBP · Se comprimirá automáticamente antes de subir',
    confirm_upload_btn: 'Confirmar Subida', cancel_btn2: 'Cancelar',
    delete_photo_btn: '🗑 Eliminar y Volver a Subir',
    // Toasts / Messages
    no_delete_self: 'No puedes eliminar tu propia cuenta',
    delete_member: 'Eliminar Socio',
    confirm_delete_member: "¿Eliminar a {name} y todos sus datos (fotos, votos)? Esta acción no se puede deshacer.",
    member_deleted: 'Socio y todos sus datos eliminados ✅',
    votes_saved: "¡Votos guardados! ✅",
    photo_uploaded: "¡Foto subida correctamente! ✅",
    photo_deleted: 'Foto eliminada. Puedes subir una nueva.',
    objective_saved: "¡Reto guardado! ✅",
    objective_finalized: "¡Concurso finalizado! ✅",
    member_saved: "¡Socio guardado! ✅",
    account_created: "¡Cuenta creada! Bienvenido/a",
    account_deleted: "Cuenta eliminada correctamente. ¡Hasta pronto!",
    // Unsubscribe
    unsubscribe_title: 'Darse de Baja',
    unsubscribe_msg: "¿Estás seguro de que quieres eliminar tu cuenta? Se perderán todos tus datos (foto, votos). Esta acción no se puede deshacer.",
    unsubscribe_btn: '🚪 Baja',
    // Confirm modal
    photos_received: 'Han Subido',
    total_members: 'Total Socios',
    objective_modal_hint: 'Reto actual del concurso',
    confirm_yes: 'Confirmar', confirm_no: 'Cancelar',
    nav_home: 'Inicio',
    nav_vote: 'Votar',
    nav_vote_sub: 'Accede a la votación de fotos',
    nav_ranking: 'Ranking',
    nav_ranking_sub: 'Ver la clasificación',
    nav_resultats: 'Resultado Reto',
    nav_resultats_sub: 'Resultados de los retos finalizados',
    nav_classificacio: 'Clasificación General',
    nav_classificacio_sub: 'Clasificación acumulada',
    nav_class_general: 'Clas.General',
    nav_class_reptes: 'Retos',
    view_db_subtitle: 'Alterna vista y base de datos',
    view_as_participant: 'Ver como participante',
    nav_gallery: 'Galería',
    nav_gallery_sub: 'Fotos de los retos finalizados',
    embedded_back: '← Volver',
    gallery_title: 'Galería',
    gallery_filter_objective: 'Reto',
    gallery_filter_author: 'Autor',
    gallery_all_objectives: 'Todos los retos',
    gallery_all_authors: 'Todos los autores',
    gallery_empty: 'Aún no hay retos finalizados.',
    nav_upload: 'Subir Foto',
    nav_upload_sub: 'Sube tu foto al concurso',
    // Force-hide toggles (admin)
    force_hide_section: 'Forzar ocultación de botones',
    force_hide_upload: 'Ocultar botón Subir foto',
    force_hide_vote: 'Ocultar botón Votar',
    force_hide_resultats: 'Ocultar botón Resultado reto',
    force_hide_classificacio: 'Ocultar botón Clasificación General',
    // Dashboard stats
    members_label: 'Participantes',
    contest_management: 'Gestión del concurso',
    active_objective_sub: 'Reto actual del concurso',
    // Loader messages
    saving_cloud: 'Guardando en la nube...',
    compressing: 'Comprimiendo imagen...',
    uploading: 'Subiendo foto...',
    connecting: 'Conectando...',
    loading: 'Cargando...',
    creating_account: 'Creando cuenta...',
    saving_votes_loader: 'Guardando votos...',
    // Extra toast messages
    email_exists: 'Este email/usuario ya existe',
    title_required: 'El título es obligatorio',
    photos_deleted: 'Fotos eliminadas ✅',
    pass_required: 'La contraseña es obligatoria',
    no_pending_photos: 'No hay fotos pendientes de publicar',
    no_change_own_role: 'No puedes cambiar tu propio rol',
    name_updated: 'Nombre actualizado ✅',
    name_email_required: 'Nombre y email/usuario son obligatorios',
    select_photo: 'Selecciona al menos una foto',
    select_photo_first: 'Selecciona una foto primero',
    select_valid_image: 'Selecciona una imagen válida',
    voting_closed_revealed: '¡Votaciones cerradas y nombres revelados! 🏆',
    sheets_error: '❌ Error con Supabase. Comprueba la URL y la clave.',
    objective_already_active: '❌ Ya hay un reto activo. Finalízalo antes de crear uno nuevo.',
    objective_not_finished: '❌ El reto anterior no ha sido finalizado. Cámbialo a Finalizado primero.',
    role_changed: 'Rol cambiado a',
    member_role_name: 'Socio',
    expert_role_name: 'Experto',
    confirm_close_voting: 'Cerrar Votaciones',
    confirm_close_voting_msg: '¿Seguro que quieres cerrar las votaciones y revelar los nombres?',
    confirm_delete_photo: 'Eliminar Foto',
    confirm_delete_photo_msg: '¿Quieres eliminar tu foto y subir una diferente?',
    confirm_finalize_title: 'Finalizar Reto',
    confirm_finalize_msg: '¿Finalizar el concurso? Ya no se podrán añadir ni modificar votos.',
    // Spectator mode
    spectator_mode: 'Espectador',
    participate_mode: 'Participar',
    view_photos: 'Ver Fotos',
    spectator_viewing: 'Modo visualización',
    no_photos_yet: 'Aún no hay fotos publicadas',
    photo_of: 'de',
    // Phase 1 i18n cleanup — claves nuevas para eliminar hardcodes/ternarios
    checking_loader: 'Comprobando...',
    init_db_loader: 'Inicializando...',
    init_db_btn: 'Inicializar Base de Datos',
    no_users_found: 'No se encontraron usuarios en Supabase. Ejecuta el SQL o pulsa Inicializar.',
    login_invalid: 'Usuario/email o contraseña incorrectos.',
    login_fill_fields: 'Introduce usuario/email y contraseña.',
    registering_loader: 'Registrando...',
    register_fill_fields: 'Rellena todos los campos.',
    register_invalid_email: 'Introduce un email válido.',
    register_pass_short: 'La contraseña debe tener mínimo 6 caracteres.',
    register_pass_mismatch: 'Las contraseñas no coinciden.',
    register_email_exists: 'Este email ya está registrado. Inicia sesión.',
    register_error: 'Error al crear la cuenta. Inténtalo de nuevo.',
    generic_error: '❌ Error',
    confirm_switch_db_title: 'Cambiar Base de Datos',
    confirm_switch_db_msg: 'Cambiarás a modo {mode}.\nSe cerrará la sesión y tendrás que volver a entrar.',
    confirm_switch_db_btn: 'Cambiar',
    db_mode_normal: 'Normal',
    db_mode_test: 'Test',
    test_stamp_label: 'Test',
    confirm_delete_photos_title: 'Eliminar Fotos',
    confirm_delete_photos_msg: '¿Quieres eliminar {count} foto(s)?',
    photos_published_count: '{count} foto(s) publicada(s) ✅',
    upload_error_generic: 'Error al subir la foto.',
    upload_error_preset: 'Error: Upload Preset de Cloudinary no válido. Comprueba la configuración.',
    upload_error_size: 'Error: La foto es demasiado grande incluso después de comprimir.',
    upload_error_permission: 'Error: Sin permisos para subir a Cloudinary. Comprueba el preset.',
    upload_save_warning: '⚠️ Foto subida a la nube, pero no se pudo guardar el registro. Contacta al administrador.',
    publishing_photos_loader: 'Publicando fotos...',
    voting_open_until: 'Votaciones abiertas hasta el {date}',
    upload_closed_msg: 'La subida de fotos está cerrada.',
    upload_closed_label: 'Subida cerrada',
    saving_generic: 'Guardando...',
    caption_save_error: 'Error al guardar el título.',
    caption_saved: '¡Título guardado! ✅',
    finalizing_objective: 'Finalizando reto...',
    create_objective_first: '🔒 Crea un reto primero',
    no_active_objective_short: 'No hay reto activo',
    // Ver nota en el bloque 'ca': claves obsoletas desde la Fase 4/5, se
    // conservan por si hiciera falta recuperar el redactado.
    automation_save_error: '❌ Error al guardar la automatización',
    automation_enabled_msg: '⚡ Automatización activada: el calendario manda',
    automation_disabled_msg: 'Automatización desactivada: toggles manuales',
    upload_close_before_open: 'La subida no puede cerrar antes de abrir',
    voting_close_before_open: 'La votación no puede cerrar antes de abrir',
    calendar_save_error: '❌ Error al guardar el calendario',
    calendar_saved: '✅ Calendario guardado',
    cal_upload_label: 'Subida',
    cal_voting_label: 'Votación',
    // Fase 4/5: desplegables de modo (calendario/abierto/cerrado) y
    // contadores/etiquetas de fecha de cada tarjeta de reto (tematiques.js)
    mode_option_calendari: 'Calendario',
    mode_option_obert: 'Abierto',
    mode_option_tancat: 'Cerrado',
    phase_control_label: 'Control',
    photos_uploaded_count: '{n} fotos subidas',
    votes_received_count: '{n} votos recibidos',
    date_upload_start_label: 'Inicio subida',
    date_upload_end_label: 'Fin subida',
    date_voting_start_label: 'Inicio votación',
    date_voting_end_label: 'Fin votación',
    no_photos_to_vote: 'No hay fotos publicadas para votar.',
    already_voted_locked_msg: 'Ya enviaste tu votación. La pantalla queda bloqueada.',
    voting_not_open_msg: 'Votaciones no abiertas — puedes ver las fotos pero aún no puedes votar',
    voting_closed_error: '🔒 Las votaciones están cerradas',
    already_voted_error: '🔒 Ya enviaste tu votación',
    confirm_send_vote_title: 'Enviar Votación Definitiva',
    confirm_send_vote_msg: '¿Enviar votación definitiva? Una vez enviada NO podrás cambiar ningún voto.',
    sending_vote_loader: 'Enviando votación...',
    send_vote_error: '❌ Error al enviar. Inténtalo de nuevo.',
    vote_sent_ok: '✅ Votación enviada correctamente',
    votes_sent_btn: '✅ Votos Enviados',
    upload_enabled_msg: 'Subida de fotos activada ✅',
    upload_disabled_msg: 'Subida de fotos desactivada 🔒',
    publish_photos_first: '🔒 Publica las fotos primero',
    voting_opened_msg: 'Votaciones abiertas ✅ (subida de fotos cerrada)',
    voting_closed_ranking_msg: 'Votaciones cerradas · nombres y ranking revelados 🏆',
    no_photos_published_toast: 'No hay fotos publicadas aún 📷',
    admin_role_name: 'Admin',
    points_label: 'puntos',
    no_data_voting: 'Sin datos de votación.',
    ranking_locked_msg: 'Disponible cuando se cierren las votaciones.',
    general_ranking_hidden_msg: 'El Ranking General está oculto temporalmente.',
    no_participations: 'Sin participaciones.',
    unknown_user: 'Desconocido',
    downloading: 'Descargando...',
    no_photos_download: 'No hay fotos para descargar',
    zip_error: '❌ Error al crear el ZIP',
    preparing_zip: 'Preparando ZIP con {count} foto(s)...',
    zip_downloaded: '{count} foto(s) descargadas en ZIP ✅',
    db_mode_changed: 'Base de datos cambiada a {mode}',
    photo_stats: 'Total: {total} · Publicadas: {published} · Pendientes: {pending}',
    vote_objective_title: 'Votar el reto: {title}',
    button_not_found: 'Error: botón no encontrado',
    tooltip_select_zoom: 'Clic: seleccionar · Doble clic: ampliar',
    tooltip_zoom: 'Ampliar',
    tooltip_download: 'Descargar',
    edit_objective_title: 'Editar Reto',
    edit_member_title: 'Editar Socio',
    cal_mode_hint: 'Clic: marca el día · otro clic: rellena el rango · clic en lo marcado: borra',
    cal_choose_mode_first: 'Elige primero "Marcar subida" o "Marcar votación"',
    voting_min_gap: 'La votación debe abrir al menos 1 día después de cerrar la subida',
    vote_save_error: '⚠️ El voto no se ha podido guardar. Revisa tu conexión.',
    unvoted_photos_warning: 'Tienes {count} foto(s) sin valorar. Si envías ahora, esas fotos no recibirán ningún voto tuyo y NO podrás cambiarlo después. ¿Seguro que quieres enviar?',
    voted_label: '✓ Votado',
    supabase_connect_error_short: '❌ Error al conectar con Supabase',
    db_initialized: '✅ ¡BD inicializada! admin@femrank.cat / admin123',
    managed_by_calendar_msg: '🔒 Gestionado por el calendario (apaga la automatización para tocarlo)',
    login_user_placeholder: 'Tu email o nombre de usuario',
    reg_name_placeholder: 'Tu nombre y apellidos',
    reg_pass_placeholder: 'Mínimo 6 caracteres',
    obj_title_placeholder: 'Ej: Paisajes Urbanos',
    obj_desc_placeholder: 'Ej: Fotos urbanísticas de la ciudad...',
    member_name_placeholder: 'Ej: Juan García',
    member_username_placeholder: 'Ej: juan.garcia',
    // Ronda 2 — bugs funcionales reportados + sweep de textos estáticos de index.html
    no_members: 'No hay socios.',
    edit_name_tooltip: 'Haz clic para editar el nombre',
    edit_role_tooltip: 'Haz clic para alternar Admin/Socio',
    edit_member_tooltip: 'Editar socio (nombre, email, contraseña, rol)',
    reset_pwd_tooltip: 'Resetear contraseña',
    test_mode_banner: '🔴 MODO TEST — Base de datos de pruebas',
    toggle_db_mode_tooltip: 'Cambiar base de datos (Normal / Test)',
    welcome_label: 'Bienvenido,',
    hello_label: 'Hola,',
    menu_label: 'Menú',
    controls_title: 'Controles',
    view_db_title: 'Vista y base de datos',
    calendar_title: 'Calendario',
    calendar_subtitle: 'Programación e histórico de los retos',
    calendar_no_obj_msg: 'No hay reto activo: solo consulta del histórico.',
    automation_label: 'Automatización',
    save_calendar_btn: 'Guardar calendario',
    download_all_btn: '⬇ Descargar Todas',
    voting_interface_title: 'Interfaz de votación',
    voting_interface_subtitle: 'Vista idéntica a la de los participantes',
    admin_upload_zone_subtitle: 'JPG, PNG, WEBP · Se comprimirá automáticamente antes de subir',
    participant_upload_zone_subtitle: 'JPG, PNG, WEBP · Sin límite de tamaño',
    photo_uploaded_static: 'Foto subida correctamente',
    ranking_current_title: 'Ranking — Reto Actual',
    voting_screen_title: 'Votación de fotos',
    voting_screen_subtitle: 'Puntúa cada foto del 1 al 5. No puedes votar tu propia foto.',
    voting_repte_title: 'Votación del reto: {title}',
    voting_status_pending_date: 'Total votaciones recibidas: {n}. Tienes hasta el {date} para enviar tu votación.',
    voting_status_pending_nodate: 'Total votaciones recibidas: {n}. Todavía no has enviado tu votación.',
    voting_status_done: 'Total votaciones recibidas: {n}. Ya enviaste tu votación.',
    no_photos_published: 'No hay fotos publicadas.',
    ranking_screen_title: 'Ranking',
    general_tab: 'General',
    member_role_option: 'Participante/Socio',
    expert_role_option: 'Experto',
    admin_role_option: 'Administrador',
    setup_banner_msg: 'No se han encontrado usuarios en la base de datos. Inicializa para crear el administrador por defecto.',
    table_username_header: 'Usuario',
    username_field_label: 'Nombre de Usuario',
    setup_banner_title: '⚙️ Primera configuración',
    save_changes_btn: '💾 Guardar cambios',
    // Fase 3 — pantalla Admin de Textos
    texts_nav_label: 'Textos',
    texts_title: 'Gestión de textos',
    texts_subtitle: 'Edita los textos de la aplicación (CA / ES)',
    save_all_texts_btn: 'Guardar cambios en la base activa',
    texts_search_placeholder: 'Busca por clave o texto...',
    texts_col_key: 'Clave',
    no_texts_found: 'Ningún texto coincide con la búsqueda.',
    texts_save_error: '❌ Error al guardar los textos',
    texts_saved: '✅ Textos guardados',
    save_all_texts_both_btn: 'Guardar cambios en las dos bases',
    texts_saved_both: '✅ Textos guardados en Normal y Test',
  }
};

export let currentLang = localStorage.getItem('femrank_lang') || 'ca';

// Fusiona un diccionari carregat de Supabase (taula app_texts, Fase 2) per
// sobre del diccionari estàtic d'aquest fitxer. Les claus que la BD encara
// no tingui es queden amb el valor estàtic (xarxa de seguretat: si algú
// afegeix una clau nova al codi però encara no s'ha sincronitzat a la BD,
// o si la BD no respon, l'app mai es queda sense text).
export function mergeTranslations(lang, obj) {
  if (!TRANSLATIONS[lang] || !obj || typeof obj !== 'object') return;
  Object.assign(TRANSLATIONS[lang], obj);
}

export function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS['ca'][key]) || key;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('femrank_lang', lang);
  applyTranslations();
}

export function applyTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Update title tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  // Update ALL language toggle buttons (multiple sets on page)
  document.querySelectorAll('.lang-btn-ca').forEach(btn => {
    btn.classList.toggle('active', currentLang === 'ca');
  });
  document.querySelectorAll('.lang-btn-es').forEach(btn => {
    btn.classList.toggle('active', currentLang === 'es');
  });
  // Textos fora del sistema data-i18n: contingut multi-estat generat
  // dinàmicament amb t() en pintar (grids, taules, llistes...). Com que
  // applyTranslations() només toca [data-i18n], cal repintar-lo explícitament
  // en canviar d'idioma. Es refresca via window per evitar imports circulars
  // entre i18n.js i els mòduls de features/config. Cada crida va protegida amb
  // try/catch: applyTranslations() es crida també a l'arrencada (abans del
  // login, sense dades carregades encara) i un error en un sol repintat no pot
  // trencar la resta del boot de l'app.
  const _safeCall = (fn) => { try { fn(); } catch (e) { /* no bloquejar l'arrencada / canvi d'idioma */ } };
  if (typeof window._updateDbModeButton    === 'function') _safeCall(window._updateDbModeButton);
  if (typeof window._refreshGalleryFilters === 'function') _safeCall(window._refreshGalleryFilters);
  if (typeof window._refreshGalleryGrid    === 'function') _safeCall(window._refreshGalleryGrid);
  if (typeof window._refreshMembersTable   === 'function') _safeCall(window._refreshMembersTable);
  if (typeof window._refreshAdminGallery   === 'function') _safeCall(window._refreshAdminGallery);
  if (typeof window._refreshUploadSection  === 'function') _safeCall(window._refreshUploadSection);
  if (typeof window._refreshVotingGrids    === 'function') _safeCall(window._refreshVotingGrids);
  // NOTA: NO cridar window.refreshParticipantDashboard() ni window.renderObjectivesList()
  // aquí — totes dues ja criden applyTranslations() internament (refreshParticipantDashboard
  // a participant.js, renderObjectivesList a tematiques.js), i fer-ho des d'aquí crearia una
  // recursió infinita que bloqueja la pestanya (bug detectat i corregit en aquesta ronda).
  // La llista de reptes es repinta sola gràcies a aquesta crida interna seva.
  if (typeof window.refreshAdminDashboard  === 'function') _safeCall(window.refreshAdminDashboard);
  if (typeof window.renderRanking === 'function') {
    _safeCall(() => window.renderRanking('ranking-current-list', 'ranking-general-list'));
    _safeCall(() => window.renderRanking('p-ranking-current-list', 'p-ranking-general-list'));
  }
}

// Exponer en window las funciones usadas desde onclick del HTML
window.setLang = setLang;
window.t = t;
window.applyTranslations = applyTranslations;
