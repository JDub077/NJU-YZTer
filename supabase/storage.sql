-- ============================================================================
-- NJU-YZTer — Supabase Storage 公共桶 + RLS
-- 创建 proposals 公共桶,允许 anon 上传 / 读取
-- ============================================================================

-- 创建公共桶(若已存在则跳过)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- anon 角色读写 proposals bucket
DROP POLICY IF EXISTS "anon_all_proposals_storage" ON storage.objects;
CREATE POLICY "anon_all_proposals_storage" ON storage.objects
  FOR ALL TO anon
  USING (bucket_id = 'proposals')
  WITH CHECK (bucket_id = 'proposals');