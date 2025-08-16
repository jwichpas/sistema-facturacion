-- Add `level` column to categories to store hierarchy depth
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 0;

-- Optionally, populate levels based on parent relationship for existing rows
DO $$
DECLARE
  r RECORD;
  v_level int;
BEGIN
  -- compute level for each category by walking parents
  FOR r IN SELECT id, parent_id FROM public.categories LOOP
    v_level := 0;
    WITH RECURSIVE anc(cur_id, depth) AS (
      SELECT r.parent_id, 1
      UNION ALL
      SELECT c.parent_id, depth + 1
      FROM public.categories c
      JOIN anc a ON c.id = a.cur_id
      WHERE c.parent_id IS NOT NULL
    )
    SELECT COALESCE(MAX(depth), 0) INTO v_level FROM anc;

    UPDATE public.categories SET level = v_level WHERE id = r.id;
  END LOOP;
END$$;
