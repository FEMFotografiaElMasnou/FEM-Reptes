# FEM VOTACIONS — App de votación fotográfica (versión modular)

App web para el club **FEM Fotografia El Masnou** (~50 socios). Cada temática, los socios
suben una foto, votan las del resto (creatividad, temática, composición) y la app calcula un
ranking por temática y un ranking general acumulado. Esta carpeta (`FEM_app_Modular/`) es la
versión **modular** del antiguo monolito `Index_60.html`: misma funcionalidad, repartida en
módulos por pantalla y por función.

## Stack
- Lenguaje: HTML + CSS + **JavaScript con módulos ES nativos** (`import`/`export`). Sin framework.
- Runtime / build: **ninguno** — no hay build step ni bundler. El navegador carga los módulos tal cual.
- Base de datos: **Supabase** (Postgres + API REST/JS). La seguridad real recae en las RLS, no en ocultar la clave anon.
- Imágenes: **Cloudinary** (cloud `dz1n0g9yg`, preset `Fem_Apps`).
- Hosting: **Vercel** (sitio estático, `vercel.json`). Repo público en GitHub:
  `https://github.com/FEMFotografiaElMasnou/FEM_app_Modular`. Proyecto Vercel:
  `https://vercel.com/femfotografiaiapps/fem-app/`, vinculado al dominio
  `https://www.femfotografiaelmasnou.cat`. El deploy a Vercel se dispara
  **automáticamente** con cada push a GitHub — ya NO hace falta el
  `git pull && npx vercel --prod` manual (actualizado 2026-07-13; la limitación
  del plan Hobby con colaboradores externos que motivaba el paso manual ya no
  aplica / no se reproduce en la práctica). `netlify.toml` eliminado (2026-07-09), ya no se usa Netlify.
- Modo BD: conmutable **Normal / Test** (dos proyectos Supabase), persistido en `localStorage`.

## Comandos
- **Servir en local** — los módulos ES **no funcionan por `file://`** (doble clic), hace falta HTTP:
  - VS Code → extensión **Live Server** → clic derecho en `index.html` → "Open with Live Server".
  - o terminal en esta carpeta: `npx serve` · `python -m http.server 8000` · `node server.js` (si existe el lanzador).
- **Validar un módulo** — `node --check js/ruta/al/modulo.js` (solo sintaxis, no resuelve imports).
- **Desplegar** — `git push` a GitHub; Vercel despliega automáticamente el sitio
  (vinculado a `https://www.femfotografiaelmasnou.cat`), sirviendo los archivos
  tal cual, sin cambios respecto al monolito. No hace falta ningún comando de
  Vercel manual.

## Estructura del proyecto
- `index.html` — núcleo: contenedores de pantalla (login/admin/participant) + modales. Carga `js/main.js` como módulo.
- `css/` — `base.css` (variables, reset, layout), `login.css`, `admin.css`, `participant.css`.
- `js/main.js` — punto de entrada: importa todo el grafo, ata listeners globales y arranca `init()`.
- `js/core/` — `state` (fuente única de verdad), `config` (cliente Supabase + Cloudinary + modo BD),
  `i18n` (traducciones CA/ES), `data` (`loadAllData` y guardado en Supabase), `router` (pantallas, nav, auto-refresh).
- `js/ui/` — `toast` (loader + avisos), `modals` (abrir/cerrar/confirmar), `lightbox` (zoom, swipe, descarga).
- `js/features/` — `ranking`, `votacio`, `fotos`, `socis`, `tematiques`.
- `js/screens/` — `login`, `admin`, `participant` (orquestan las features).
- Referencia histórica (NO tocar): monolito `Test/Index_60.html` (5.706 líneas), origen del desglose.

## Convenciones
- **`onclick` → `window.*`**: las funciones llamadas desde `onclick=` del HTML se exponen en `window`
  (ej. `window.handleLogin = handleLogin`). Entre módulos, las dependencias van por `import/export`.
