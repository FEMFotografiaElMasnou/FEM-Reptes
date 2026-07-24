# Diagnòstic — `objectives` vs `reptes_calendari` (Supabase, app FEM Reptes)

**Data de l'anàlisi:** 2026-07-23 (actualitzat el mateix dia amb l'anàlisi del repo de Resultats)
**Font analitzada:** codi de `FEM-Reptes.zip` (app FEM VOTACIONS / FEM Reptes, versió 0.1.44, 2026-07-22) — `js/core/data.js`, `js/features/calendari.js`, `js/features/tematiques.js`, `sql/reptes_calendari*.sql`, `FEM_reptes.md`, `CHANGELOG.md` — **i** codi de `FEM-Resultats.zip` (app React "App Resultats de Reptes", `FEM-Resultats`) — `src/App.jsx`, `src/supabaseClient.js`, `src/utils.js`, `src/components/*.jsx`, i els documents de handoff tècnic `FEM-Resultats-Handoff.docx` (v2.1) i `FEM-Resultats-Handoff-v2.2.docx`.
**Actualització 2026-07-23 (fase 0 del pla d'execució):** connectat el projecte Supabase real (organització "FEM Fotografia El Masnou") i verificat en viu, **només lectura**, tant l'entorn `FEM_Reptes` (Normal, `ogqqcgbgcqowvywaolln`) com `FEM_Reptes-test` (Test, `xxydxdsiunfwzkcffdai`). Totes les suposicions fetes a partir del codi (§2) han quedat confirmades — detall a la nova §2.4 — i s'hi han trobat 2 coses noves que el codi no podia mostrar (una vista SQL no documentada i una duplicitat de polítiques RLS). Ja no hi ha "no inclòs" pendent d'aquesta banda.

---

## 1. Resum executiu

`reptes_calendari` **no és una taula de reptes duplicada**: és una taula satèl·lit, relació 1:1 opcional amb `objectives` (`objective_id unique references objectives(id)`), pensada només per guardar la configuració de calendari automàtic (4 dates + 2 modes) d'un repte. No hi ha cap repte que existeixi "només" a `reptes_calendari`: tot repte viu a `objectives`; `reptes_calendari` només té fila per als reptes als quals algú ha arribat a tocar el calendari des de l'admin.

Dit això, el diagnòstic et dona la raó en el fons: **no calia una taula a part**. És el resultat de com ha evolucionat el producte per fases (veure §4) i avui genera:

- **Fragmentació d'una mateixa entitat en fins a 3 llocs**: `objectives` (estat efectiu), `reptes_calendari` (configuració que genera aquest estat) i `app_settings` (residu mort d'una etapa anterior, ja no es llegeix).
- **Files disperses**: com que `reptes_calendari` només es crea quan s'edita una data o un mode d'aquell repte concret, la major part de reptes probablement no hi tenen fila — el cas "Escales" que apuntes n'és l'evidència.
- **Barreja de convencions de nom**: taula en català (`reptes_calendari`) al costat d'una taula en anglès (`objectives`), quan tota la resta de domini (UI, i18n, aquest mateix document) ja diu "reptes".
- **Acoblament ocult amb `pg_cron`**: la funció `fem_apply_calendar()` referencia `public.objectives` i `public.reptes_calendari` textualment dins el seu cos — un canvi de noms de taula/columna l'ha de tocar explícitament (Postgres no ho actualitza sol per a funcions PL/pgSQL, a diferència de les vistes).

