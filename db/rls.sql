-- ============================================================================
-- NJU-YZTer — Row Level Security 策略
-- 用户已确认: 任何拿到 GitHub Pages 链接的人都能读 / 写
-- 因此 anon 角色全开;唯一的隔离是 audit_log 不能被匿名者篡改
-- ============================================================================

-- 启用 RLS
ALTER TABLE schools                ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;

-- schools: anon 全部权限
DROP POLICY IF EXISTS "anon_all_schools" ON schools;
CREATE POLICY "anon_all_schools" ON schools
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- activities: anon 全部权限(包含软删除)
DROP POLICY IF EXISTS "anon_all_activities" ON activities;
CREATE POLICY "anon_all_activities" ON activities
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- activity_collaborators: anon 全部权限
DROP POLICY IF EXISTS "anon_all_collab" ON activity_collaborators;
CREATE POLICY "anon_all_collab" ON activity_collaborators
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- proposals: anon 全部权限
DROP POLICY IF EXISTS "anon_all_proposals" ON proposals;
CREATE POLICY "anon_all_proposals" ON proposals
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- audit_log: 允许插入和读取,但禁止更新和删除(防止痕迹被覆盖)
DROP POLICY IF EXISTS "anon_insert_audit" ON audit_log;
CREATE POLICY "anon_insert_audit" ON audit_log
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_audit" ON audit_log;
CREATE POLICY "anon_select_audit" ON audit_log
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_no_update_audit" ON audit_log;
CREATE POLICY "anon_no_update_audit" ON audit_log
  FOR UPDATE TO anon USING (false);

DROP POLICY IF EXISTS "anon_no_delete_audit" ON audit_log;
CREATE POLICY "anon_no_delete_audit" ON audit_log
  FOR DELETE TO anon USING (false);