-- ═══════════════════════════════════════════════════════════════════
-- FEM VOTACIONS — Racionalització BD: `objectives` absorbeix `reptes_calendari`
-- JA APLICAT (Normal i Test, 2026-07-24) — aquest fitxer és de referència /
-- repetibilitat, no cal tornar-lo a executar. Vegeu el diagnòstic complet i
-- el registre pas a pas a `Diagnostic_objectives_reptes_calendari.md` (Enric).
--
-- Origen: `objectives` i `reptes_calendari` (1:1 per objective_id, creada a
-- sql/reptes_calendari.sql) tenien responsabilitat repartida sobre el mateix
-- resultat (uploads_enabled/voting_enabled). No calia una taula a part —
-- s'absorbeix dins `objectives` i `reptes_calendari` queda per eliminar
-- (pas a part, pendent, després d'un període d'observació).
--
-- Ordre en què es va aplicar (cada pas verificat abans del següent):
--   1) Columnes noves a `objectives` (additiu, no toca cap fila existent)
--   2) Backfill des de `reptes_calendari`
--   3) Reescriptura de `fem_apply_calendar()` (cron) perquè llegeixi només `objectives`
--   4) (fora d'aquest fitxer) desplegament del frontend adaptat
--      (js/core/data.js, js/core/state.js, js/features/calendari.js) — v0.1.45
-- ═══════════════════════════════════════════════════════════════════


-- 1) COLUMNES NOVES ────────────────────────────────────────────────
-- Prefix cal_ a les dates per no col·lidir amb objectives.start_date/end_date
-- (creació/finalització del repte — concepte diferent, no tocat per això).
alter table public.objectives
  add column if not exists cal_upload_start date,
  add column if not exists cal_upload_end   date,
  add column if not exists cal_voting_start date,
  add column if not exists cal_voting_end   date,
  add column if not exists upload_mode text not null default 'calendari'
    check (upload_mode in ('calendari','obert','tancat')),
  add column if not exists voting_mode text not null default 'calendari'
    check (voting_mode in ('calendari','obert','tancat'));


-- 2) BACKFILL des de reptes_calendari ──────────────────────────────
-- Idempotent: es pot tornar a executar sense efectes secundaris (només
-- toca els objectius que encara tenen fila a reptes_calendari).
-- NOTA: automation_enabled (reptes_calendari) NO es migra — ja era una
-- columna morta des de la Fase 4/5 (2026-07-17): ni el frontend la
-- seleccionava ni fem_apply_calendar() la feia servir.
update public.objectives o
   set cal_upload_start = c.upload_start,
       cal_upload_end   = c.upload_end,
       cal_voting_start = c.voting_start,
       cal_voting_end   = c.voting_end,
       upload_mode       = c.upload_mode,
       voting_mode        = c.voting_mode
  from public.reptes_calendari c
 where c.objective_id = o.id;


-- 3) fem_apply_calendar() reescrita ────────────────────────────────
-- Ja no fa `join` amb reptes_calendari — llegeix el calendari directament
-- d'objectives. La programació del cron (fem-calendar, 5 0 * * *, creada a
-- sql/reptes_calendari.sql) no canvia — `create or replace function`
-- reaprofita el mateix job.
create or replace function public.fem_apply_calendar()
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  cal record;
  -- "Avui" en hora de Madrid (vegeu sql/reptes_calendari_tz_fix.sql, mateix
  -- criteri que abans, ara aplicat sobre objectives en lloc del join).
  today date := (now() at time zone 'Europe/Madrid')::date;
  want_upload boolean;
  want_voting boolean;
  want_reveal boolean;
  final_upload boolean;
  final_voting boolean;
begin
  for cal in
    select id, cal_upload_start as upload_start, cal_upload_end as upload_end,
           cal_voting_start as voting_start, cal_voting_end as voting_end,
           upload_mode, voting_mode
      from public.objectives
     where status = 'active'
  loop
    want_upload := cal.upload_start is not null and cal.upload_end is not null
                   and today >= cal.upload_start and today <= cal.upload_end;
    want_voting := cal.voting_start is not null and cal.voting_end is not null
                   and today >= cal.voting_start and today <= cal.voting_end;
    want_reveal := cal.voting_end is not null and today > cal.voting_end;

    final_upload := case cal.upload_mode
                      when 'obert'  then true
                      when 'tancat' then false
                      else want_upload   -- 'calendari'
                    end;
    final_voting := case cal.voting_mode
                      when 'obert'  then true
                      when 'tancat' then false
                      else want_voting   -- 'calendari'
                    end;

    update public.objectives
       set uploads_enabled = final_upload,
           voting_enabled  = final_voting,
           names_revealed  = names_revealed or (cal.voting_mode = 'calendari' and want_reveal)
     where id = cal.id;
  end loop;
end;
$$;


-- ── ÚTILS ──────────────────────────────────────────────────────────
-- Provar-la manualment ara mateix:      select public.fem_apply_calendar();
-- Comprovar l'estat per repte:
--   select id, name, status, uploads_enabled, voting_enabled, names_revealed,
--          cal_upload_start, cal_upload_end, cal_voting_start, cal_voting_end,
--          upload_mode, voting_mode
--     from public.objectives order by id desc;


-- ── PAS PENDENT (fora d'aquest fitxer, sense pressa) ────────────────
-- Un cop confirmat (període d'observació) que res consulta ja reptes_calendari:
--   drop table public.reptes_calendari;
-- I, si es vol alinear el nom amb la resta de l'app:
--   alter table public.objectives rename to reptes;
--   -- cal tornar a fer `create or replace function` de fem_apply_calendar()
--   -- amb `from public.reptes` (una RENAME TABLE no reescriu el cos de les
--   -- funcions PL/pgSQL, a diferència de les vistes).