- **`state` es la única fuente de verdad** (`js/core/state.js`). Los módulos lo importan, no duplican estado.
  `_hasUnsavedVotes` vive en `window` porque se reasigna entre módulos.
- **Roles**: `admin` (temáticas, socios, publicar fotos, abrir/cerrar votación, modo BD) y `participant` (subir foto, votar, ranking).
- **i18n**: todo texto visible pasa por `t(key)` / `data-i18n`; idiomas catalán (`ca`, por defecto) y castellano (`es`).
- **Comportamiento idéntico al monolito**: modularizar ≠ refactorizar lógica. Conservar nombres de funciones.

## No hagas
- No abrir la app por **`file://`** (doble clic): el navegador bloquea los módulos ES y nada reacciona. Servir siempre por HTTP.
- No tocar el monolito **`Index_60.html`**: es la referencia, se conserva intacto.
- No **mezclar** modularización con cambios de lógica: si ves un bug, anótalo y arréglalo en una tarea aparte.
- No **borrar nada de Supabase desde el frontend** (ADR-015). El cliente no elimina datos del servidor.
- No subir claves sensibles más allá de la anon de Supabase (diseñada para ir en el cliente).

## Flujo de trabajo
- **Revisa SIEMPRE bien el código antes de cambiar nada**: lee las funciones implicadas y quién
  las llama, para no romper lo que ya funciona. Si algo no cuadra o detectas un riesgo, **avísale a Pablo**.
- Antes de una tarea no trivial, propón un plan y espera el OK de Pablo.
- Una tarea (un deber) a la vez; al terminar, di qué cambiaste para revisarlo. No juntar deberes distintos.
- Si no estás seguro al 80%, pregunta. No inventes.
- Tras tocar un módulo, valida sintaxis y prueba con servidor local antes de dar la iteración por buena.

## Lliurament de fitxers modificats (Enric)

