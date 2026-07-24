# Changelog — FEM VOTACIONS (versión modular)

Registro cronológico del desglose del monolito a estructura modular.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Fechas `YYYY-MM-DD`.

> Este changelog cubre **solo la modularización** (carpeta `FEM_app_Modular/`).
> El histórico funcional del producto vive en `Instrucciones/Archivos MD/.../Changelog.MD`.

---

## [0.1.45] — 2026-07-24 — Racionalització BD: `objectives` absorbeix `reptes_calendari`

> Origen: anàlisi d'Enric detectant que `objectives` i `reptes_calendari` tenien
> responsabilitats solapades sobre el mateix concepte (estat de pujada/votació
> d'un repte) — vegeu `Diagnostic_objectives_reptes_calendari.md` (Enric, fora
> d'aquesta carpeta) per al diagnòstic complet i el registre pas a pas de la
> migració (Normal i Test). Objectiu: `reptes_calendari` no calia com a taula a
> part — ampliar `objectives` en lloc de mantenir dues taules 1:1 amb
> responsabilitat repartida sobre el mateix resultat.

### Canviat — esquema Supabase (Normal i Test)
- **`objectives`**: 6 columnes noves — `cal_upload_start`, `cal_upload_end`,
  `cal_voting_start`, `cal_voting_end` (date), `upload_mode`, `voting_mode`
  (text, `calendari`/`obert`/`tancat`, mateix check que abans). Prefix `cal_`
  a les dates per no col·lidir amb `objectives.start_date`/`end_date`
  (creació/finalització del repte — un concepte diferent, no tocat).
- **Backfill** de les dades existents a `reptes_calendari` cap a aquestes
  columnes noves (fet als 2 entorns; verificat fila a fila).
- **`fem_apply_calendar()`** (cron, `pg_cron`, 00:05 UTC) reescrita: ja no fa
  `join` amb `reptes_calendari` — llegeix el calendari directament d'`objectives`.
- **`reptes_calendari`**: ja no rep cap escriptura (frontend i cron adaptats,
  vegeu més avall). **Es manté per ara sense eliminar** (període d'observació);
  `automation_enabled` hi era una columna morta des de la Fase 4/5 (2026-07-17,
  vegeu pla de sota) i no s'ha migrat enlloc.

### Canviat — codi
- **`js/core/data.js`**: `loadAllData()` demana els 6 camps nous a la mateixa
  consulta d'`objectives` (ja no fa una segona consulta a `reptes_calendari`);
  `saveObjectives()` els desa igual. `state.reptesCalendari` retirat.
- **`js/features/calendari.js`**: `getActiveCalendar()`, `setPhaseMode()` i
  `updateCalendarDate()` llegeixen/escriuen `objectives` en lloc
  d'`upsert`/`find` sobre `reptes_calendari`. **Mateixa forma de retorn de
  `getActiveCalendar()`** (`uploadStart`/`uploadEnd`/`votingStart`/`votingEnd`/
  `uploadMode`/`votingMode`) que abans — `tematiques.js` i la resta de crides
  no s'han hagut de tocar.
- **`js/core/state.js`**: camp `reptesCalendari` retirat de l'estat inicial.
- **`js/features/fotos.js`**: només un comentari actualitzat (cap canvi de lògica).

### Verificat
- Repte real "Contrallums" creat i editat a Test i, després, a Normal
  (producció): confirmat a la BD que les dates/modes es graven a
  `objectives.cal_*` i que `reptes_calendari` ja no rep escriptures.
- Un primer intent a cada entorn (Test i, després, Normal) va escriure encara
  a `reptes_calendari` per caché del navegador amb el JS antic — detectat
  comparant la BD amb el que s'esperava, corregit amb un hard refresh. Cap
  pèrdua de dades (backfill de seguretat aplicat abans de confirmar la caché).

### SQL aplicat (Normal i Test — ja fet, es deixa aquí per referència/repetibilitat)
Vegeu `sql/2026-07-24_racionalitzacio_objectives.sql`.

### Pendent (fora d'abast d'aquesta tasca, sense pressa perquè no afecta el funcionament)
- Eliminar `reptes_calendari` (període d'observació abans).
- Renombrar `objectives` → `reptes` (+ 2 línies equivalents a `FEM-Resultats/src/App.jsx`,
  que només llegeix `id`/`name`/`status` d'aquesta taula — vegeu el diagnòstic).

---

## [0.1.44] — 2026-07-22 — Fix botó "Enviar Vots" no es bloquejava després d'enviar

> Queixa: un cop enviada la votació, la capçalera de la pantalla ja mostrava
> correctament l'estat bloquejat ("Ja has enviat la teva votació"), però el
> botó del peu ("Enviar Vots") seguia actiu — en clicar-lo tornava a mostrar
> l'error "Ja has enviat votació" sense cap sentit, ja que hauria d'estar
> deshabilitat com la resta de la pantalla.

### Arreglat
- **`js/features/votacio.js`** (`updateVoteButtonsState()`): abans només
  comprovava si hi havia repte actiu i votació oberta (`hasActiveObj &&
  votingOpen`) per decidir si el botó estava actiu, sense tenir en compte si
  l'usuari ja havia enviat la seva votació (`isVotingSubmitted()`). Ara, si
  ja s'ha enviat, es crida `markVoteButtonSaved()` — la mateixa funció que
  s'usa just després d'enviar — de manera que el botó del peu queda com una
  rèplica exacta del banner superior (verd, bloquejat, text "✅ Vots
  Enviats"), tant per a l'admin com per al participant.
- **`js/screens/participant.js`** (`showParticipantVoting()`): es crida
  `updateVoteButtonsState()` cada cop que s'entra a la pantalla de votació,
  no només després d'un refresc complet del dashboard, per garantir que el
  botó reflecteix sempre l'estat real encara que aquesta pantalla s'obri per
  una altra via de navegació.

### Sense SQL

---

## [0.1.43] — 2026-07-19 — Fix fotos girades (doble rotació EXIF)

> Queixa d'usuaris: algunes fotos pujades es veien girades (sobretot les
> fetes en vertical amb el mòbil).

### Arreglat
- **`js/features/fotos.js`** (`compressImage()`): el `<canvas>` de
  redimensionat ja pinta la imatge "de peu" (el navegador aplica la rotació
  EXIF en decodificar-la), però l'EXIF original es tornava a injectar sense
  tocar el tag `Orientation` — resultat: rotació doble en qualsevol visor que
  respecti l'EXIF (navegador, Cloudinary, apps de fotos...). Ara es força
  `Orientation = 1` abans de re-injectar l'EXIF, ja que els píxels ja estan
  corregits. Només afecta pujades noves.
- **`js/core/data.js`** (`loadAllData()`, nova `_noAutoRotateUrl()`): per a
  les fotos ja pujades abans d'aquest fix (que van quedar amb píxels
  correctes però EXIF `Orientation` incorrecte), s'afegeix el flag
  `a_ignore` a la URL de lliurament de Cloudinary perquè mai apliqui rotació
  pròpia. És segur per a totes les fotos de l'app (cap depèn de l'EXIF per
  mostrar-se bé, totes passen per `compressImage()`). Com que `url`/
  `originalUrl` es construeixen en aquest únic lloc i totes les pantalles
  (galeria, votació, ranking, lightbox, "la meva foto", descàrrega) el
  reutilitzen, l'efecte és immediat a tot arreu sense tocar Cloudinary ni
  Supabase.

### Sense SQL

---

## [0.1.42] — 2026-07-18 — Reptes ordenats de més recent a més antic

> Petició (Pablo): "vull els reptes en ordre descendent de data, de manera
> que el vigent ja estigui disponible en obrir la pàgina, sense scroll —
> cada cop serà més llarg".

### Canviat
- **`js/features/tematiques.js`** (`renderObjectivesList()`): es pinta una
  còpia de `state.objectives` ordenada descendentment per `start_date`
  (data de creació del repte) — el més recent (normalment el vigent) surt a
  dalt de tot. `state.objectives` en si no es toca (cap altra funció en
  depèn de l'ordre).

### Sense SQL

---

## [0.1.41] — 2026-07-18 — Retirada la pestanya "Panell de Control"

> Petició (Pablo): "el botó Panell de Control no té sentit, es pot eliminar".
> Des de la Fase 4/5 ja no hi quedava res propi seu (Votacions rebudes,
> Controls i Calendari es van moure a cada targeta de repte).

### Retirat
- **`index.html`**: pestanya "Panell de Control" (sidebar + tab-nav mòbil) i
  tot el seu contingut: la card "Vista i base de dades" (només mòbil) i els
  placeholders ocults `#stat-photos`/`#stat-votes-done`/`#stat-votes-total`/
  `#current-objective-info`. "Fotos" passa a ser la pestanya activa per
  defecte en entrar com a admin.
- **`js/screens/admin.js`** (`refreshAdminDashboard()`): treu el càlcul de
  fotos/vots que només omplia els placeholders retirats, i el bloc que
  escrivia a `#current-objective-info` (ja no existeix al DOM).

### Canviat
- **`css/base.css`**: la funcionalitat de la card mòbil retirada ("Veure com
  a participant" / canviar BD Normal-Test) passa a viure SEMPRE a la barra
  superior de l'admin (decisió Pablo: "Tot això hauria d'estar a la barra
  superior quan usuari és administrador") — `#screen-admin .role-badge.
  admin-toggle`/`.db-mode-btn` ja no es amaguen en mòbil (mateix patró
  compacte que ja tenia el toggle de tornada a l'admin des de la vista de
  participant).
- **`i18n.js`**: `dashboard`/`view_db_title`/`view_db_subtitle` marcades
  com a no usades als comentaris — no s'esborren (mateix criteri d'altres
  claus obsoletes del projecte).

### Sense SQL

---

## [0.1.40] — 2026-07-18 — Els socis també recalculen l'estat del calendari en entrar

> Reportat (Pablo): un soci sense foto encara veia la pujada oberta quan ja
> hauria d'estar tancada per calendari (mentre que un soci amb foto ja
> pujada la veia correctament bloquejada). Sembla relacionat amb caché del
> navegador, però revisant el codi hi havia un forat real darrere.

### Arreglat
- **`js/core/router.js`**: `applyAllActiveCalendars()` (recalcula si avui
  toca obrir/tancar cada fase de cada repte actiu) només es cridava des del
  costat ADMIN (`showAdminScreen()` i la branca `actingAsAdmin()` de
  `_refreshUI()`). Un soci normal mai la disparava — es quedava amb l'últim
  valor persistit a la BD (per un admin que hagués obert el Panell de
  Control aquell dia, o pel cron de Supabase un cop al dia); si cap de les
  dues coses havia passat encara, veia l'estat d'ahir. Ara es crida també a
  `showParticipantScreen()` i a la branca de soci de `_refreshUI()`, perquè
  cada soci recalculi el seu propi estat en entrar i en cada auto-refresc,
  igual que ja feia l'admin.

---

## [0.1.39] — 2026-07-18 — Fix de fus horari, consolidat al cron de Supabase

> Petició (Pablo): després del fix de v0.1.38 al navegador, demana la
> "solució consolidada" — que el cron (la tasca automàtica diària de
> Supabase que aplica el calendari fins i tot si ningú obre l'app) faci
> servir el mateix "avui" (hora de Madrid), no la data en UTC de la base de
> dades.

### Afegit
- **`sql/reptes_calendari_tz_fix.sql`**: reescriu `fem_apply_calendar()`
  perquè calculi "avui" amb `(now() at time zone 'Europe/Madrid')::date` en
  lloc de `current_date` (que depenia del fus horari de la base de dades,
  normalment UTC). No cal tocar la programació del cron (`cron.schedule`,
  cada dia a les 00:05 UTC ≈ 01:05-02:05 Madrid) — només la data que la
  funció fa servir per decidir cada fase.

### Pendent (tu)
- Aplicar `sql/reptes_calendari_tz_fix.sql` a Supabase (Normal i Test).

---

## [0.1.38] — 2026-07-18 — Bug: "avui" es calculava en UTC, no en hora local

> Reportat (Pablo): 18/07 amb fi de pujada 17/07 per calendari, i el
> desplegable de Pujada es mostrava en verd (obert) — i el de Votació
> (18/07-22/07) en vermell (tancat), quan havia de ser al revés.

### Arreglat
- **`js/features/calendari.js`** (`computeWantFromDates()`): "avui" es
  calculava amb `new Date().toISOString().slice(0,10)`, que dona la data en
  **UTC**. Entre les 00:00 i les ~02:00 hora local (CEST, UTC+2), la data en
  UTC encara és "ahir": una fase que ja hauria de tancar/obrir per calendari
  es quedava amb l'estat d'ahir. Nova funció `todayLocalISO()`: calcula
  "avui" amb `getFullYear()/getMonth()/getDate()` (hora LOCAL del navegador),
  que és com els socis llegeixen les dates.
- **Consolidat a v0.1.39** (SQL): el mateix problema, però al cron de
  Supabase (que aplica el calendari 1 cop al dia encara que ningú obri
  l'app), es corregeix a `sql/reptes_calendari_tz_fix.sql`.

---

## [0.1.37] — 2026-07-18 — Reptes finalitzats: mateixos camps, visibles i bloquejats

> Petició (Pablo): en finalitzar un repte, els seus camps (desplegables de
> mode i dates) haurien de quedar visibles però bloquejats — no substituïts
> per un resum de text a part. Comprovat: NO era així (els reptes finalitzats
> encara mostraven la targeta antiga `.objective-item`, de només lectura,
> sense els desplegables ni els camps de data). Corregit.

### Canviat
- **`js/features/tematiques.js`** (`renderObjectivesList()`): s'elimina la
  branca separada per a reptes FINALITZATS — ara TOTS els reptes (actius i
  finalitzats) es pinten amb la mateixa targeta `.objective-card` (2
  desplegables de mode + 4 dates). Als finalitzats (`locked = isFinished`),
  el `<select>` i els `<input type="date">` porten l'atribut `disabled`:
  es veuen (amb el seu valor real) però no es poden tocar, mateix criteri
  que "Eliminar i Tornar a Pujar"/peu de foto quan la pujada és tancada.
- **`css/admin.css`**: `.objective-card-locked` (opacitat reduïda a tota la
  targeta) + `.obj-date-field select:disabled/input:disabled` (opacitat +
  cursor not-allowed).
- **`js/features/calendari.js`**: `getCalendariDatesHtml()` ja no s'usa
  enlloc (substituïda per la targeta completa disabled) — es deixa la funció
  per si calgués un resum de només lectura en un altre lloc, amb comentari
  actualitzat.
- **`css/base.css`**: `.objective-item` i derivades (marc antic del resum de
  només lectura) marcades com a no usades als comentaris — no s'esborren.

---

## [0.1.36] — 2026-07-18 — Desplegable de mode: color segons l'estat efectiu (no el mode)

> Petició (Pablo): amb mode "Calendari" el desplegable es quedava en color
> neutre — es demana que també es pinti en verd/vermell segons si avui cau
> dins ("obert") o fora ("tancat") del rang de dates, no només amb els modes
> forçats "Obert"/"Tancat". Revisa la decisió #5 del pla (`FEM_reptes.md`):
> el color passa d'indicar el MODE triat a indicar l'ESTAT EFECTIU d'avui.

### Canviat
- **`js/features/tematiques.js`** (`renderObjectivesList()`): el desplegable
  de mode ja no pinta segons `mode` (`mode-calendari/obert/tancat`) sinó
  segons l'estat efectiu d'avui (`obj.uploads_enabled`/`voting_enabled`,
  recalculats per `applyPhaseModes`): `eff-open` (verd) si avui està obert,
  `eff-closed` (vermell) si està tancat — amb "Obert"/"Tancat" sempre
  coincideix (és forçat); amb "Calendari" depèn de si avui cau dins del rang.
  Es repinta sol en canviar el mode o una data (`setPhaseMode`/
  `updateCalendarDate` ja disparen `renderObjectivesList()`).
- **`css/admin.css`**: `.obj-mode-select.mode-calendari/obert/tancat`
  substituïdes per `.obj-mode-select.eff-open` (verd) / `.eff-closed`
  (vermell).

---

## [0.1.35] — 2026-07-18 — Targeta de repte: compactar capses (menys espai vertical)

> Petició (Pablo): la capsa de cada fase (v0.1.34) encara feia massa espai
> vertical (etiqueta+desplegable a sobre, comptador a sota, dates a sota).

### Canviat
- **`js/features/tematiques.js`** (`renderObjectivesList()`): cada capsa de
  fase passa a 2 línies: 1a "Pujada - 12 fotos pujades" (etiqueta i
  comptador fosos en un sol text); 2a el desplegable de mode (etiquetat
  "Control", com les dates) i les seves 2 dates, en una sola fila.
- **`css/admin.css`**: `.obj-mode-select` es dibuixa ara amb el mateix
  `.obj-date-field` (etiqueta a sobre + camp a sota) i comparteix regla amb
  `input[type="date"]` (mateixa alçada, vora, colors de fons) — només
  distingeix el color del TEXT segons el mode. `.obj-phase-label`/
  `.obj-phase-count`/`.obj-phase-dates` (v0.1.34) substituïdes per
  `.obj-phase-box-header` (1 línia) i `.obj-phase-controls` (1 fila).
- **`i18n.js`**: `phase_control_label: 'Control'` (CA+ES), etiqueta del
  desplegable de mode.

---

## [0.1.34] — 2026-07-18 — Targeta de repte: agrupar cada fase en una capsa

> Petició (Pablo): a la Fila 2 de la targeta de repte (v0.1.33), les 4 dates
> quedaven totes juntes en una sola fila, sense relació visual amb el seu
> desplegable de mode corresponent, a la Fila 1. Es demana agrupar tot el que
> fa referència a una mateixa fase (Pujada / Votació): etiqueta, desplegable
> de mode, comptador i les seves 2 dates, en una única capsa fina.

### Canviat
- **`js/features/tematiques.js`** (`renderObjectivesList()`): la targeta de
  repte actiu/no finalitzat passa de "Fila 1: info + 2 desplegables + estat/
  botons · Fila 2: 4 dates soltes" a "Fila 1: info + estat/botons · Fila 2:
  2 capses (Pujada / Votació), cadascuna amb desplegable + comptador + les
  seves 2 dates". Cap canvi de comportament (`setPhaseMode`/
  `updateCalendarDate` es criden exactament igual); només reorganització
  visual.
- **`css/admin.css`**: `.obj-phase-box`/`.obj-phase-box-header`/
  `.obj-phase-dates` (capsa amb vora i fons subtil); `.obj-phase`/
  `.obj-row-dates` (de la v0.1.33, ja no s'usen) substituïdes per aquestes.

---

## [0.1.33] — 2026-07-18 — Fase 4/5 del pla multi-repte: targeta de repte amb desplegables de mode

> Pla complet a `FEM_reptes.md`. Fase 4/5 fetes juntes en un sol pas (el
> Pablo: "si no hi ha manera d'anar validant cada fase, no sé si té sentit
> fer-lo per parts" — la Fase 3 tampoc tenia canvi visible per separat).
> Substitueix el vell `automation_enabled` (un ON/OFF per repte, botons de
> plàstic globals i graella de mes al Panell de Control) per 2 desplegables
> independents PER REPTE — un per Pujada, un per Votació — amb 3 estats:
> Calendari / Obert / Tancat. Cada targeta de repte a l'apartat Reptes ara
> gestiona ella mateixa la seva pujada i votació.

### Afegit
- **`sql/reptes_calendari_fase4.sql`**: columnes `upload_mode`/`voting_mode`
  (`'calendari' | 'obert' | 'tancat'`) a `reptes_calendari`, amb backfill des
  de l'antic `automation_enabled` + l'estat booleà que ja tenia cada repte.
  `fem_apply_calendar()` reescrita: aplica cada fase segons el SEU propi mode,
  recorrent tots els reptes actius (no només l'"actiu" global).
- **`js/features/calendari.js`**: `setPhaseMode(objectiveId, phase, mode)`
  (canvia el mode d'una fase i el persisteix), `updateCalendarDate(objectiveId,
  field, value)` (edita una data individual, amb les mateixes validacions que
  abans tenia "Desar calendari"), `applyPhaseModes(objectiveId)` (recalcula
  l'estat efectiu segons mode+dates, revela noms igual que abans feia
  "Tancar Votacions"), `applyAllActiveCalendars()` (aplica els 3 anteriors a
  TOTS els reptes actius alhora, cridada des de `router.js`).
- **`js/features/tematiques.js`** (`renderObjectivesList()`): reptes
  actius/no finalitzats mostren ara una targeta de 2 files: nom/descripció +
  2 desplegables de mode amb comptador (fotos pujades / vots rebuts) + estat
  + Editar/Finalitzar a la 1a fila, i les 4 dates com a `<input type="date">`
  natius a la 2a. Els reptes FINALITZATS mantenen el resum de només lectura
  d'abans.
- **`css/admin.css`**: `.objective-card`/`.obj-row`/`.obj-phase`/
  `.obj-mode-select`/`.obj-date-field` — el desplegable de mode canvia només
  el COLOR DEL TEXT segons el mode triat (neutre=calendari, verd=obert,
  vermell=tancat); decisió presa: "de moment sortirem amb el canvi de color
  del text".
- **`i18n.js`**: `mode_option_calendari/obert/tancat`, `photos_uploaded_count`,
  `votes_received_count`, `date_upload_start/end_label`,
  `date_voting_start/end_label` (CA+ES).

### Retirat
- **Punt 1 del pla, ara efectiu**: les cards "Controls" (masters Pujada/
  Votació) i "Calendari" (graella de mes) desapareixen del Panell de Control
  — substituïdes per les targetes de repte. La card "Votacions rebudes"
  (transitòria des de v0.1.28) també es retira: el comptador viu ara a cada
  targeta.
- **`js/screens/admin.js`**: `toggleUpload`, `toggleVotingOpen`,
  `revealNamesAndRanking`, `syncPlasticButtons`, `plasticPress` eliminats
  (substituïts per `setPhaseMode`/`applyPhaseModes` a calendari.js).
- **`js/features/calendari.js`**: graella visual de mes i tot el que en
  depenia (`renderCalendariCard`, `renderCalMonth`, `calNavMonth`, `calSetMode`,
  `calDayClick`, `toggleCalAutomation`, `saveCalendari`,
  `isCalendarAutomationActive`, `applyCalendarAutomation` (antiga, per repte
  amb un únic automation_enabled), `disableAutomationForActiveObjective`).
- **`js/core/router.js`**: referències als checkboxes globals
  `#toggle-upload`/`#toggle-voting` i a `syncPlasticButtons()`.
- Claus i18n de la graella/masters globals es DEIXEN al diccionari (marcades
  com a obsoletes als comentaris), mateix criteri que `voting_progress` a
  v0.1.28 — no s'esborren claus sense revisar-ho.

### Regles de negoci preservades
- Un clic manual sempre guanya al calendari (mode 'obert'/'tancat' força
  l'estat, independentment de la data) i queda així de forma PERMANENT fins
  que algú el torni a posar en 'calendari' (decisió Pablo, Fase 2).
- Forçar la Votació a 'obert' tanca automàticament la Pujada d'aquell repte
  (mateixa regla que abans tenia `toggleVotingOpen`).
- Tancar la votació (per qualsevol via: manual o calendari) revela noms i
  ranking, igual que abans feia "Tancar Votacions".

### Pendent (properes fases, FEM_reptes.md)
- Fase 6: costat participant — repetir el bloc pujada/mosaic de votació per
  cada repte actiu (avui només mostra el primer, `state.currentObjective`).
- Fase 7: verificació manual amb 2 reptes actius simultanis.

---

## [0.1.33] — 2026-07-18 — Fase 4/5 del pla multi-repte: targeta de repte amb desplegables de mode

---

## [0.1.32] — 2026-07-18 — Fase 3 del pla multi-repte: nucli JS amb `objectiveId` explícit

> Pla complet a `FEM_reptes.md`. Fase 3: preparar el nucli JS perquè pugui
> operar sobre un repte concret (no només "l'actiu" global), pas previ
> necessari per poder pintar més d'una targeta de repte a la Fase 4. Canvi
> purament additiu: totes les crides existents segueixen funcionant igual.

### Canviat
- **`js/core/data.js`**: `getActivePublishedPhotos()`, `getActiveAllPhotos()`,
  `getActiveVotes()`, `getVotingProgress()` accepten ara un `objectiveId`
  opcional; sense argument, cauen a `getActiveObjectiveId()` com sempre.
- **`js/features/calendari.js`**: `getActiveCalendar()`,
  `isCalendarAutomationActive()`, `applyCalendarAutomation()`,
  `toggleCalAutomation()`, `saveCalendari()`, `disableAutomationForActiveObjective()`
  ídem. `applyCalendarAutomation(objectiveId)` actualitza sempre el repte
  concret que rep, però només actualitza el mirall global `state.settings`
  quan `objectiveId === getActiveObjectiveId()` — evita que aplicar
  automatització a un futur repte "secundari" (Fase 4) trepitgi l'estat del
  repte que la UI d'avui mostra.

### No canviat (a propòsit)
- `state.currentObjective` continua sent singular. Cap crida existent
  (`admin.js`, `fotos.js`, `votacio.js`, `participant.js`, `router.js`...)
  passa cap argument nou — es comporten exactament igual que abans.

---

## [0.1.31] — 2026-07-18 — Pantalla de votació: fusionar les 2 línies d'estat en una

> Petició (Pablo): la línia "Total votacions rebudes: n" quedava perduda
> visualment entre el títol (gran) i la instrucció "Puntua cada foto..."
> (també gran des de v0.1.30) — es fon amb la línia d'estat en una de sola.

### Canviat
- **`index.html`**: treta la fila `#voting-count-line`.
- **`js/screens/participant.js`** (`renderVotingHeader()`): una sola línia
  `#voting-status-line` amb el recompte i l'estat junts:
  - Pendent, amb data: "Total votacions rebudes: n. Tens fins el dd-mm-aaaa
    per enviar la teva votació."
  - Pendent, sense data (calendari sense configurar): "Total votacions
    rebudes: n. Encara no has enviat la teva votació."
  - Enviada: "Total votacions rebudes: n. Ja vas enviar la teva votació."
- **`i18n.js`**: `voting_deadline_msg`/`voting_status_submitted`/
  `votes_received_label` (v0.1.30) substituïdes per
  `voting_status_pending_date`/`voting_status_pending_nodate`/`voting_status_done`,
  cadascuna amb el recompte ja integrat al text.
- **`participant.css`**: treta `.voting-count-line`; `.voting-status-line`
  ajusta el `margin-bottom`.
- La mida/contrast del text (v0.1.30) es manté sense canvis — validada com a OK.

---

## [0.1.30] — 2026-07-18 — Pantalla de votació: capçalera d'estat + textos més visibles

> Petició (Pablo): en obrir avui la votació d'un repte, la pantalla "Votació de
> fotos" no deia de quin repte es tractava, ni si el soci ja havia enviat la
> seva votació, ni fins quan podia fer-ho, ni quants vots portava rebuts el
> repte. A més, aprofitar per pujar mida i contrast de tots els textos
> d'aquesta pantalla (mateix criteri que v0.1.22, socis amb mitjana d'edat
> ~65 anys).

### Afegit
- **Capçalera dinàmica** (`index.html` + `js/screens/participant.js`,
  `renderVotingHeader()`, cridada des de `showParticipantVoting()`):
  - Títol: "Votació del repte: [nom]" (abans fix, "Votació de fotos").
  - 2a línia: "Tens fins el dd-mm-aaaa per enviar la teva votació" o, si ja
    l'ha enviat, "✅ Ja has enviat la teva votació" — mida/pes visible però per
    sota del títol.
  - 3a línia: "Total votacions rebudes: n" (mateix comptador que la card
    "Votacions rebudes" del Panell de Control, `getVotingProgress().voted`).
- **`js/features/fotos.js`**: `_formatDateEs()` exportada (abans privada del
  fitxer) perquè `participant.js` la reutilitzi sense duplicar-la un tercer cop.
- **`participant.css`**: classes noves `.voting-status-line`,
  `.voting-count-line`, `.voting-instructions`, `.vote-criteria-label`.

### Canviat
- **Textos de la pantalla de votació, més grans i amb més contrast**:
  la instrucció "Puntua cada foto de l'1 al 5..." puja de 13px a 16px i deixa
  de ser `text-muted`; les etiquetes "Creativitat"/"Temàtica"/"Composició" de
  cada foto (`votacio.js`, `renderVotingGrid()`) pugen d'11px inline (gairebé
  il·legible) a 15px amb la classe `.vote-criteria-label`. Aquest canvi
  també es veu a la vista de votació de l'admin (`admin-voting-grid`),
  perquè reutilitza la mateixa funció.
- **`i18n.js`**: repintat en canviar d'idioma — `window._refreshVotingGrids()`
  (votacio.js) ara també crida `window.renderVotingHeader()`.

---

## [0.1.29] — 2026-07-17 — Fase 2 del pla multi-repte: BD i masters per repte

> Pla complet a `FEM_reptes.md` ("Pla — Revisió de l'admin i suport
> multi-repte"). Aquesta és la Fase 2 (BD Supabase + nucli JS mínim perquè els
> masters ja siguin per repte, no globals). Fases 4/6 (UI de la targeta de
> repte i la home) encara pendents.

### Descobert (abans de tocar res)
- `objectives.uploads_enabled`/`voting_enabled` ja existien a la taula i ja es
  carregaven/desaven (`data.js`), però eren **lletra morta**: cap part de
  l'app els llegia per decidir res — tot depenia de 2 flags GLOBALS a
  `app_settings` (`state.settings.uploads_enabled`/`voting_enabled`). Això ha
  reduït molt l'abast real d'aquesta fase (no calien columnes noves per a
  aquests dos camps, només connectar-los).

### Afegit
- **`sql/reptes_calendari_fase2.sql`** (nou, a aplicar a Supabase Normal i
  Test, DESPRÉS de `reptes_calendari.sql`): columna `objectives.names_revealed`
  + backfill del repte actiu des dels valors actuals d'`app_settings` +
  `fem_apply_calendar()` reescrit — itera **tots** els reptes actius amb
  automatització ON (abans `limit 1`) i escriu cadascun al seu propi
  `objectives.uploads_enabled/voting_enabled/names_revealed` (abans escrivia a
  2 claus globals d'`app_settings`).
- **`js/features/calendari.js`**: `disableAutomationForActiveObjective()` —
  desactiva l'automatització del repte actiu (mateix camí que el botó
  "Automatització").

### Canviat
- **`js/features/tematiques.js`** (`saveObjective()`): retirat el bloqueig que
  impedia crear un repte nou si ja n'hi havia un altre `active` o no
  finalitzat. Ara es poden tenir diversos reptes `active` a la BD.
  **Avís**: la UI d'avui (Panell de Control, Calendari, masters) encara només
  gestiona el primer repte actiu que troba — un 2n repte actiu quedaria
  inert (sense calendari/masters gestionables, sense rebre fotos) fins les
  Fases 4/6. No crear-ne un de veritat fins llavors.
- **`js/screens/admin.js`** (`toggleUpload()`/`toggleVotingOpen()`): passen a
  escriure `state.currentObjective.uploads_enabled/voting_enabled` i persistir
  amb `saveObjectives()` (abans només `state.settings` + `saveSettings()`).
  `revealNamesAndRanking()` marca també `state.currentObjective.names_revealed`.
- **Masters (botons de plàstic) — ja NO es bloquegen** (`admin.js`
  `plasticPress()`/`syncPlasticButtons()`): decisió (Pablo, 2026-07-17): un
  clic manual sempre funciona; si el calendari gestionava aquell repte, el
  clic manual "guanya" de forma **permanent** (desactiva l'automatització
  d'aquest repte, com si l'admin l'hagués apagat ell mateix) fins que algú la
  torni a activar des de la card "Calendari" (que llavors reaplica l'estat
  que toqui avui). `.locked` (`admin.css`) passa a ser només informatiu, ja
  no implica `cursor:not-allowed`.
- **`js/features/calendari.js`** (`applyCalendarAutomation()`): escriu ara al
  repte actiu (`objectives`, via `saveObjectives()`) com a font de veritat;
  `state.settings` es manté com a mirall (`saveSettings()` en segon terme).
- **`js/core/data.js`** (`loadAllData()`): `state.settings.uploads_enabled/
  voting_enabled/namesRevealed` ja NO es carreguen d'`app_settings` — es
  calculen com a mirall del repte actiu just després de fixar
  `state.currentObjective`. `saveObjectives()` inclou ara `names_revealed`.
- **`js/features/fotos.js`**: amb `uploads_enabled=false` i una foto ja
  pujada, el botó "Eliminar i Tornar a Pujar" i el peu de foto es veuen però
  queden `disabled` (abans el botó s'amagava i el peu de foto quedava
  editable sense cap restricció) — decisió (Pablo): "es veuen tots dos, no es
  pot tocar cap dels dos". Guarda equivalent afegida a `deleteMyPhoto()` i
  `saveCaptionEdit()` per si s'invoquen sense passar per la vista.
  `.btn:disabled` (`base.css`) i `.caption-input:disabled` (`participant.css`)
  nous perquè el deshabilitat es vegi (el `:disabled` natiu és imperceptible
  sobre els estils propis).

### Notes
- `state.settings.uploads_enabled/voting_enabled/namesRevealed` es mantenen
  (com a mirall) perquè `participant.js`/`votacio.js`/`fotos.js`/`router.js`/
  `ranking.js` els segueixen llegint sense canvis — no calia tocar-los ara.
  Deute intencionat: quan la Fase 3 tregui la noció de "repte actiu únic",
  aquest mirall haurà de desaparèixer en favor de llegir directament el
  repte concret de cada targeta.
- Les claus `uploads_enabled`/`voting_enabled`/`names_revealed` a
  `app_settings` queden com a residu (no s'esborren, ADR-015); ja no en
  depèn res de l'app.

---

## [0.1.28] — 2026-07-17 — Panell de Control: "Votacions rebudes" substitueix la barra de progrés

> Petició (Pablo): revisió de l'admin, punt 0. La barra "Progrés de votacions"
> (n/m + %) no tenia sentit perquè el "total" (`getVotingProgress().total`) no és
> fix — creix cada cop que vota algú que no ha pujat foto, així que numerador i
> denominador pugen alhora i el % no representa res estable.

### Canviat
- **Card "Progrés de votacions" → "Votacions rebudes"** (`index.html`): treta la
  barra (`.progress-wrap`/`.progress-bar`) i el text n/m/%; ara mostra només el
  recompte de vots definitius rebuts (`admin-votes-received`).
- **`refreshAdminDashboard()`** (`js/screens/admin.js`): ja no escriu als
  elements de la barra (retirats); reutilitza `getVotingProgress().voted` (el
  `total`/`pct` es descarten a propòsit, no s'usen enlloc més ara mateix).
- **`i18n.js`**: nova clau `votes_received_title` (CA/ES); `voting_progress` i
  `members_voted` es deixen sense esborrar (deute intencionat, per si es
  reutilitzen en una altra pantalla més endavant).
- **`base.css`**: `.progress-wrap`/`.progress-bar`/`.progress-label` queden sense
  cap ús des de JS (es deixen, deute tècnic marcat al comentari); nova classe
  `.votes-received-count` per al comptador.

### Notes
- Aquesta card és **transitòria i global** (pressuposa el model actual d'un sol
  repte actiu, `state.currentObjective`). Forma part d'un pla més ampli de
  revisió de l'admin i suport a múltiples reptes actius simultanis — vegeu la
  nova secció **"Pla — Revisió de l'admin i suport multi-repte"** a
  `FEM_reptes.md` per a l'abast complet (7 fases) i les decisions preses. Quan es
  faci la Fase 4 d'aquest pla, aquesta informació es mourà dins de cada targeta
  de repte i la card desapareixerà del Panell de Control.
- S'han deixat comentaris de referència a aquest pla a `state.js`, `data.js`,
  `calendari.js`, `fotos.js`, `tematiques.js`, `index.html` i
  `sql/reptes_calendari.sql`, allà on el codi actual pressuposa un sol repte
  actiu i caldrà tocar-lo en fases properes.

---

## [0.1.26] — 2026-07-10 — Menú inferior mòbil: bugs de traducció i visibilitat

> Petició (Enric): al menú inferior mòbil el botó "Inici" mostrava la clau sense traduir
> (`NAV_HOME`), el botó "Votar" es veia sempre encara que la votació no estigués oberta, i
> els textos de "Classificació general/reptes" es solapaven per massa llargs.

### Arreglat
- **`js/core/i18n.js`**: afegida la clau `nav_home` (CA/ES), que no existia al diccionari
  (`t()` retornava la clau en brut com a fallback).
- **`js/screens/participant.js`** (`applyParticipantButtonVisibility`): `#bnav-vote` ara
  segueix la mateixa lògica `showVote` que la targeta d'escriptori `nav-card-vote` — abans
  no tenia cap control de visibilitat i sortia sempre.

### Canviat
- **`js/core/i18n.js`**: `nav_class_general` → "Class.General"/"Clas.General",
  `nav_class_reptes` → "Reptes"/"Retos" (CA/ES), per evitar solapament al menú mòbil.

### Pendent
- Repensar la navegació mòbil: homologar totes les seccions com a targetes equivalents
  (com a escriptori) en lloc del menú inferior fix actual — proposta pendent.

## [0.1.25] — 2026-07-10 — Topbar i favicon: logo oficial de la FEM

> Petició (Enric): la topbar mostrava "FEM VOTACIONS" en text; es canvia per la icona oficial
> del cercle (les tres mitges llunes) + "FEM Fotografia El Masnou", i s'afegeix el mateix
> cercle com a favicon (amb el blau real de la marca, `#3253A2`, perquè sigui visible a
> qualsevol pestanya).

### Afegit
- `img/logo-icon.png`: icona del cercle amb cantonades transparents, per a la topbar.
- `img/favicon.png`: mateixa icona sobre fons blau sòlid (marca), per al favicon.

### Canviat
- `index.html`: topbar (admin i participant) substitueix el text per icona + "FEM Fotografia
  El Masnou"; `<head>` afegeix `<link rel="icon">` apuntant al nou favicon local.
- `css/base.css`: `.topbar-logo` passa a contenidor flex (icona + text); nou
  `.topbar-logo-text` amb tipografia Barlow Condensed (Bebas Neue no distingeix
  majúscules/minúscules) i mides responsive ajustades a mòbil.

## [0.1.24] — 2026-07-10 — Gestió de fotos: autor i títol sota cada foto

### Afegit
- **`js/features/fotos.js`** (`renderAdminGallery()`): sota cada foto es mostra ara
  `#N · Nom real de l'autor` i, si la foto en té, el **títol/descripció opcional** que hi va
  posar el participant (camp `caption`). Si no hi ha títol, no es deixa espai buit.
- **`css/admin.css`**: estils nous acotats a `#admin-gallery`. El títol es retalla a 2 línies
  (l'atribut `title` en mostra el text sencer en passar-hi el ratolí).

### Canviat
- La imatge i els seus overlays (lupa, descàrrega, check de selecció i badge ✅/⏳) passen a
  estar dins d'un `.gallery-thumb` amb `position: relative`. Cal perquè el badge d'estat
  (`.participant-num`, `bottom: 0`) s'ancori a la foto i no al fons de la card sencera.

### Notes
- L'autor es mostra amb el **nom real**, no amb `getDisplayName()`: l'anonimat de la votació no
  s'aplica al panell d'admin, que gestiona i publica les fotos.
- El `caption` l'escriu el soci, per tant s'**escapa** abans d'inserir-lo a l'HTML.
- Deute tècnic: `_escape()` existeix ara a `fotos.js`, `galeria.js` i `lightbox.js`. Unificar-la
  en un helper compartit en una tasca a part.
- Neteja: s'eliminen `admin.css` i `fotos.js` de l'arrel del repo, pujats per error des de la
  interfície web de GitHub (`Add file → Upload files` puja a la carpeta on ets). Eren duplicats;
  els fitxers bons són `css/admin.css` i `js/features/fotos.js`.

## [0.1.23] — 2026-07-09 — Neteja hosting: consolidació definitiva a Vercel

> Incidència (Enric): femfotografiaelmasnou.cat va deixar de respondre (DEPLOYMENT_NOT_FOUND) perquè
> el domini s'havia desvinculat del projecte de Vercel, i el desplegament automàtic dels pushes d'en
> Pablo quedava bloquejat (pla Hobby de Vercel no permet auto-deploy de col·laboradors externs en
> aquest Team). Es reconnecta el domini i es desplega manualment; s'aprofita per eliminar tota
> referència residual a Netlify (l'app ja fa temps que és 100% Vercel).

### Eliminat
- **`netlify.toml`**: configuració de Netlify obsoleta, ja no s'utilitza cap hosting Netlify per
  aquesta app.

### Canviat
- **`CLAUDE.md`**: secció "Stack" actualitzada — Hosting passa de "Netlify" a "Vercel"
  (`vercel.json`); nota sobre repo privat eliminada (el repo és ara **públic** a GitHub).
- **Repositori GitHub**: visibilitat canviada de privat a públic (cap secret exposat, verificat:
  les úniques claus al codi són anon keys de Supabase).
- **Flux de desplegament**: com que el pla Hobby de Vercel bloqueja el desplegament automàtic quan
  el commit no és de l'Owner del Team, Enric desplega manualment amb `git pull && npx vercel --prod`
  després de cada push d'en Pablo.

## [0.1.22] — 2026-07-09 — UI: logo i nav-cards més grans, text-muted amb més contrast

> Petición (Pablo): el logo de la barra superior y los rótulos de las nav-cards se leían pequeños,
> y el texto secundario tenía poco contraste sobre el fondo oscuro.

### Cambiado
- **`css/base.css`**: `--text-muted` pasa de `#5b7aa8` a `#9db8e0` (más contraste sobre el fondo
  oscuro); `.topbar-logo` de `26px` a `36px`.
- **`css/participant.css`**: `.nav-card .nav-title` de `22px` a `27px`; `.nav-card .nav-sub` de
  `12px` a `18px`.
- **`index.html`**: `<title>` pasa de "FEM VOTACIONS" a "FEM Fotografia El Masnou".

## [0.1.21] — 2026-07-09 — Barra "PROGRÉS VOTACIONS": del panell de participant a l'admin

> Petición (Pablo): el progreso de votación es información de seguimiento, útil para quien
> gestiona la temática, no para el socio que solo vota. Se mueve al panel de admin.

### Cambiado
- **Card "PROGRÉS VOTACIONS"** (`index.html`): eliminada del panel de participante y creada en el
  dashboard de admin, con la misma estructura (`.progress-wrap` + `.progress-bar` + `.progress-label`).
  Los tres `<span>` sueltos que vivían ocultos en `#dashboard-placeholders` se retiran de allí,
  porque ahora existen de verdad en la card. Sin cambios de CSS: `.progress-*` ya está en `base.css`.
- **`refreshAdminDashboard()`** (`js/screens/admin.js`): rellena la barra con `getVotingProgress()`
  (progreso por **votantes**: socios que han enviado votación definitiva sobre participantes ∪ votantes),
  el mismo cálculo que usaba el participante. Antes la barra de admin —oculta— medía otra cosa:
  fotos completamente votadas.
- **`refreshParticipantDashboard()`** (`js/screens/participant.js`): deja de pintar la barra y de
  importar `getVotingProgress` de `core/data.js`.

### Eliminado
- Variable muerta `pct` en `refreshAdminDashboard()` (`js/screens/admin.js`): alimentaba la barra
  antigua y ya no la lee nadie. Las estadísticas `stat-votes-done` / `stat-votes-total` no la usaban.

## [0.1.20] — 2026-07-09 — Galeria "per Autor": card amb el nom de l'autor

> Petición (Enric): en la galería histórica, la vista **por repte** ya muestra las fotos dentro
> de una caja con el nombre del reto; la vista **por autor** las pintaba en una rejilla plana.
> Para mantener homogeneidad, la vista por autor debe envolverse igual, con el nombre del autor
> en la cabecera.

### Cambiado
- **Vista por autor de la galería** (`js/features/galeria.js`, `renderGallery()`): la rama
  `_galFilterAuthor !== 'all'` ahora envuelve la rejilla en una `.gallery-objective-card` con
  cabecera `.gallery-group-header` = nombre del autor (vía `_authorName()`), reutilizando las
  mismas clases que la vista por repte. El pie de cada foto sigue siendo el nombre del reto.
  Sin cambios de CSS ni de HTML.

## [0.1.19] — 2026-07-07 — App Resultats (Enric): Netlify → Vercel

> Petición (Pablo): la web de clasificaciones/resultados de Enric dejó de estar en Netlify
> (`https://fem-reptes.netlify.app/`) y ahora vive en Vercel (`https://fem-resultats.vercel.app/`).
> Los botones **"Classificació general"** y **"Resultat reptes"** de la pantalla de participante
> la cargan en un iframe, así que apuntaban a un dominio muerto.

### Cambiado
- **URL base de la App Resultats** (`js/screens/participant.js`): `RESULTATS_BASE` pasa de
  `https://fem-reptes.netlify.app/` a `https://fem-resultats.vercel.app/`. Solo cambia el host;
  los query params (`role`, `view`, `embedded`) se mantienen, la app de Enric los sigue leyendo igual.
- **Docs**: `CLAUDE.md` (nota de integraciones de Enric) actualizada a la nueva URL.

## [0.1.18] — 2026-07-05 — "← Tornar" en barra fixa a amplades intermèdies

> Petición (Pablo): en la app embebida (Resultat Repte / Classificació General), el botón
> flotante **"← Tornar"** se solapaba sobre el título de la App de Enric en ventanas de
> ancho intermedio (escritorio estrecho). En móvil y a partir de ~1300px ya estaba bien.

### Arreglado
- **Botón "← Tornar" en barra fija** (`css/participant.css`): nuevo
  `@media (min-width:641px) and (max-width:1300px)` que, en ese rango, saca el botón de
  flotar (arriba-izquierda) y lo fija en una barra superior de 44px; el iframe baja esa
  fila conservando la escala (`--iframe-zoom`, sin encoger). Mismo patrón que ya se usaba
  en móvil (≤640px). Los botones de criterio (creativitat/temàtica/composició) que "se
  mueven" son de la App de Enric (iframe cross-origin) y quedan fuera de este arreglo.

## [0.1.17] — 2026-07-04 — Calendari EN PRODUCCIÓ ✅

> Hito, sin cambios de código: Pablo aplicó `sql/reptes_calendari.sql` en el proyecto
> Supabase **Normal** (tabla + `fem_apply_calendar()` + cron `fem-calendar` a las 00:05 UTC).
> Verificado por REST: la tabla existe y el reto activo ya está programado con automatización
> ON (subida 01-06 → 17-07, votación 19-07 → 22-07; nombres se revelan solos el 23-07).
> Con esto, la feature Calendari (bloques 1 y 2) queda completa en las dos bases de datos.
> Recordatorio operativo: el cierre de temática sigue siendo manual ("Finalitzar temàtica"),
> pasada la votación hay que finalizarla para computar los puntos del ranking general.

## [0.1.16] — 2026-07-04 — Calendari visual (Bloc 2): rejilla de mes amb franges per repte

> Petición (Pablo): sustituir la card de 4 campos de fecha por un **calendario visual** tipo
> Google Calendar que sea a la vez editor e histórico: rejilla del mes con flechas ‹ ›,
> marcar rangos clicando día de apertura y día de cierre, franja azul para subida y azul
> cian para votación (translúcidas, se leen los números), y nombre del reto sobre las
> franjas de los retos acabados. Solo admin.

### Añadido
- **Rejilla de mes** (`js/features/calendari.js`: `renderCalMonth()`, `calNavMonth()`,
  `calSetMode()`, `calDayClick()`; CSS `.cal-*` en `admin.css`): semana empezando en lunes,
  hoy marcado con aro, navegación de meses, franjas de **todos** los retos de
  `reptes_calendari` (histórico incluido) con tooltip y rótulo del nombre en los acabados.
- **Edición por clics "inteligente"**: chips "📤 Marcar pujada" / "🗳️ Marcar votació" (i18n
  `cal_mark_upload`/`cal_mark_voting`). Con un chip activo: clic en un día → lo marca;
  clic en otro día → **rellena el rango automáticamente** (también hacia atrás y cruzando
  meses); clic sobre la zona ya marcada → **borra el rango** (para rectificar). Iterado con
  Pablo: la 1ª versión (clic abre / clic cierra obligatorio) no dejaba rectificar a medias.
  El rango se previsualiza al momento sobre la rejilla (borrador `calDraft`), pero **no se
  persiste hasta "Desar calendari"** (mismas validaciones de siempre). El auto-refresh no
  pisa un borrador con cambios.

### Cambiado
- **Card "CALENDARI DEL REPTE" → "CALENDARI"** (`index.html`): eliminados los 4
  `<input type="date">`; sus funciones quedan integradas en la rejilla. Sin temática
  activa la rejilla sigue visible (solo consulta del histórico); se ocultan chips y
  botones. "Automatització" y "Desar calendari" se conservan tal cual.

## [0.1.15] — 2026-07-04 — Retocs Calendari + mòbil (feedback de la prova en Test)

> Petición (Pablo), tras probar 0.1.14 con Live Server en modo Test: el apagado de la
> automatización no desbloqueaba los toggles hasta pulsar "Desar calendari"; fechas del
> histórico amontonadas en escritorio y en formato americano; y en móvil, unificar la ✕
> de salir en las dos pantallas y aprovechar el ancho con las cards Controls + Vista i BD.

### Cambiado
- **Switch "Automatització" se guarda al instante** (`js/features/calendari.js`):
  `toggleCalAutomation()` ahora persiste solo `automation_enabled` (upsert) al pulsarlo,
  actualiza el estado local y (des)bloquea los toggles Pujada/Votació al momento — ya no
  hace falta "Desar calendari" para eso (las **fechas** sí se siguen desando con el botón).
  Al encenderlo aplica el calendario inmediatamente; si falla el guardado, revierte y avisa.
- **Històric de reptes**: fechas en formato `DD-MM-YY`, en una sola línea (`white-space:nowrap`)
  y celdas con `padding` — antes se amontonaban en escritorio. Los `<input type="date">` de la
  card siguen el formato del navegador (no es controlable desde la app).
- **Topbar admin en móvil**: botón "Sortir" → ✕ compacta, mismo patrón que el participant
  (`index.html`, `css/base.css`; solo CSS, sin JS).
- **Històric de reptes → tarjetas de Temàtiques**: eliminada la card "Històric de reptes" del
  dashboard (quedaba cargado); las fechas de cada reto (📤 pujada · 🗳️ votació, `dd-mm-aa`) se
  muestran ahora dentro de cada tarjeta de la pantalla Temàtiques (`renderCalendariHistoric()`
  → `getCalendariDatesHtml(objectiveId)` en `calendari.js`, usada por `tematiques.js`; estilo
  `.obj-dates` en `base.css`). El estado Obert/Tancat ya lo daba el badge propio de la temática.
- Descartado tras probarlo (iba a entrar en esta versión): cards Controls + Vista i BD lado a
  lado en móvil — el contenido no cabía; se quedan apiladas como antes.

### Arreglado
- **Participant real sin botón de salir en móvil** (`js/core/router.js`, `index.html`,
  `css/base.css`): el inline `display:none` sobre la ✕ ganaba al CSS del media query y el
  "Sortir" de texto lo oculta el CSS móvil → sin salida. Ahora para el participant normal
  manda el CSS (escritorio texto, móvil ✕); el caso admin⇄participant fuerza la ✕ con
  `display:flex` inline y se comporta igual que antes.

## [0.1.14] — 2026-07-03 — Calendari automatitzat de reptes (cron + sincronització toggles)

> Petición (Pablo): automatizar la apertura/cierre de subida y votación con un calendario de
> fechas por reto, aplicado por **pg_cron** en Supabase. Los toggles de pujada/votació deben
> **coincidir siempre** con el calendario (no descuadrarse). Versión **limpia sin snapshot**:
> los contadores participantes/votantes no se congelan (se recalculan de datos crudos, ADR-015).
> Además, pulido de la UI de la card: botones plásticos, tarjetas ajustadas y card BD solo en móvil.

### Añadido
- **Tabla `reptes_calendari`** (`sql/reptes_calendari.sql`): 4 fechas (`upload_start/end`,
  `voting_start/end`) + `automation_enabled` por reto. RLS abierta (clave anon), FK a `objectives`.
- **Función `fem_apply_calendar()` + cron `fem-calendar`** (pg_cron, diario 00:05 UTC): pone
  `uploads_enabled`/`voting_enabled` en `app_settings` según las fechas del reto activo y revela
  `names_revealed` al pasar `voting_end`. Idempotente.
- **`calendari.js` enganchado** (`js/screens/admin.js` lo importa y llama en
  `refreshAdminDashboard()`): `renderCalendariCard()` (editar 4 fechas + switch),
  `renderCalendariHistoric()` (histórico con estado Obert/Tancat derivado de las fechas),
  `saveCalendari()`.
- **`applyCalendarAutomation()`** (`js/features/calendari.js`): replica el motor en el front —
  si el reto activo tiene automatización ON, ajusta uploads/voting/names según la fecha (UTC) y
  lo **persiste sin esperar al cron**. `isCalendarAutomationActive()` para el bloqueo.
- **`toggleCalAutomation()`**: botón de plástico del switch de automatización.

### Cambiado
- **Toggles Pujada/Votació** (`js/core/router.js`, `js/screens/admin.js`): con automatización
  ON los manda el calendario y quedan **bloqueados** (clase `.locked`); `plasticPress` rechaza el
  cambio manual con toast. `applyCalendarAutomation()` se invoca en `showAdminScreen` y en el
  auto-refresh `_refreshUI`, antes de pintar los toggles.
- **UI de la card Calendari** (`index.html`, `css/admin.css`): switch "Automatització" +
  "Desar calendari" → botones `.plastic-btn` (mismo estilo que Pujada/Votació, iconos rayo y
  disquete); cards calendari/històric con `card-fit` (ancho ajustado al contenido).
- **Card "Vista i base de dades"** (`index.html`): clase `.only-mobile` → oculta en escritorio
  (los badges Admin ⇄ / NORMAL ya están en la topbar), visible en móvil.
- **`data.js`** (`loadAllData`): el select de `reptes_calendari` ya no pide columnas de snapshot.

### Notas / limitaciones
- **Sin snapshot**: la tabla no guarda `participants/voters/closed_at` (se recalculan de los
  datos crudos). El estado Obert/Tancat del histórico se deriva de `today > voting_end`.
- El **cierre/finalización de temática sigue manual** ("Finalitzar temàtica"): ni el cron ni el
  toggle acumulan al ranking general. Automatizarlo queda pendiente (la señal correcta es pasar
  `voting_end`, **no** `voting = false`).
- El bloqueo de toggles depende del estado **persistido**: tras apagar la automatización hay que
  "Desar calendari" para desbloquear pujada/votació.
- SQL aplicado de momento en proyecto **Test**; pendiente aplicarlo en **Normal**.

---

## [0.1.13] — 2026-07-02 — Progrés de votacions per votants + tancament unificat

> Petición (Pablo): el contador de progreso debe mostrar **cuántos socios han votado**,
> no cuántas fotos están completamente votadas (con muchos votantes la barra apenas se
> movía). Los que no suben foto también pueden votar y el admin que participa cuenta.
> Además: quitar el número de socio de las fotos y eliminar el botón "Tancar Votacions"
> del 100%, fusionando el revelado de nombres/ranking en el toggle de votación.

### Añadido
- **`getVotingProgress()`** (`js/core/data.js`): progreso por votantes de la temática
  activa. `voted` = socios que han **enviado votación definitiva**
  (`seguiment_votacio.es_esborrany === false`); `total` = participantes (subieron foto)
  ∪ los que enviaron; `pct = voted/total`.
- **`revealNamesAndRanking()`** (`js/screens/admin.js`): pone `namesRevealed = true` y
  re-renderiza los rankings (admin + participante). Reutilizable — la llamará el futuro
  calendario automatizado.
- **Contador de fotos** en la pestaña Fotos del admin (`index.html` `#admin-gallery-count`,
  `js/features/fotos.js`): "Total: N · Publicades: X · Pendents: Y" (ES/CA).

### Cambiado
- **Barra PROGRÉS VOTACIONS (participante)** (`js/screens/participant.js`): usa
  `getVotingProgress()` → muestra "voted/total votants" + %. Antes contaba fotos
  completamente votadas / total fotos (`requiredVotesPerPhoto = nº fotos − 1`).
- **Cierre de votación unificado** (`js/screens/admin.js`, `toggleVotingOpen`): al apagar
  el toggle de votación se revelan nombres y ranking (antes lo hacía el botón del 100%).
- **i18n** (`js/core/i18n.js`): `members_voted` "imatges votades/imágenes votadas" →
  "votants/votantes".

### Eliminado
- **Botón "Tancar Votacions"** del 100% (`index.html` `#btn-close-voting`, función
  `closeVoting()` y su `window.*` en `js/screens/admin.js`; import `confirmAction` que
  quedaba sin uso). El cierre se hace con el toggle, con el revelado fusionado.
- **Número de socio** en las fotos: pie "Participant #N" del grid de votación
  (`js/features/votacio.js`) y `#N` del overlay de la galería del admin
  (`js/features/fotos.js`, se conserva el icono ✅/⏳ de publicada/pendiente).

### Notas / limitaciones
- La barra de progreso **solo** se ve en la pantalla de participante; en el dashboard del
  admin los `admin-progress-*` siguen siendo placeholders ocultos (sin barra).
- Votar sin subir foto y que el admin cuente al participar ya funcionaban; no se tocó esa
  lógica.

---

## [0.1.12] — 2026-06-28 — Iteració de la Galeria (carrusel + filtres + repte actual)

> Petición (Pablo): iterar la galería según `Galeria de imagenes.md`. Card de portada
> como carrusel, comportamiento de los desplegables reto/autor, y que el admin vea el
> reto actual. Dato de dominio confirmado: **cada socio sube una sola foto por reto**.

### Añadido
- **Carrusel en la card GALERIA** de la pantalla principal (`index.html`,
  `css/participant.css`, `js/features/galeria.js`): capas `<img>` que se funden lento
  con brillo bajo (`brightness(.32)`, `transition opacity 1.5s`), con el label "GALERIA /
  Fotos dels reptes finalitzats" legible encima. `startGalleryCarousel()` /
  `stopGalleryCarousel()` son idempotentes (no parpadean con el auto-refresh) y limpian
  el `setInterval`. Se arrancan/paran desde `refreshParticipantDashboard()` y
  `_hideAllParticipantPanels()` (`js/screens/participant.js`).
- **Cards por reto** en la galería: nuevo contenedor `.gallery-objective-card`
  (`css/participant.css`) que agrupa la cabecera del reto + su rejilla de fotos.

### Cambiado
- **Desplegables reto/autor excluyentes** (`onGalleryFilterChange`): al elegir un valor
  concreto en uno, el otro vuelve a "Todos". Como hay 1 foto por reto/autor, nunca
  coinciden ambos concretos.
- **Render por casos** (`renderGallery`):
  - Por defecto / reto concreto → **cards por reto** (más nuevo arriba), dentro rejilla
    **alfabética por autor**; label de cada foto = autor.
  - Autor concreto → rejilla **cronológica** (nuevo→antiguo); label de cada foto =
    **nombre del reto**.
- **El admin ve el reto actual** (`getFinishedGalleryPhotos`, `_visibleObjectiveIds`):
  por **rol real** (`currentUser.role === 'admin'`, también en "veure com a participant"),
  la galería incluye el reto activo `state.currentObjective`. La fuente añade además las
  fotos **no publicadas** del reto actual (las subidas aún no publicadas). La card de
  galería se muestra al admin aunque no haya retos finalizados, si hay reto activo
  (`applyParticipantButtonVisibility`).

### Notas / limitaciones
- Durante la votación el admin verá el **autor** de las fotos del reto actual aunque no
  estén reveladas (decisión a confirmar si molesta).
- El carrusel de la card también incluye, para el admin, fotos del reto actual.
- El carrusel carga las imágenes a tamaño completo de Cloudinary (sin miniaturas): a
  vigilar rendimiento; pendiente optimizar si hace falta.
- La rama de cabeceras `.gallery-group-header` se reutiliza dentro de las cards.

---

## [0.1.11] — 2026-06-28 — "Resultat Repte" → App d'Enric a pantalla completa

> Petición (Pablo): que el botón **"RESULTAT REPTE"** abra directamente la App
> Resultats de Enric (como ya hacía "CLASSIFICACIÓ GENERAL"), embebida dentro de
> FEM y ocupando toda la ventana para que no se vea encogida.

### Cambiado
- **Botón "RESULTAT REPTE"** (`index.html`): de `showParticipantResultats()` (vista
  nativa con desplegable) a `openEmbedded('resultat')` — App de Enric en iframe con
  `?role=<rol>&view=resultat&embedded=true`. El rol se calcula solo desde el usuario.
- **Panel embebido a pantalla completa** (`css/participant.css`): el iframe pasa a
  ocupar toda la ventana (`100vw × 100dvh`, `position:fixed`) mediante la clase
  `body.embedded-fullscreen`, que pone `openEmbedded()` y quita
  `_hideAllParticipantPanels()` (`js/screens/participant.js`) al salir por cualquier vía.
- **Zoom del iframe** ajustable con la variable `--iframe-zoom` (por defecto `1.15`)
  vía `transform: scale` — parche para agrandar el contenido de Enric desde fuera.
- **Botón "← Tornar"** flotante sobre el iframe (margen izquierdo) y un poco más grande.

### Eliminado
- **Título duplicado** del panel embebido (`#embedded-title` en `index.html` + su
  asignación en `participant.js`): el título lo pinta la propia App de Enric dentro
  del iframe; nuestro `<h2>` blanco sobraba.
- **Controles flotantes** de FEM (usuario/idioma/salir) arriba a la derecha: se
  descartan por decisión de Pablo (queda más limpio; siguen en la página principal).

### Notas / limitaciones
- La vista nativa `showParticipantResultats()` / `onResultatsRepteChange()` y el panel
  `#participant-panel-resultats` quedan en el código **sin enlazar** (referencia).
- **Cross-origin**: no se pueden ajustar las fuentes internas de la App de Enric desde
  FEM; `--iframe-zoom` es la única palanca. La solución definitiva sería rehacer la
  pantalla nativa dentro de FEM en lugar de embeber.
- Posible barra de scroll horizontal mínima por `100vw` en Windows (a vigilar).

---

## [0.1.10] — 2026-06-27 — Despliegue como sitio estático (Netlify)

> Objetivo: publicar la app online. Es HTML/CSS/JS puro sin build, así que cualquier
> hosting estático sirve. Se decanta por **Netlify** (mismo hosting que la App Resultats
> de Enric) por ser gratis con repos privados.

### Añadido
- `vercel.json` — config para servir como estático en Vercel (`framework: null`, sin build).
  Se creó porque Vercel detectaba `server.js` y trataba el proyecto como Node. Se conserva
  por si en el futuro se usa Vercel.
- `netlify.toml` — config de Netlify: sitio estático servido desde la raíz (`publish = "."`,
  sin `command`). Cada `push` a `main` redespliega automáticamente.

### Eliminado (del repo, no del disco local)
- `server.js` e `Iniciar_FEM.bat` — eran el **arranque local de desarrollo** (servidor estático
  en `localhost`), no forman parte de la app desplegada. Se sacan del control de versiones con
  `git rm --cached` y se ignoran en `.gitignore`; siguen en el disco de Pablo para uso local.

### Notas
- **GitHub Pages descartado**: el repo es privado y Pages en privados requiere plan de pago.
- **Vercel descartado de momento**: empujaba al plan Pro (proyecto bajo organización/Team).

---

## [0.1.9] — 2026-06-27 — Reskin base: estilo de la App Resultats (Enric)

> Petición (Pablo): que toda la app adopte el estilo elegante de la web de Enric
> (tipografías y colores). Fase 1 ("base y vemos"): variables + fuentes. Pendiente
> afinar los colores hardcodeados (rgba/inline) en una segunda tanda.

### Cambiado
- **Tipografías** (`index.html` carga Google Fonts; variables en `css/base.css`):
  - Cuerpo `--font-body`: Inter → **Barlow**.
  - Nueva `--font-cond`: **Barlow Condensed**, aplicada a **botones** (`.btn`) y **labels**
    de formulario (`.form-group label`) — el uso condensado característico de Enric.
  - Títulos `--font-display`: **Bebas Neue** (ya se usaba; sin cambios).
- **Paleta** (`:root` de `css/base.css`) alineada con Enric, más sobria y mate:
  fondo `#091929`, superficies `#0d2137`/`#102748`/`#163254`, **bordes sólidos** `#1a3566`
  (antes azul translúcido brillante), apagado `#5b7aa8` (más tenue), acento `#4b8ef5`,
  oro `#f5a623`. Nueva variable `--gold`.
- **Fondo un poco más oscuro** (petición de Pablo): `--bg` `#091929` → `#06121e`, `--bg2` → `#08182a`,
  conservando el brillo radial y la textura (solo se baja la base, el glow sigue resaltando).
- Como la app usa variables CSS de forma consistente, el cambio se propaga a ~todas las pantallas.

### No cambiado (a propósito)
- **Fondo con brillo radial + textura de ruido**: se mantiene (decisión de Pablo).
- Colores **hardcodeados** (rgba en CSS y ~94 estilos inline del HTML): quedan para una 2ª tanda.

### Pendiente de verificación manual
- Revisar en navegador login, admin y participante: legibilidad del texto en Barlow, contraste
  del `--text-muted` más tenue, y que botones/labels en Barlow Condensed no queden apretados.

---

## [0.1.8] — 2026-06-27 — Resultados: Classificació General (Enric embebida) + Resultat Repte nativo

> Implementa el **Documento 2 de Enric** (`enric_Integracio-Botons-Reptes.md`). Complementa la
> persistencia de sesión del Documento 1 (ya en 0.1.4), que pasa el rol a la App Resultats.

### Verificado (cambió respecto al bloqueo de 0.1.4)
- La web de Enric **ya lee los parámetros de URL**. La URL buena es la **raíz**
  `https://fem-reptes.netlify.app/` (la `FEM-Resultat_Ranquing.html` de los documentos da **404**).
  <!-- → movida a Vercel: https://fem-resultats.vercel.app/ (v0.1.19) -->
  - `role` → `admin` ve todos los retos; `participant`/sin sesión solo los finalizados.
  - `view=resultats` → resultados del reto · `view=classificacio` → ranking acumulado (`switchToGeneral`).
  - `embedded=true` → su CSS `body.embedded` **oculta su topbar/título/controles** (no se duplican).

### Añadido — Classificació General (Enric, embebida)
- **Panel embebido** `participant-panel-embedded` dentro de `screen-participant` (así la topbar
  y la bottom-nav nuestras **siguen visibles**): un `<iframe id="iframe-resultats">` + botón "← Tornar".
- Funciones `openEmbedded(view)` / `closeEmbedded()` en `js/screens/participant.js` (expuestas en
  `window`). Construyen la URL `…/?role=&view=&embedded=true` con el rol de `state.currentUser`
  (o `participant` por defecto). `closeEmbedded()` vacía el `src` del iframe y vuelve a la home.
- Clave i18n `embedded_back` (CA "← Tornar" / ES "← Volver").
- Enlazan a Enric: `nav-card-classificacio` (home) y `bnav-rank` (🏆 Ranking, bottom-nav móvil),
  ambos con `openEmbedded('classificacio')`.

### Añadido — Resultat Repte (NATIVO, sin iframe)
> Motivo: el modo `embedded` de Enric oculta su selector de retos (`#repteSelect` está en
> `.controls-row`, que su CSS esconde). En vez de depender de un cambio en su web, se reconstruye
> la vista de resultados por reto con el motor de cálculo que la app **ya tenía**.
- `nav-card-resultats` (home) → `showParticipantResultats()` (vista propia, no Enric).
- Nuevo panel `participant-panel-resultats`: **desplegable de retos** (reciente→antiguo)
  + ranking **detallado por criterios** (Creativitat / Composició / Temàtica + nota total).
- **Diferenciado por tipo de cuenta (rol real)**: el **admin** ve **todos** los retos en el
  desplegable (incluido el actual y los inactivos); el **participante**, solo los **finalizados**.
  Misma regla que la App Resultats de Enric. Implica que el admin también los ve en modo
  "veure com a participant" (excepción consciente a la réplica exacta del socio).
- **Reto no finalizado muestra las fotos subidas aunque no estén publicadas**: en un reto
  finalizado el ranking solo incluye las fotos que concursaron (`publishedPhotos`); en el reto
  actual/inactivo (que solo ve el admin) incluye también las **no publicadas** (`state.photos`),
  para que el admin vea el estado real. `getPhotoScoreBreakdown` ahora localiza la foto en ambas
  listas. (Sin fuga de anonimato: solo el admin ve retos no finalizados.)
- En `js/features/ranking.js`:
  - `getPhotoScoreBreakdown(photoId)` → `{ creativity, theme, composition, final }`. `getPhotoScore`
    pasa a delegar en ella (mismo resultado, sin cambiar comportamiento).
  - `computeRankingForObjective(objId)` y `renderResultatsRepte(objId, listId)`. Usa el **nombre real**
    del autor (retos finalizados no son anónimos, como la galería).
- `showParticipantResultats()` / `onResultatsRepteChange()` en `participant.js` (en `window`).
- CSS `.rank-criteria` en `css/base.css` (fila fina con las 3 notas, responsive).
- **Visibilidad**: la card "Resultat Repte" pasa a estar **siempre visible** (antes solo con reto
  activo y nombres revelados). Si aún no hay retos finalizados, muestra aviso y oculta el desplegable.
  Sigue respetando el override de admin `force_hide_resultats`.

### No cambiado (a propósito)
- El **cálculo de puntuación** y la vista interna antigua (`showParticipantClassificacio`, panel
  `participant-panel-ranking` con pestañas) **se conservan** sin enlazar. Reversible.

### Pendiente de verificación manual
- En navegador (HTTP, no `file://`):
  - **Resultat Repte**: el desplegable lista los retos finalizados; al cambiarlo se actualiza el
    ranking con las notas por criterio y la nota total; sin finalizados, sale el aviso.
  - **Classificació General** y **🏆 Ranking** (móvil): cargan la web de Enric sin su topbar
    (embedded) y "← Tornar" vuelve a la home. Como admin se ven todos los retos; como participante,
    solo finalizados. Recargar (F5) dentro: la sesión se mantiene.

---

## [0.1.7] — 2026-06-27 — Galería histórica de retos finalizados

> Petición (origen Enric): poder revisar todas las fotos de retos ya cerrados,
> también para las reuniones de valoración del club. Acceso desde el participante.

### Añadido
- **Pantalla/panel Galería** para participantes (el admin entra con "veure com a
  participant"): muestra **solo** fotos de temáticas finalizadas (`status: 'finished'`),
  con el **nombre del autor**. Nuevo módulo `js/features/galeria.js`.
- **Tarjeta GALERIA** colocada **al lado de la card "La meva foto"** (50/50 en escritorio,
  apiladas en móvil). Visible solo si hay algún reto finalizado.
- **Dos filtros** (desplegables) con agrupación en cabeceras ("box fino"):
  - Reto: "tots els reptes" → agrupa por reto (cronológico, reciente→antiguo).
  - Reto concreto + "tots els autors" → agrupa por autor (alfabético).
  - Ambos concretos → cuadrícula directa.
- En el **visor a pantalla completa** se añade el **nombre del autor** debajo (fuente Arial),
  **solo cuando se abre desde la galería** (el autor se pasa en la lista de fotos). En la
  votación las fotos siguen **anónimas**. Reutiliza el zoom/swipe/teclado ya existentes.
- Textos CA/ES de la galería en `js/core/i18n.js`.

### Eliminado
- Botón **"Veure Fotos"** y el **mosaico embebido** del reto actual (HTML, funciones JS
  `togglePhotoMosaic`/`renderPhotoMosaic`/`getMosaicPhotosList`/`openMosaicLightbox` e imports
  huérfanos). Su función queda cubierta por la nueva galería.

### Pendiente de verificación manual
- Probar en navegador con una temática finalizada y fotos publicadas: filtros, agrupación,
  visor con autor, y el reparto foto/galería en escritorio y móvil.

---

## [0.1.6] — 2026-06-27 — Modo Test aislado: carpeta Cloudinary propia + auto-login + sello visual

> Objetivo: poder trastear en la BD de pruebas con tranquilidad, sin ensuciar producción
> ni teclear login cada vez, y sabiendo siempre de un vistazo que estás en Test.

### Añadido
- **Carpeta Cloudinary separada para Test** (`js/features/fotos.js`): en modo test las fotos
  suben a `FemReptes_TEST/<temàtica>` en vez de `FemReptes/<temàtica>`. Antes ambas BD
  compartían carpeta (los registros iban a la BD test, pero los archivos al mismo Cloudinary).
  No requiere tocar el panel de Cloudinary (el preset ya acepta el parámetro `folder`);
  la carpeta se crea sola al subir la primera foto en test.
- **Auto-login al ir a Test** (`js/core/config.js` `switchDbMode` + `enterAsEmail` en
  `js/screens/login.js`): al cambiar a test ya no pide usuario/contraseña; reentra con el
  **mismo email** en la BD de test (sin guardar contraseñas). Si ese email no existe en test,
  cae al login normal. **Volver a Normal (producción) sigue pidiendo login** por seguridad.
- **Sello "TEST"** (`index.html` `#test-stamp` + `css/base.css`): estampado rojo fijo abajo a la
  derecha, visible solo en modo test (`_updateTestStamp()`), `pointer-events:none` para no
  estorbar clics. Se actualiza en boot, al cambiar de BD y al renderizar el panel admin.

### Notas
- Para que el auto-login funcione, el **mismo email** debe existir en ambos proyectos Supabase.
- El sentido Test→Normal es intencionadamente más estricto (login) por entrar en producción.

---

## [0.1.5] — 2026-06-27 — Título/descripción opcional en las fotos

> Petición de Enric: que el autor pueda dar una orientación de qué quiere transmitir con su foto.

### ⚠️ REQUIERE cambio en Supabase (ejecutar ANTES de usar)
```sql
ALTER TABLE photo_submissions ADD COLUMN caption text;
```
Sin esta columna, `loadAllData()` falla (pide `caption` en el SELECT) y la app no carga datos.

### Añadido
- Campo de texto **opcional** (un único cuadro título/descripción, máx. 300 caracteres) en la
  pantalla de subir foto, tanto para socio como para admin (`index.html`).
- Traducciones CA/ES (`caption_label`, `caption_placeholder`) en `js/core/i18n.js`.
- El texto se guarda en `photo_submissions.caption` al subir (`js/features/fotos.js`) y se carga
  en `state` (`js/core/data.js`, campo `caption`).
- Se muestra en el **visor a pantalla completa** (lightbox): el visor busca el texto por la URL
  de la foto (`js/ui/lightbox.js`), así no hubo que tocar las llamadas que abren el visor.

### Notas
- Decisión (Pablo): se muestra **solo al ver la foto en grande**, no en la cuadrícula de votación
  (en móvil las fotos se ven pequeñas). Matiz: si se amplía una foto **durante** la votación, el
  texto también aparece; si en algún caso quisiera transmitir identidad, rompería el anonimato.
  Es opcional y responsabilidad del autor; ajustable si se quiere ocultar durante la votación.

---

## [0.1.4] — 2026-06-27 — Persistencia de sesión (no re-login al refrescar)

> Adaptación a la versión modular del **Documento 1 de Enric**
> (`Enric_Integracio-Reptes-Resultats.md`).

### Añadido
- Persistencia de sesión con `sessionStorage` en `js/screens/login.js`:
  - Helpers `saveSession()` / `readSession()` / `clearSession()` (guardan solo `id, name, role`;
    nunca la contraseña).
  - `init()` restaura la sesión al arrancar: si hay sesión válida, entra directo a la pantalla
    (admin o participante) sin pasar por el login. Busca el usuario completo en `state.users`
    (datos frescos de Supabase), así que un cambio de rol se refleja al recargar.
  - Se guarda la sesión al hacer login, al crear contraseña nueva (reset) y al registrarse.
  - Se borra al hacer `logout()` (y por tanto también al cambiar de BD Normal/Test y al darse de baja).

### Notas
- `sessionStorage` se borra al cerrar la pestaña (comportamiento buscado para una app de club).
- Todo va envuelto en `try/catch` por si el navegador bloquea el almacenamiento (modo privado):
  si falla, simplemente no persiste y se comporta como antes.

### Pendiente — Documento 2 de Enric (botón "Resultats" → web de Enric embebida)
- URL de la app de Enric: **https://fem-reptes.netlify.app/** (Netlify; la app vive en la raíz `/`,
  NO en `FEM-Resultat_Ranquing.html`, que da 404).
  <!-- → movida a Vercel: https://fem-resultats.vercel.app/ (v0.1.19) -->
- El iframe es técnicamente posible (su servidor **no** envía `X-Frame-Options` ni CSP que lo bloqueen).
- **BLOQUEO funcional:** la versión desplegada **no lee** los parámetros que prometía el documento:
  no usa `role` (no filtra por rol), ni `view` (no abre directo en resultats/classificacio; navega
  con sus botones internos), ni `embedded=true` (no oculta su barra superior → se vería duplicada).
- **Decisión (Pablo):** un único botón **"Resultats/Resultados"** (según idioma) que muestre la web
  de Enric embebida tapando su barra superior. A la espera de que **Enric actualice su web** (o pase
  su código para integrarlo aquí). Hasta entonces, NO se tocan los botones del ranking.

---

## [0.1.3] — 2026-06-27 — "Veure com a participant" ahora es réplica exacta del participante

### Añadido
- Helper `actingAsAdmin()` en `js/core/state.js`: devuelve `true` solo si el usuario es admin
  **y NO** está en modo "veure com a participant". Es la nueva regla central para decidir si
  la vista debe comportarse como admin o como socio.

### Arreglado
- Cuando un admin pulsaba "veure com a participant", la pantalla se veía como la del socio pero
  las funciones seguían tratándolo como admin. Ahora la experiencia es **idéntica** a la de un
  participante real. Se reemplazó `currentUser.role === 'admin'` por `actingAsAdmin()` en los
  6 puntos que afectan a la vista participante:
  - `screens/participant.js` — visibilidad de las nav-cards (Votar/Resultats/Classificació).
  - `features/ranking.js` — el ranking de la temàtica respeta el candado hasta revelar noms.
  - `features/fotos.js` — sección de subida respeta `force_hide_upload` y subida cerrada; y el
    refresco tras subir/borrar foto actualiza la pantalla correcta.
  - `ui/lightbox.js` — el botón de descarga solo aparece en modo admin real.
  - `core/router.js` — el auto-refresco (polling) actualiza la pantalla visible correcta.

### No cambiado (a propósito)
- El rol **real** se sigue usando donde toca: login (a qué pantalla ir), gestión de socios,
  lógica del toggle admin↔participant y texto del badge. El nombre/foto del admin en modo
  participante siguen siendo los suyos (es identidad, no función).

### Pendiente de verificación manual
- Probar en navegador: como admin, entrar en "veure com a participant" y comprobar que botones,
  ranking (candado), subida de foto y descargas se comportan igual que para un socio normal.

---

## [0.1.2] — 2026-06-26 — Lanzador local (arregla el "login no reacciona")

### Añadido
- `server.js` — mini-servidor estático Node (sin dependencias) que sirve la carpeta por HTTP
  con los Content-Type correctos. Crítico: `.js` → `text/javascript` (lo exigen los módulos ES).
  Bloquea path traversal y prueba puertos consecutivos si el 8000 está ocupado.
- `Iniciar_FEM.bat` — doble clic: arranca `node server.js` y abre el navegador en
  `http://localhost:8000`. Recupera el flujo "doble clic" sirviendo por HTTP.
- Aviso anti-`file://` en `index.html` (script normal, no module): si se abre por doble clic,
  muestra instrucciones para usar `Iniciar_FEM.bat` en vez de dejar los botones muertos.

### Arreglado
- "El login no reacciona": se servía por `file://` y el navegador bloqueaba los módulos ES.
  Ahora, con el lanzador, la app carga por HTTP y el botón ENTRAR responde. **No se tocó la
  lógica del login.** Verificado: `server.js` devuelve `text/javascript` para `js/main.js`,
  `text/css` para el CSS y 404 para rutas inexistentes.

### Pendiente de verificación manual
- Smoke-test end-to-end en navegador con Supabase real (login admin/participante, votar, ranking).

---

## [0.1.1] — 2026-06-26 — CLAUDE.md descriptivo + diagnóstico del login

### Cambiado
- `CLAUDE.md` reescrito al formato de la plantilla `AGENTS.md` (Stack, Comandos, Estructura,
  Convenciones, No hagas, Flujo de trabajo, Documentación). Pasa de ser un plan de desglose a
  un **documento descriptivo de la app** (qué es, para qué sirve, cómo está organizada).

### Diagnosticado (pendiente de arreglar — tarea aparte)
- Bug "el login no reacciona": **no es un bug de código**. Causa = abrir `index.html` por
  `file://` (doble clic); el navegador bloquea los módulos ES, `main.js` no arranca y los
  `onclick` quedan muertos. Verificado que sintaxis, imports/exports y `window.*` están OK.
  Solución prevista: lanzador local (`.bat` + mini-servidor Node) que sirva por HTTP.

---

## [0.1.0] — 2026-06-13 — Desglose del monolito a estructura modular

### Añadido
- Estructura modular a partir de `Test/Index_60.html` (monolito, 5.706 líneas):
  - `index.html` (núcleo) + `css/` (base, login, admin, participant) + `js/` con
    `core/` (state, config, i18n, data, router), `ui/` (toast, modals, lightbox),
    `features/` (ranking, votacio, fotos, socis, tematiques) y `screens/` (login, admin,
    participant), orquestado por `js/main.js`.
- Patrón de carga: módulos ES con `import/export` para dependencias internas y
  `window.*` para las funciones llamadas desde `onclick` del HTML.

### Cambiado (mínimos, sin tocar lógica)
- `_hasUnsavedVotes` → `window._hasUnsavedVotes` (se reasigna entre módulos; los `import`
  de ES son de solo lectura).
- Botón de descarga del lightbox: usa `downloadCurrentFullscreen()` en lugar de la global
  `_fullscreenFileName` (ahora de ámbito de módulo).
- El JS se sirve como `<script type="module" src="js/main.js">`.

### Verificado
- Validación estática: sintaxis ESM (`node --check`), resolución de `import/export`,
  cobertura `onclick`→`window` y ausencia de llamadas cruzadas huérfanas. Todo OK.
- **Prueba en navegador (2026-06-13): el login reacciona correctamente** al servir la app
  por HTTP con un servidor local (`python -m http.server 8000`). La app carga y responde.

### Nota de desarrollo
- Abrir con doble clic (`file://`) **no funciona**: el navegador bloquea los módulos ES por
  política de mismo origen (CORS). En local hay que servir por HTTP (Live Server de VS Code,
  `python -m http.server` o `npx serve`). En Vercel funciona directo, sin cambios.

### Pendiente
- Copiar `manifest.json` y `sw.js` desde la raíz de producción (PWA) cuando se despliegue.
- Smoke-test completo comparando contra el monolito (subir/publicar foto, votar + enviar,
  ranking, finalitzar temàtica, socis, CA/ES, lightbox/zoom, modo Normal/Test).
