-- ============================================================================
-- NJU-YZTer 支教团协同平台 — 数据库 Schema
-- 在 Supabase 控制台 → SQL Editor 中按顺序执行: schema.sql → rls.sql → seed.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. schools: 7 所学校种子数据
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  province   TEXT NOT NULL,
  location   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schools_province ON schools(province);

-- ----------------------------------------------------------------------------
-- 2. 三个状态枚举(策划案 / 审核 / 推文)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('not_started','drafting','submitted','approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('not_started','in_progress','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 3. activities: 活动主表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  primary_school_id INT NOT NULL REFERENCES schools(id),
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  is_collaborative  BOOLEAN NOT NULL DEFAULT FALSE,
  status_proposal   proposal_status NOT NULL DEFAULT 'not_started',
  status_approved   approval_status NOT NULL DEFAULT 'pending',
  status_article    article_status  NOT NULL DEFAULT 'not_started',
  article_url       TEXT,
  created_by        TEXT,
  updated_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_activities_starts_at  ON activities(starts_at);
CREATE INDEX IF NOT EXISTS idx_activities_primary    ON activities(primary_school_id);
CREATE INDEX IF NOT EXISTS idx_activities_deleted    ON activities(deleted_at) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. activity_collaborators: 协同学校关联
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_collaborators (
  activity_id INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  school_id   INT NOT NULL REFERENCES schools(id),
  PRIMARY KEY (activity_id, school_id)
);

-- ----------------------------------------------------------------------------
-- 5. proposals: 策划案版本表
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id          SERIAL PRIMARY KEY,
  activity_id INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  version     INT NOT NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   BIGINT NOT NULL,
  mime_type   TEXT,
  notes       TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activity_id, version)
);
CREATE INDEX IF NOT EXISTS idx_proposals_activity ON proposals(activity_id);

-- ----------------------------------------------------------------------------
-- 6. audit_log: 写操作审计日志
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   INT,
  diff        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON audit_log(created_at DESC);