> Instrucció d'Enric (2026-07-19), per evitar errors en desplegar canvis
> quan no es treballa directament sobre el repositori (p. ex. sessions on
> només es puja el `.zip` de l'app). Aplica sempre que es lliurin canvis
> com a fitxers/zip en comptes de com a commit/PR.

- **Al xat**: llistar els fitxers modificats amb la seva **ruta destí dins
  l'app** (ex. `js/features/fotos.js`, `js/core/data.js`), no només el nom.
- **Al ZIP**: incloure **només** els fitxers que cal actualitzar — mai
  l'app sencera —, **sense estructura de carpetes**: tots plans a l'arrel
  del ZIP. Enric els col·loca manualment a la ruta corresponent seguint la
  llista del xat.

## Documentación
- **RAG del producto** (fuente de verdad funcional, fuera de esta carpeta):
  `D:\Mis proyectos\FEM_Reptes\Instrucciones\Archivos MD\...` → `PRD.MD`, `Components.MD`, `Decisions.MD` (ADRs), `Changelog.MD`, `Setup.MD`.
  Antes de tocar lógica, releer `Components.MD` y `Decisions.MD`.
- **Changelog de la modularización**: `CHANGELOG.md` (en esta carpeta).
- **Integraciones de Enric (YA aplicadas)**: `Enric_Integracio-Reptes-Resultats.md` (persistencia de sesión, v0.1.4) y `enric_Integracio-Botons-Reptes.md` (App Resultats embebida, v0.1.8). La App Resultats vive en la **raíz** `https://fem-resultats.vercel.app/` (antes en Netlify; movida a Vercel el 2026-07-07) y lee `?role=&view=&embedded=true`.
- **Decisión de arquitectura**: módulos ES por pantalla + puente `window.*` para `onclick`. Al cerrar la fase, actualizar ADR-001.

## Estat actual de la BD — Racionalització `objectives`/`reptes_calendari` (Enric, 2026-07-24)

> **Llegir abans de tocar res relacionat amb reptes/calendari.** Aquesta secció
> és la referència viva de l'esquema real; el pla de sota ("Pla — Revisió de
> l'admin...") es manté intacte com a **historial de com s'hi va arribar**,
> però les seves mencions a `reptes_calendari` com a taula activa ja **no**
> reflecteixen l'estat actual — vegeu la nota que hi ha just a sota del títol
> del pla. Diagnòstic complet i registre pas a pas de la migració (aplicada a
> Normal i Test, verificada amb un repte real "Contrallums"):
> `Diagnostic_objectives_reptes_calendari.md` (fora d'aquesta carpeta, la té Enric).

**`objectives` és ara l'única font de veritat d'un repte**, calendari inclòs:

| Columna | Significat |
|---|---|
| `id`, `name`, `description`, `status`, `created_by` | Identitat del repte (`status`: `active`/`finished`/`inactive`) |
| `start_date`, `end_date` | Data de creació / de finalització del repte (**no** és calendari de pujada-votació) |
| `uploads_enabled`, `voting_enabled` | Estat efectiu d'avui (el que llegeix la resta de l'app) |
| `cal_upload_start`, `cal_upload_end`, `cal_voting_start`, `cal_voting_end` | Finestres de pujada/votació (abans a `reptes_calendari`) |
| `upload_mode`, `voting_mode` | `calendari` / `obert` / `tancat` per fase (abans a `reptes_calendari`) |

**01/08/2026**: `objectives.names_revealed` i `photo_submissions.revealed` **ja no existeixen** —
eliminades junt amb la fila `app_settings.ranking_hidden`/`names_revealed`: cap consumidor real
en cap de les dues apps (FEM-Reptes ni FEM-Foto). Detall complet a
`sql/2026-08-01_neteja_names_revealed_ranking_hidden.sql`, repositori de FEM-Foto.

`reptes_calendari` **existeix encara a la BD però ja no rep cap lectura ni escriptura** —
ni el frontend (`js/core/data.js`, `js/features/calendari.js`) ni el cron
(`fem_apply_calendar()`, `pg_cron`, 00:05 UTC) hi toquen res. Es manté només
per un període d'observació abans d'eliminar-la (ADR-015: eliminar-la sempre
serà una acció manual a l'editor SQL de Supabase, mai des del frontend).
`getActiveCalendar(objectiveId)` (`calendari.js`) segueix sent el punt d'accés
correcte als camps de calendari d'un repte — internament ja llegeix `objectives`,
no cal que cap altra part de l'app ho sàpiga.

**Pendent, sense pressa** (no afecta el funcionament, és neteja): eliminar
`reptes_calendari` i renombrar `objectives` → `reptes` (alinearia el nom amb
el vocabulari que ja fa servir tota la resta de l'app). Si es fa el renombrat,
cal tocar també `FEM-Resultats/src/App.jsx` (2 línies, `.from('objectives')` → `.from('reptes')`)
— l'app de Resultats només hi llegeix `id`/`name`/`status`, no toca res de calendari.

SQL de referència de tot el que s'ha aplicat: `sql/2026-07-24_racionalitzacio_objectives.sql`.

---

## Pla — Revisió de l'admin i suport multi-repte (en curs, 2026-07-17)

> **Nota (2026-07-24):** aquest pla es manté intacte com a historial — és el
> que va crear `reptes_calendari` i el que en va justificar cada columna. Per
> a l'esquema **real i actual**, vegeu la secció de sobre
> ("Estat actual de la BD"): `reptes_calendari` ha quedat absorbida dins
> `objectives` i les mencions de sota que la donen per taula activa (p. ex. el
> paràgraf "La taula `reptes_calendari` és l'excepció..." just aquí baix, o
> `sql/reptes_calendari_fase4.sql` a la Fase 5) ja no apliquen literalment.

> Origen: revisió de l'apartat admin demanada per Pablo (Panell de Control i Reptes).
> Abans de tocar res d'aquest pla, **llegir aquesta secció sencera i el codi implicat**
> (és el mateix criteri que "Flujo de trabajo" de dalt: revisar bé abans de canviar).

### Punt de partida important
Els commits `f341dc8` i `043abc8` (targeta Repte+Foto unificada, targeta Votar amb
mosaic) van preparar la **UI** perquè cada repte tingui un bloc autocontingut, però
el motor de dades segueix essent d'**un sol repte actiu** arreu:
- `state.currentObjective` és singular.
- `saveObjective()` (tematiques.js) bloqueja crear un repte si ja n'hi ha un actiu o
  no finalitzat.
- `uploads_enabled` / `voting_enabled` / `namesRevealed` són flags **globals** a
  `app_settings`, no per repte.
- El cron `fem_apply_calendar()` (Supabase) escull `where status='active' limit 1`.

La taula `reptes_calendari` és l'excepció: ja guarda les 4 dates per `objective_id`,
i és la base de les fases 2/3 de sota.

### Decisions preses (Pablo, 2026-07-17)
1. **Estat del repte**: es manté com a badge de lectura (actiu/finalitzat), lligat
   únicament al botó "Finalitzar" — NO es converteix en un desplegable editable.
2. **Calendari per repte**: opció simple — `<input type="date">` natius (4 per
   repte, amb icona que obre el picker del navegador), NO es replica la graella
   visual mensual actual un cop per repte.
3. **Multi-repte actiu**: es desbloqueja. Ha d'existir la possibilitat de tenir
   més d'un repte amb `status='active'` alhora.
4. **Accés a votar**: no és un botó nou dins la targeta — el parell existent
   `card-objective-photo` ↔ `vote-mosaic-section` (que ja se substitueixen l'un a
   l'altre segons `voting_enabled`) es repetirà sencer, un cop per repte actiu.
5. **Calendari automàtic vs. masters manuals — REVISAT 2026-07-18** (substitueix
   el disseny de "botó de plàstic + `automation_enabled`" de la Fase 2): a cada
   targeta de repte, un desplegable **per fase** (un per Pujada, un per
   Votació) amb 3 estats: `Calendari` (segueix les dates), `Obert` (forçat,
   per davant del calendari), `Tancat` (forçat, per davant del calendari).
   `automation_enabled` (un sol switch per repte, Fase 2) queda **substituït**
   per aquests dos camps independents (`upload_mode`/`voting_mode`), un per
   fase — ja no té sentit un únic interruptor que taps totes dues finestres
   alhora. Color del desplegable — **REVISAT 2026-07-18 (v0.1.36)**: ja no
   indica el MODE triat sinó l'ESTAT EFECTIU d'avui — verd si avui està
   obert, vermell si està tancat. Amb `Obert`/`Tancat` sempre coincideix (és
   forçat); amb `Calendari` depèn de si avui cau dins del rang de dates (així
   `Calendari` ja no queda sempre en color neutre). Pendent de valorar més
   endavant una manera més visual de mostrar l'estat (icones, badges...); de
   moment surt amb el canvi de color del text.
   Implicació tècnica per la Fase 4/5: `upload_mode`/`voting_mode` (valors
   `calendari`/`obert`/`tancat`) aniran a `reptes_calendari` (substituint
   `automation_enabled`); `objectives.uploads_enabled`/`voting_enabled`
   (Fase 2) es mantenen com "l'estat efectiu resultant" que llegeix la resta
   de l'app — si el mode és `calendari` es calculen de les dates com ara; si
   és `obert`/`tancat` es forcen, independentment de l'altra fase i del
   calendari.
6. **Pujada tancada amb foto ja pujada**: el botó "Eliminar i Tornar a Pujar" i
   el peu de foto es veuen sempre, però queden `disabled` quan `uploads_enabled`
   és `false` — no s'amaguen. Editar el peu de foto va lligat a la mateixa
   acció que pujar/canviar foto (mateix flag, `uploads_enabled`).

### Fases
0. ~~Simplificar "Progrés de votacions" → "Votacions rebudes: n"~~ **FET (v0.1.28)**,
   dins del Panell de Control. Transitori: es va moure dins de cada targeta de
   repte a la Fase 4/5 i la card global es va retirar (veure punt 1).
1. ~~Deixar els botons "Controls" i "Calendari" on són fins que les fases de
   sota estiguin fetes~~ **FET (v0.1.33): ara es fa efectiu.** Les cards
   "Controls", "Calendari" i "Votacions rebudes" es retiren del Panell de
   Control — cada repte ho gestiona a la seva pròpia targeta (Fase 4/5).
2. ~~**BD (Supabase, Normal i Test)** + masters per repte~~ **FET (v0.1.29)**.
   Descoberta clau abans de fer-ho: `objectives.uploads_enabled`/`voting_enabled`
   ja existien a la BD però eren lletra morta (ningú els llegia) — la feina real
   ha estat: afegir `objectives.names_revealed`, reescriure `fem_apply_calendar()`
   perquè iteri tots els reptes actius amb automatització ON (abans `limit 1`) i
   escrigui cadascun al seu propi repte (no a `app_settings`), treure el
   bloqueig de `saveObjective()` que impedia >1 repte `active`, i connectar els
   masters (`toggleUpload`/`toggleVotingOpen`, `admin.js`) i el calendari
   (`applyCalendarAutomation`, `calendari.js`) perquè llegeixin/escriguin el
   repte actiu en lloc dels flags globals d'`app_settings` (que es mantenen com
   a mirall a `state.settings` perquè `participant.js`/`votacio.js`/`fotos.js`/
   `router.js`/`ranking.js` no calgui tocar-los encara). Els masters ja no es
   bloquegen quan el calendari mana: un clic manual sempre funciona i
   desactiva l'automatització d'aquell repte de forma permanent (decisió #5
   de dalt). SQL a aplicar (pendent que ho facis tu a Supabase, Normal i
   Test): `sql/reptes_calendari_fase2.sql`.
   **Avís vigent**: crear un 2n repte actiu ja no peta, però la UI encara
   només gestiona el primer que troba — no crear-ne un de veritat fins la
   Fase 4/6.
3. ~~**Nucli JS — funcions amb `objectiveId` explícit**~~ **FET (v0.1.32)**.
   `getActivePublishedPhotos()`, `getActiveAllPhotos()`, `getActiveVotes()`,
   `getVotingProgress()` (`core/data.js`) i `getActiveCalendar()`/
   `isCalendarAutomationActive()`/`applyCalendarAutomation()`/
   `toggleCalAutomation()`/`saveCalendari()`/`disableAutomationForActiveObjective()`
   (`features/calendari.js`) accepten ara un `objectiveId` explícit opcional;
   sense argument es comporten exactament igual que abans (cap crida
   existent s'ha hagut de tocar — canvi purament additiu). `applyCalendarAutomation()`
   actualitza sempre l'objecte concret que se li passi, però només trepitja
   el mirall global (`state.settings`) quan aquest objectiveId coincideix amb
   `getActiveObjectiveId()` — evita que un futur repte "secundari" (Fase 4)
   corrompi l'estat de l'únic repte que la UI d'avui sap mostrar.
   `state.currentObjective` continua sent singular (agafa el primer actiu que
   troba) — això és feina de la Fase 4 (repintar una targeta per repte).
4. ~~**UI admin — targeta de repte** (`tematiques.js` `renderObjectivesList()` +
   `admin.css`)~~ **FET (v0.1.33), juntament amb la Fase 5** (el Pablo: "si no
   hi ha manera d'anar validant cada fase, no sé si té sentit fer-lo per
   parts" — es van fer en un sol pas). Disseny de 2 files: Fila 1
   nom/descripció + 2 desplegables de mode (Pujada/Votació) amb comptador
   (fotos pujades / vots rebuts) + estat + Editar/Finalitzar; Fila 2, les 4
   dates com a `<input type="date">` natius. Reptes FINALITZATS — **REVISAT
   2026-07-18 (v0.1.37)**: ja NO tenen un resum de només lectura a part;
   mostren la MATEIXA targeta que un repte actiu (mateixos desplegables i
   dates, amb el seu valor real), però amb tot `disabled` — visible, no
   editable, mateix criteri que "Eliminar i Tornar a Pujar" quan la pujada
   és tancada.
5. ~~**Migrar `automation_enabled` → `upload_mode`/`voting_mode`**~~ **FET
   (v0.1.33)**. `sql/reptes_calendari_fase4.sql`: columnes `upload_mode`/
   `voting_mode` (`calendari`/`obert`/`tancat`) a `reptes_calendari`, amb
   backfill des de l'antic `automation_enabled`; `fem_apply_calendar()`
   reescrita perquè apliqui cada fase segons el seu propi mode, per a tots
   els reptes actius. A `calendari.js`: `isCalendarAutomationActive()`/
   `applyCalendarAutomation()`/`toggleCalAutomation()`/
   `disableAutomationForActiveObjective()`/graella visual de mes (Fase 2/3)
   RETIRATS, substituïts per `setPhaseMode(objectiveId, phase, mode)`,
   `updateCalendarDate(objectiveId, field, value)`, `applyPhaseModes(objectiveId)`
   i `applyAllActiveCalendars()` (aplica totes les fases de tots els reptes
   actius, cridada des de `router.js` en obrir la pantalla i a l'auto-refresh).
   A `admin.js`: `toggleUpload`/`toggleVotingOpen`/`revealNamesAndRanking`/
   `syncPlasticButtons`/`plasticPress` RETIRATS (ja no hi ha botons de
   plàstic globals). SQL a aplicar (pendent que ho facis tu a Supabase,
   Normal i Test): `sql/reptes_calendari_fase4.sql`.
   **Bug de fus horari (v0.1.38/v0.1.39)**: "avui" es calculava en UTC en
   lloc d'hora local — corregit al navegador (v0.1.38, `calendari.js`) i
   consolidat al cron de Supabase (v0.1.39, `sql/reptes_calendari_tz_fix.sql`,
   pendent que ho apliquis a Normal i Test).
6. **Costat participant** (`index.html` hero-grid, `fotos.js`
   `updateUploadSection()`): repetir la parella `card-objective-photo` ↔
   `vote-mosaic-section` un cop per repte actiu; `showParticipantVoting()` rebent
   `objectiveId`. Depèn de 3 (ja fet). Candidata a tractar-se com a tasca
   separada un cop tancat l'admin. **Pendent.**
7. Verificació manual (2 reptes actius simultanis, calendaris independents,
   galeria/ranking sense barrejar-se) + actualitzar aquest changelog i el SQL.
   **Pendent.**

Ordre: 0 fet → 1 fet → 2 fet → 3 fet → 4 fet → 5 fet → (6 a decidir quan) → 7.
Cada fase és una tasca a part (una a la vegada, com marca "Flujo de trabajo").

### Polit final (fora de numeració, 2026-07-18)
Un cop la Fase 4/5 va deixar el Panell de Control buit de contingut propi
(les seves 3 cards es van moure a cada targeta de repte), Pablo va demanar
retirar directament la pestanya sencera ("no té sentit"): **FET (v0.1.41)**.
"Fotos" passa a ser la pestanya activa per defecte per a l'admin; "Veure com
a participant"/canviar BD Normal-Test (abans una card només-mòbil dins del
Panell de Control) viuen ara sempre a la barra superior, també en mòbil.
