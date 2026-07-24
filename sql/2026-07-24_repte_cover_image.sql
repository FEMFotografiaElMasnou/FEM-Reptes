-- ═══════════════════════════════════════════════════════════════════════
-- Imatge de fons del repte (box "Repte / Foto pujada", costat participant)
-- Revisió demanada per Enric (2026-07-24): la capçalera del repte (nom +
-- descripció + rang de dates de pujada/votació) passa a poder mostrar una
-- imatge de fons pròpia del repte, pujada per l'admin en crear/editar-lo.
-- Aplicar a Supabase (Normal i Test), a l'editor SQL — mai des del frontend
-- (ADR-015).
-- ═══════════════════════════════════════════════════════════════════════

alter table public.objectives
  add column if not exists cover_image_url text;

comment on column public.objectives.cover_image_url is
  'URL (Cloudinary) de la imatge de fons de la capçalera del repte. Recomanada 3:1, ~1200x400px. Opcional.';