La proposta (`objectives` absorbeix `reptes_calendari` → s'elimina `reptes_calendari` → es renombra `objectives` a `reptes`) és tècnicament raonable i encaixa amb cap on ja apunta el producte. L'impacte no és trivial perquè toca 2 entorns Supabase (Normal/Test), aquest frontend, la funció de cron, i (amb qui cal parlar) l'app Resultats. Detall a partir del §7.

---

## 2. Estat actual de les dues taules

### 2.1 `objectives` (el "repte")

Font de veritat de cada repte. Columnes conegudes (per ús real al codi; no s'ha pogut confirmar l'esquema complet contra Supabase):

| Columna | Tipus (inferit) | Ús |
|---|---|---|
| `id` | `text` (`'obj_' + Date.now()`) | PK. **No és UUID** — clau de disseny a tenir en compte en qualsevol migració. |
| `name` | text | Títol del repte (`obj.title` al frontend) |
| `description` | text | Descripció |
| `status` | text (`'active' \| 'finished' \| 'inactive'`) | Estat del repte |
| `uploads_enabled` | boolean | **Estat efectiu** — si la pujada de fotos està oberta ara mateix |
| `voting_enabled` | boolean | **Estat efectiu** — si la votació està oberta ara mateix |
| `names_revealed` | boolean | Si s'han revelat els noms dels autors (afegida a la Fase 2, 2026) |
| `start_date` | date | **Data de creació del repte** (es fixa sola en crear-lo) — *no* és una data de calendari de pujada/votació |
| `end_date` | date | Data en què es finalitza el repte (es fixa en clicar "Finalitzar") |
| `created_by` | text (user id) | Autor |

Es llegeix/escriu sencer des de `js/core/data.js` (`loadAllData()` línia 55, `saveObjectives()` línia 246-259) i s'edita des de `js/features/tematiques.js` (`saveObjective()`, `finalizeObjective()`).

**Important per a la fusió**: `objectives.start_date`/`end_date` ja existeixen i **no tenen res a veure semànticament** amb les 4 dates de `reptes_calendari` (`upload_start/end`, `voting_start/end`). Si s'absorbeixen columnes noves caldrà triar noms que no col·lisionin amb aquest parell existent (p. ex. `cal_upload_start` en lloc de reutilitzar `start_date`).

### 2.2 `reptes_calendari` (satèl·lit de calendari, 1:1 opcional)

```sql
create table public.reptes_calendari (
  id                  text primary key default gen_random_uuid()::text,
  objective_id        text not null unique references public.objectives(id) on delete cascade,
  upload_start        date,
  upload_end          date,
  voting_start        date,
  voting_end          date,
  automation_enabled  boolean not null default true,  -- substituït a Fase 4/5
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
```

A la Fase 4/5 (`sql/reptes_calendari_fase4.sql`, **no inclòs al zip** — es referencia a `FEM_reptes.md` i `calendari.js` però el fitxer no hi és; recomano recuperar-lo abans de tocar res) `automation_enabled` es va substituir per dues columnes de mode independents:

| Columna | Tipus | Ús |
|---|---|---|
| `upload_mode` | text (`'calendari' \| 'obert' \| 'tancat'`) | Com es decideix si la pujada està oberta |
| `voting_mode` | text (`'calendari' \| 'obert' \| 'tancat'`) | Com es decideix si la votació està oberta |

**La fila es crea "mandrosa" (lazy)**: `setPhaseMode()` i `updateCalendarDate()` (`js/features/calendari.js`, línies 145-149 i 209-218) fan `upsert(..., { onConflict: 'objective_id' })` **només quan l'admin toca un desplegable de mode o una data** d'aquell repte concret des de la seva targeta. Un repte que ningú ha tocat mai al calendari **no té fila** a `reptes_calendari`.

Aquest és exactament el patró que descrius: `objectives` té fila per a **tots** els reptes (perquè és la taula que es crea sempre, en `saveObjective()`), mentre que `reptes_calendari` només en té per als reptes on s'ha usat el calendari automàtic — al teu entorn, només "Escales". No és un bug de sincronització: és el comportament esperat del disseny actual (fila creada sota demanda), però és fràgil perquè:

- `getActiveCalendar(objId)` retorna `null` per a qualsevol repte sense fila, i `applyPhaseModes()` simplement no fa res per aquell repte (`if (!cal || !obj) return false;`) — els seus `uploads_enabled`/`voting_enabled` queden congelats al que fossin abans, sense que el cron ni la UI els recalculin mai per calendari.
- La UI (`tematiques.js` línia 53, `getActiveCalendar(obj.id) || {}`) omple els desplegables amb valors per defecte (`'calendari'`) encara que no hi hagi fila real a la BD — visualment sembla configurat, però no ho està fins que es desa un canvi.

### 2.4 Verificació real contra Supabase (fase 0, 2026-07-23 — només lectura)

Consultat en viu `information_schema`, `pg_proc`, `pg_views` i `pg_policies` als dos projectes. Resum:

**Esquema confirmat exactament com a §2.1/§2.2**, amb dues precisions que el codi no deixava veure:
- `objectives` **no té columna `created_at`** (l'esquema real només té les 10 columnes llistades a §2.1).
- `reptes_calendari.automation_enabled` **existeix físicament a la taula però és una columna morta**: no la selecciona el frontend (`data.js` només demana `upload_mode`/`voting_mode`) ni la fa servir `fem_apply_calendar()` (el seu cos, recuperat en viu, ignora `automation_enabled` per complet). En absorbir-la a `objectives` no cal migrar-ne el valor — es pot descartar.

**Dades reals — confirma exactament el cas "Escales" que vas apuntar**, i mostra que no és una coincidència d'aquest únic repte:

| Entorn | Reptes a `objectives` | Reptes amb fila a `reptes_calendari` |
|---|---|---|
| **Normal** (producció) | 4: *Escales* (finished), *Dominant blava* (finished), *Dominant verda* (finished), *Dominant vermell* (finished) | Només **Escales** |
| **Test** | 3: *Dominant blava* (**active**), *Dominant verda* (finished), *Dominant vermell* (finished) | Només **Dominant blava** |

En cada entorn, només el repte on algú ha arribat a tocar el calendari des de l'admin té fila — a Test és un repte diferent (Dominant blava) que a Normal (Escales), exactament com prediu el disseny "lazy" descrit a §2.2. No és, doncs, una peculiaritat d'"Escales": és el comportament normal de la taula, que reprodueix el mateix patró a cada entorn amb el seu propi repte.

**`fem_apply_calendar()`**: el cos recuperat en viu és **idèntic** als dos entorns i coincideix exactament amb `sql/reptes_calendari_tz_fix.sql` del zip — el fitxer `_fase4.sql` que faltava al zip no aporta cap dubte addicional, la versió `tz_fix` ja és, confirmat, la que hi ha desplegada. Únic cron actiu: `fem-calendar`, `5 0 * * *` (00:05 UTC), a Normal (no s'ha comprovat si també n'hi ha un a Test, però la funció hi és idèntica).

**Troballa nova, no visible des del codi**: a **Normal** (no a Test) hi ha una vista SQL anomenada `resultats_votacio` que fa `join` directe amb `objectives` (`o.name`, `o.id`) i que **no apareix en cap dels dos repositoris** (FEM-Reptes ni FEM-Resultats) — sembla creada directament a l'editor SQL de Supabase, probablement per a una consulta puntual. A més, té un filtre fixat `WHERE o.name = 'Dominant blava'`, així que avui només serviria per a aquell repte concret. Tècnicament una vista **no trenca** en fer `RENAME TABLE` (Postgres la resol per identificador intern, no per text, a diferència de les funcions PL/pgSQL — vegeu §8), però és exactament el tipus de dependència que aquest exercici de verificació buscava destapar: val la pena preguntar a Pablo/Enric si `resultats_votacio` encara es fa servir per a res abans de continuar.

**RLS ja divergent entre entorns, independentment d'aquesta migració**: `objectives` té a Normal dues famílies de polítiques solapades ("Permetre lectura/creació/actualització/eliminació de objectives", en català, més antigues, `USING (true)`) conjuntament amb una segona família (`obj_read`/`obj_write`/`obj_edit`/`obj_remove`, restringides a `auth.role() = 'anon'`) — i a Test la segona família té noms diferents (`allow_anon_read`/`allow_anon_write`). Funcionalment són equivalents (totes acaben permetent l'accés amb la clau anon), però és soroll acumulat i una prova més que els dos entorns s'han anat desincronitzant amb el temps. `reptes_calendari`, en canvi, té exactament les mateixes 3 polítiques als dos entorns — aquesta taula no ha patit la mateixa deriva. Com que renombrar la taula obliga a tornar a crear les polítiques igualment, és un bon moment per deixar-ne una sola família neta en lloc de traslladar-hi la duplicitat.

**Nota fora d'abast, per contextualitzar**: els dos projectes Supabase també allotgen un conjunt de taules totalment aliè (`zampa_projects`, `zampa_editions`, `zampa_photos`, `zampa_user_ranks`, i una columna `zampa_role` a `users`) corresponent a una altra aplicació/concurs del club, sense cap relació (FK ni de cap altre tipus) amb `objectives`/`reptes_calendari`. No l'afecta aquesta migració, però confirma que aquests projectes Supabase no són d'ús exclusiu de FEM Reptes — val la pena anar amb compte d'acotar qualsevol canvi (RLS, funcions) només a les taules rellevants.

### 2.3 Nota lateral: `app_settings` (residu mort relacionat)

Abans de la Fase 2 (multi-repte), `uploads_enabled`/`voting_enabled`/`names_revealed` vivien com a claus globals a `app_settings`, aplicades a un únic repte "actiu". Des de la Fase 2 aquestes claus **ja no les llegeix ningú** (es mantenen només per compatibilitat visual/mirall a `state.settings`, marcades explícitament com a "residu" al codi). No forma part de la proposta de fusió, però si es fa neteja de `reptes_calendari` és un bon moment per valorar-ho també (fora d'abast d'aquesta anàlisi, ho apunto només perquè hi surti documentat).

---

## 3. Per què ha passat això (arrel del problema)

Segons `FEM_reptes.md` i el `CHANGELOG.md`, l'app va començar amb **un sol repte actiu global** i flags a `app_settings`. `reptes_calendari` es va afegir més tard (v0.1.17) com una peça purament additiva per programar automàticament aquell únic repte, sense tocar `objectives`. Quan el producte va evolucionar cap a **multi-repte actiu simultani** (Fases 2-5, juliol 2026), la lògica de calendari es va anar estenent (per `objective_id`) però la taula mai es va replantejar com a part d'`objectives` — es va anar ampliant en el seu lloc original perquè "ja hi era" i afegir columnes hi és més barat a curt termini que fusionar taules. És un patró habitual d'anar apedaçant per iteracions ràpides, no un error puntual d'algú.

---

## 4. Comparativa de camps (solapament real)

| Concepte | A `objectives` | A `reptes_calendari` | Solapament? |
|---|---|---|---|
| Identitat del repte | `id`, `name`, `description`, `status`, `created_by` | `objective_id` (FK) | No, són complementaris |
| Finestra de pujada | — | `upload_start`, `upload_end` | No hi ha equivalent a `objectives` |
| Finestra de votació | — | `voting_start`, `voting_end` | No hi ha equivalent a `objectives` |
| Mode de control (manual/calendari) | — | `upload_mode`, `voting_mode` | No hi ha equivalent a `objectives` |
| **Estat efectiu resultant** | `uploads_enabled`, `voting_enabled`, `names_revealed` | *(és el que aquestes columnes calculen)* | **Sí — és el punt real de fricció**: l'estat "efectiu" viu a `objectives` però és calculat i escrit des de la lògica de `reptes_calendari`/cron, en 2 llocs de codi diferents (`calendari.js` al navegador i `fem_apply_calendar()` a Supabase) que han de mantenir-se idèntics a mà (ja hi ha hagut un bug de fus horari per això, v0.1.38/39). |
| Dates generals del repte | `start_date` (creació), `end_date` (finalització) | — | Semànticament diferents de les dates de calendari; **risc de confusió de noms** en fusionar |

No hi ha, doncs, dues files "del mateix repte" amb dades contradictòries — el solapament és de **responsabilitat repartida sobre el mateix resultat** (uploads_enabled/voting_enabled), no de dades duplicades. Això no fa el problema menys real: és exactament el tipus de disseny que és fàcil de deixar inconsistent (com el cas "Escales") i costós de raonar (dos motors —navegador i cron— que han de coincidir).

---

## 5. Qui usa cada taula avui (aquest repo)

**`objectives`** — `js/core/data.js` (`loadAllData`, `saveObjectives`), `js/features/tematiques.js` (llista, crear, editar, finalitzar), `js/features/calendari.js` (llegeix/escriu `uploads_enabled`/`voting_enabled`/`names_revealed`), `js/features/galeria.js`, `js/features/ranking.js`, `js/features/votacio.js`, `js/screens/participant.js` (incl. la llista de reptes finalitzats que alimenta la vista *Resultats* interna).

**`reptes_calendari`** — únicament `js/core/data.js` (`loadAllData`, càrrega a `state.reptesCalendari`) i `js/features/calendari.js` (`getActiveCalendar`, `setPhaseMode`, `updateCalendarDate`). Superfície petita i ben acotada — bona notícia de cara a la fusió: només 2 fitxers toquen aquesta taula directament.

**Supabase (SQL/cron)** — `fem_apply_calendar()` fa `join` entre les dues taules i escriu a `objectives`. Existeix en almenys 3 versions successives al repo (`reptes_calendari.sql`, `_fase2.sql`, `_tz_fix.sql`); la versió `_fase4` (que introdueix `upload_mode`/`voting_mode`) **no és al zip** — cal localitzar-la a Supabase abans de planificar la migració, perquè és la versió actualment en producció.

---

## 6. Impacte del canvi proposat

### 6.1 A Supabase (Normal **i** Test — 2 entorns a tocar sempre)

- Afegir a `objectives` les columnes equivalents a `reptes_calendari` (amb noms que no col·lisionin amb `start_date`/`end_date` existents).
- Migrar les dades (`update objectives o set ... from reptes_calendari c where c.objective_id = o.id`).
- Reescriure `fem_apply_calendar()` perquè llegeixi/escrigui tot dins `objectives` (sense `join`).
- Eliminar `reptes_calendari` (taula + les seves policies RLS) — **sempre respectant ADR-015** ("no esborrar dades de Supabase des del frontend"): aquesta eliminació és una acció manual d'administrador a l'editor SQL, no del frontend, així que no hi entra en conflicte, però convé fer-ho constar explícitament perquè és el mateix esperit de precaució.
- **Renombrar `objectives` → `reptes`**: a Postgres, `ALTER TABLE ... RENAME` és segur per a les claus foranes existents (`photo_submissions.objective_id`, `votes.objective_id`, `seguiment_votacio.objective_id` seguiran apuntant-hi correctament, són per OID no per nom) i per a vistes (es re-resolen soles). **Però no per a funcions PL/pgSQL**: `fem_apply_calendar()` té el nom `objectives` escrit literalment dins el cos — cal editar-la i tornar a fer `create or replace function` després del rename, si no, trenca al primer cron.
- Revisar si hi ha més funcions/vistes/triggers a Supabase que referenciïn `objectives` textualment (no visibles des d'aquest repo — cal mirar-ho directament a l'editor SQL de Supabase).

### 6.2 A aquest frontend (FEM-Reptes)

Canvis mecànics però estesos:
- `js/core/data.js`: `.from('objectives')` → `.from('reptes')` (2 llocs), fusionar la petita consulta de `reptes_calendari` dins la mateixa `select`, eliminar `state.reptesCalendari`.
- `js/features/calendari.js`: `getActiveCalendar()` deixa de buscar en una llista a part i llegeix camps directament de l'objecte de `state.objectives`/`state.reptes`; `setPhaseMode()`/`updateCalendarDate()` fan `update` sobre `reptes` en lloc d'`upsert` sobre `reptes_calendari` (ja no cal gestionar el cas "fila inexistent", perquè sempre existeix la fila del repte).
- Decisió de nom intern: si es renombra la taula, val la pena (fora d'abast avui, però a decidir en planificar) si `state.objectives`/`state.currentObjective`/`saveObjectives()` també es renombren a `reptes`/`currentRepte`/`saveReptes()` per coherència, o si es deixa el nom intern JS com està i només canvia el nom de la taula Supabase. Ambdues opcions són vàlides; la primera és més neta però toca molts més fitxers (pràcticament tots els llistats al §5).
- Prefix de `id` (`'obj_' + Date.now()`) queda "mal etiquetat" si es renombra la taula — no cal canviar-lo (no trenca res), però és una inconsistència cosmètica a tenir en compte.

### 6.3 A l'app **Resultats** (`FEM-Resultats`, React) — **confirmat directament sobre el codi**

Bona notícia: l'exposició real de Resultats a aquestes taules és molt més petita del que calia assumir sense veure el codi.

**Connexió Supabase**: `src/supabaseClient.js` connecta amb credencials **fixes al codi** (URL + clau anon), a un **únic** projecte Supabase — segons el handoff (§3.1), projecte `FEM_Reptes`, ID `ogqqcgbgcqowvywaolln`. **Resultats no té l'equivalent del selector Normal/Test de FEM-Reptes**: sempre apunta al mateix projecte (previsiblement el de producció/"Normal"). Implicació directa per a la migració: provar els canvis al projecte "Test" de FEM-Reptes **no valida res** de Resultats — caldrà, o bé editar temporalment `supabaseClient.js` perquè apunti a Test abans de fer proves, o assumir que la primera validació real de Resultats serà contra producció.

**Taules que consulta** (confirmat a `src/App.jsx` + Handoff §4, taula 3 — "5 taules", RLS de només lectura amb clau anon): `objectives`, `users`, `photo_submissions`, `votes`, `seguiment_votacio`. **`reptes_calendari` no hi apareix enlloc** — Resultats no en sap l'existència, no la consulta mai. Zero impacte per aquesta banda.

**Columnes d'`objectives` que fa servir** — únicament aquestes, en 2 consultes (`App.jsx` línies 84 i 179):
```js
db.from('objectives').select('id, name').order('id', { ascending: false })   // per a la vista d'un repte
db.from('objectives').select('id, name').order('name')                       // per a la Classificació General
```
més el filtre `.eq('status', 'finished')` quan `!isAdmin`. És a dir: **només `id`, `name` i `status`**. No toca `uploads_enabled`, `voting_enabled`, `names_revealed`, `start_date`, `end_date` ni `created_by` en cap moment.

**Conseqüències directes per al pla del §7**:
- **Afegir columnes noves a `objectives`/`reptes`** (absorbint `reptes_calendari`): **impacte zero** a Resultats — les seves consultes especifiquen columnes explícites (`select('id, name')`), no `select('*')`, així que columnes noves no els arriben ni els afecten.
- **Eliminar `reptes_calendari`**: **impacte zero** — mai la consulta.
- **Renombrar `objectives` → `reptes`**: **impacte mínim i acotat**: només cal canviar `.from('objectives')` per `.from('reptes')` en **2 línies** de `src/App.jsx` (84 i 179). Cap altre fitxer del repo Resultats hi fa referència (`GeneralTable.jsx`, `ResultsView.jsx`, `LoginOverlay.jsx`, `Topbar.jsx`, `utils.js` no toquen `objectives` en cap moment — reben les dades ja carregades com a props).

**Un acoblament ja existent, no causat per aquest canvi, però a tenir present**: el comentari de `App.jsx` línia 82-83 assumeix que `objectives.id` és literalment "un timestamp Unix (ms)" i ordena per `id` descendent per obtenir el repte més recent primer. A FEM-Reptes, `id` és en realitat `'obj_' + Date.now()` (text, no numèric) — funciona igualment perquè el prefix és constant i els dígits del timestamp tenen longitud fixa (ordenació lexicogràfica = ordenació numèrica en aquest cas concret), però és una assumpció fràgil. No cal tocar-la per absorbir/renombrar les taules, **però si en algun moment futur es planteja canviar el format de l'`id` (p. ex. a UUID)**, aquest ordre a Resultats trencaria en silenci (mostraria els reptes desordenats, no un error). Val la pena deixar-ho anotat per si mai es toca l'esquema d'`id`.

**Detall trobat al mateix handoff de Resultats (§9, "Pendents")**, per contextualitzar cap on va el producte: hi consta explícitament un pendent a llarg termini anomenat *"Fusió amb App Reptes — Unificar les dues apps en un sol codebase quan el codi de Pablo s'estabilitzi"*. La proposta de fusionar/renombrar les taules de Supabase és, doncs, coherent amb una direcció que Enric i Pablo ja tenien apuntada, no un canvi aïllat.

**Conveni de lliurament**: igual que a FEM-Reptes, el handoff de Resultats (§11) fixa el mateix conveni — llista de fitxers amb ruta destí al xat + ZIP pla (sense carpetes) amb només els fitxers tocats. Aplica igualment quan es lliurin els canvis d'aquesta migració per a `src/App.jsx`.

---

## 6.4 Registre d'execució (actualitzat en viu a mesura que avancem)

| Data | Fase | Entorn | Acció | Estat |
|---|---|---|---|---|
| 2026-07-23 | 0 — Reconeixement | Normal + Test | Verificació d'esquema, funció, files, RLS (només lectura) | ✅ Fet — vegeu §2.4 |
| 2026-07-23 | 1 — Columnes noves a `objectives` | Test (`xxydxdsiunfwzkcffdai`) | `alter table` afegint `cal_upload_start/end`, `cal_voting_start/end`, `upload_mode`, `voting_mode` | ✅ Aplicat i verificat — 3 files existents intactes, columnes noves amb default correcte |
| 2026-07-23 | 1 — Columnes noves a `objectives` | Normal (`ogqqcgbgcqowvywaolln`) | Mateix `alter table` | ✅ Aplicat i verificat — 4 files existents intactes (Escales, Dominant blava/verda/vermell) |
| 2026-07-23 | 2 — Backfill des de `reptes_calendari` | Test | `update objectives ... from reptes_calendari` | ✅ Aplicat i verificat fila a fila: "Dominant blava" (única amb fila a `reptes_calendari`) coincideix exactament amb l'origen; la resta es queda `null`/`'calendari'` com tocava |
| 2026-07-23 | 2 — Backfill des de `reptes_calendari` | Normal | Mateix `update` | ✅ Aplicat i verificat: "Escales" coincideix exactament amb l'origen; la resta es queda `null`/`'calendari'` |
| 2026-07-24 | 3 — Frontend adaptat (`data.js`, `state.js`, `calendari.js`, `fotos.js`) | Local (apuntant a Test) | Repte de prova real "Contrallums" creat i editat des de l'admin | ✅ Verificat a la BD: `objectives.cal_*` es grava correctament; `reptes_calendari` ja no rep escriptures noves (una primera prova havia anat a parar per error a la taula vella per caché del navegador — detectat i corregit amb un hard refresh; la fila òrfena que va deixar és inofensiva) |
| 2026-07-24 | 3 — `fem_apply_calendar()` llegeix `objectives` | Test | `create or replace function` (ja no fa `join` amb `reptes_calendari`) | ✅ Aplicat; invocat manualment i comparat abans/després pels 4 reptes — resultat idèntic (`uploads_enabled=true`/`voting_enabled=false` per "Contrallums", coherent amb les seves dates), cap error, cap canvi inesperat |
| 2026-07-24 | 3 — Frontend a producció | Normal (GitHub → Vercel, desplegament automàtic) | `git push` (commit `c9eb9a7`) | ✅ Fet per Enric |
| 2026-07-24 | 3 — Backfill fresc + `fem_apply_calendar()` llegeix `objectives` | Normal | Backfill (sense canvis respecte a Fase 2, `reptes_calendari` no s'havia tocat) + `create or replace function` | ✅ Aplicat, invocat manualment, cap error, cap canvi inesperat (cap repte actiu a Normal en aquest moment, per tant no hi ha hagut cap efecte visible — moment de baix risc per fer el tall) |
| 2026-07-24 | 3 — Repte real "Contrallums" creat a Normal (producció) | Normal | Primera prova real: va anar per error a `reptes_calendari` (caché del navegador amb el JS antic, mateix símptoma que a Test) — backfill de seguretat aplicat a aquesta fila per evitar que el cron la desquadrés a la nit. Un cop confirmat el desplegament a Vercel i fet un hard refresh, s'ha tornat a editar la data d'inici de pujada | ✅ Verificat: `objectives.cal_upload_start` reflecteix la data nova (2026-07-25); `reptes_calendari` no ha rebut cap escriptura nova (mateix `updated_at` d'abans) — el tall a producció ja és net |
| 2026-07-24 | Documentació | Repo FEM-Reptes | `FEM_reptes.md` (nova secció "Estat actual de la BD"), `CHANGELOG.md` (entrada v0.1.45), `sql/2026-07-24_racionalitzacio_objectives.sql` (nou, SQL de referència) | ✅ Preparats com a lliurament (`FEM-Reptes_documentacio_fase3.zip`), pendents que Enric els col·loqui al repo i faci commit |

Marxa enrere disponible per a la Fase 1, si mai calgués (no s'ha necessitat):
```sql
alter table public.objectives
  drop column if exists cal_upload_start,
  drop column if exists cal_upload_end,
  drop column if exists cal_voting_start,
  drop column if exists cal_voting_end,
  drop column if exists upload_mode,
  drop column if exists voting_mode;
```

## 7. Pla de canvis proposat (a validar, no executat)

1. ~~**Verificació prèvia a Supabase** (Normal i Test)~~ **FET (2026-07-23, §2.4)**: esquema confirmat, cos viu de `fem_apply_calendar()` recuperat i comparat, recompte de files fet als dos entorns. Troballes addicionals a resoldre abans de continuar: confirmar amb Pablo/Enric si la vista `resultats_votacio` (només a Normal) encara es fa servir, i decidir si es netegen les polítiques RLS duplicades d'`objectives` en el mateix pas que la migració.
2. **Migració SQL**: noves columnes a `objectives`, backfill des de `reptes_calendari`, reescriure `fem_apply_calendar()`, aplicar a Test primer, verificar, aplicar a Normal.
3. **Adaptació d'aquest frontend**: els punts del §6.2, provats en local (mode Test) abans de desplegar.
4. **Baixa de `reptes_calendari`**: un cop confirmat que res la consulta (ni aquest repo ni Resultats), `drop table`.
5. **Renombrar `objectives` → `reptes`**: SQL de rename + repàs de funcions/vistes que la referenciïn textualment; després, adaptació del frontend (aquest repo i, si escau, Resultats).
6. **Adaptació de l'app Resultats**: canvi acotat i confirmat (§6.3) — 2 línies a `src/App.jsx` (`.from('objectives')` → `.from('reptes')`). Cap altre canvi necessari mentre no es toqui el format de l'`id`. Provar-ho abans contra el projecte Supabase de Test **requereix editar temporalment `src/supabaseClient.js`**, ja que Resultats no té selector Normal/Test com FEM-Reptes.
7. **Documentació**: actualitzar `FEM_reptes.md` (secció d'estructura/documentació), `CHANGELOG.md`, i si es manté un `Decisions.MD`/ADR al RAG del producte, registrar-ho com a decisió d'arquitectura (encaixa amb el criteri "abans de tocar lògica, releer Components.MD i Decisions.MD" que ja segueix el projecte).

Cada pas s'hauria de tractar com una tasca a part i amb el vistiplau previ de Pablo, seguint el mateix criteri que ja marca `FEM_reptes.md` ("Antes de una tarea no trivial, propón un plan y espera el OK").

---

## 8. Riscos i punts d'atenció

- **Dos entorns Supabase** (Normal/Test): oblidar-ne un deixa els dos desincronitzats — ja ha passat abans amb aquesta taula (el mateix `FEM_reptes.md` ho marca com a pendent en diverses fases anteriors).
- **Funcions PL/pgSQL no es reescriuen soles** en fer `RENAME TABLE` — cal editar-les manualment o el cron diari trenca en silenci (ningú se n'assabenta fins que un repte no s'obre/tanca quan tocava).
- **Col·lisió de noms** entre `objectives.start_date/end_date` (dates del repte) i les 4 dates de calendari — cal triar bé els noms nous per no confondre'ls.
- **Resultats no té entorn de Test**: apunta sempre al mateix projecte Supabase (credencials fixes a `supabaseClient.js`). Provar-hi els canvis abans de tocar producció exigeix editar temporalment aquest fitxer; si no es fa, la migració es valida per primer cop en producció des del punt de vista de Resultats.
- **ADR-015** ("no esborrar dades de Supabase des del frontend"): l'eliminació de la taula ha de ser sempre una acció manual a l'editor SQL, mai codi de l'app.
- **Vista `resultats_votacio` (confirmada, només a Normal)**: dependència d'`objectives` no documentada a cap dels dos repos, creada directament a Supabase. Una `RENAME TABLE` no la trenca (les vistes es resolen per OID, no per text), però convé confirmar-ne l'ús real abans de donar la migració per tancada — és exactament el tipus de cosa que aquesta verificació buscava destapar i que un grep de codi mai hauria trobat.
- **RLS ja divergent entre Normal i Test** (confirmat, §2.4): `objectives` té famílies de polítiques diferents a cada entorn (noms diferents, mateix efecte pràctic). No bloqueja la migració, però és evidència que cal aplicar-hi disciplina en tocar RLS als dos entorns pas a pas, no donar per fet que estan sincronitzats.
- **Assumpció d'`id` com a timestamp a Resultats** (§6.3): no la trenca aquesta migració, però si mai es planteja canviar el format de l'`id` d'`objectives`/`reptes` (p. ex. a UUID) caldrà revisar l'ordenació `order('id', {ascending:false})` de Resultats, que hi confia implícitament.

---

## 9. Conclusió

El diagnòstic confirma la teva intuïció amb un matís: no hi ha duplicació de reptes (cada repte existeix una sola vegada, a `objectives`), però sí una **fragmentació innecessària d'un mateix concepte** (l'estat de pujada/votació d'un repte) entre dues taules i, de retruc, un tercer lloc mort (`app_settings`). La proposta d'absorbir `reptes_calendari` dins `objectives`, eliminar-la i renombrar `objectives` a `reptes` és tècnicament sòlida i alinea per fi el nom de la taula amb el vocabulari que ja fa servir tota la resta del producte (UI, i18n, aquest mateix repte anomenat "Escales") — i, com mostra el propi handoff de Resultats (§6.3), encaixa amb un pendent ja apuntat per Enric i Pablo ("Fusió amb App Reptes").

Amb el codi de Resultats ja revisat, l'esforç deixa de tenir una gran incògnita: **l'impacte real a Resultats és mínim** (2 línies a `src/App.jsx`, cap ús de `reptes_calendari`, cap ús de les columnes de calendari). El focus de risc de tota la migració es concentra ara en 3 punts concrets: coordinar els 2 entorns Supabase de FEM-Reptes (Normal/Test), reescriure a mà la funció de cron `fem_apply_calendar()` (no es reescriu sola en fer `RENAME TABLE`), i el fet que Resultats no té entorn de Test propi — la seva validació final passarà, inevitablement, per producció.
