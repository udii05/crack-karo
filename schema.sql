-- =====================================================================
-- AI Interview Copilot — PostgreSQL Schema (v1.0)
-- Engine: PostgreSQL 16+  |  Extensions: pgcrypto, pgvector (optional)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- For AI embeddings / semantic search of questions & candidate profiles:
CREATE EXTENSION IF NOT EXISTS vector; -- requires pgvector

-- =====================================================================
-- ENUMS
-- =====================================================================
CREATE TYPE user_role        AS ENUM ('student', 'job_seeker', 'professional', 'admin');
CREATE TYPE interview_type   AS ENUM ('behavioral', 'technical', 'system_design', 'coding', 'domain');
CREATE TYPE interview_mode   AS ENUM ('text', 'voice', 'video');
CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'abandoned', 'reviewed');
CREATE TYPE question_type    AS ENUM ('behavioral', 'technical', 'coding', 'system_design', 'situational', 'domain');
CREATE TYPE q_source         AS ENUM ('curated', 'ai_generated', 'user_created');
CREATE TYPE difficulty       AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- =====================================================================
-- IDENTITY & ACCOUNTS
-- =====================================================================
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            CITEXT NOT NULL UNIQUE,
    password_hash    TEXT,                      -- NULL if OAuth-only (Clerk/Auth0)
    auth_provider    TEXT DEFAULT 'email',      -- email | clerk | google | github | microsoft
    auth_provider_id TEXT,
    full_name        TEXT NOT NULL,
    role             user_role NOT NULL DEFAULT 'job_seeker',
    avatar_url       TEXT,
    locale           TEXT DEFAULT 'en',
    email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ                -- soft delete
);
CREATE INDEX idx_users_auth_provider ON users (auth_provider, auth_provider_id);

CREATE TABLE user_preferences (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_role      TEXT,
    experience_years NUMERIC(3,1),
    location         TEXT,
    timezone         TEXT DEFAULT 'UTC',
    weekly_goal      INTEGER DEFAULT 3,          -- mock interviews per week
    notifications    JSONB DEFAULT '{}'::jsonb   -- email/push preferences
);

-- Billing and payments are intentionally out of scope for now.

-- =====================================================================
-- RESUME & JOB DESCRIPTION INGESTION
-- =====================================================================
CREATE TABLE resumes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url      TEXT NOT NULL,                  -- S3 object key
    file_name     TEXT,
    file_type     TEXT,                           -- pdf | docx | txt
    file_size     BIGINT,
    parsed_json   JSONB,                          -- {sections, skills[], experience[], education[], projects[]}
    skills        TEXT[],
    version       INTEGER NOT NULL DEFAULT 1,
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resumes_user ON resumes (user_id, is_active);

CREATE TABLE job_descriptions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name  TEXT,
    role_title    TEXT,
    raw_text      TEXT NOT NULL,
    parsed_json   JSONB,                          -- {requirements[], responsibilities[], skills[], seniority}
    skills        TEXT[],
    source_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jd_user ON job_descriptions (user_id);

-- =====================================================================
-- CANDIDATE PROFILE (AI-generated per user + resume + JD combination)
-- =====================================================================
CREATE TABLE candidate_profiles (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id          UUID REFERENCES resumes(id) ON DELETE SET NULL,
    jd_id              UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    skill_map          JSONB,                     -- {skill: {level, evidence[]}}
    gaps               JSONB,                     -- [{skill, severity, suggestion}]
    summary            TEXT,
    generation_status  TEXT DEFAULT 'pending',    -- pending | processing | ready | failed
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cand_profiles_user ON candidate_profiles (user_id);

-- =====================================================================
-- SKILLS & ASSESSMENTS
-- =====================================================================
CREATE TABLE skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,                    -- soft | hard | technical | domain
    aliases     TEXT[] DEFAULT '{}'
);

CREATE TABLE user_skills (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id         UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level            SMALLINT NOT NULL DEFAULT 0,  -- 0..100
    last_assessed_at TIMESTAMPTZ,
    UNIQUE (user_id, skill_id)
);

CREATE TABLE skill_assessments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id     UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score        SMALLINT NOT NULL,                -- 0..100
    assessed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assess_user_skill ON skill_assessments (user_id, skill_id, assessed_at DESC);

-- =====================================================================
-- QUESTIONS & QUESTION BANK
-- =====================================================================
CREATE TABLE questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category     question_type NOT NULL,
    type         question_type NOT NULL DEFAULT 'behavioral',
    difficulty   difficulty NOT NULL DEFAULT 'intermediate',
    body         TEXT NOT NULL,
    hint         TEXT,
    rubric       JSONB,                           -- scoring rubric / expected key points
    sample_answer TEXT,
    tags         TEXT[] DEFAULT '{}',
    source       q_source NOT NULL DEFAULT 'curated',
    author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    embeddings   vector(1536),                    -- pgvector semantic search
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_category ON questions (category, difficulty);
CREATE INDEX idx_questions_embedding ON questions USING hnsw (embeddings vector_cosine_ops);

CREATE TABLE company_questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company     TEXT NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    role        TEXT,
    source      TEXT,                             -- anonymous report, scrape, curated
    UNIQUE (company, question_id)
);
CREATE INDEX idx_cq_company ON company_questions (company);

-- =====================================================================
-- INTERVIEWS & SESSIONS (CORE)
-- =====================================================================
CREATE TABLE interviews (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
    title            TEXT,
    type             interview_type NOT NULL DEFAULT 'behavioral',
    mode             interview_mode NOT NULL DEFAULT 'text',
    status           interview_status NOT NULL DEFAULT 'scheduled',
    difficulty       difficulty NOT NULL DEFAULT 'intermediate',
    company_context  TEXT,                         -- optional company focus
    jd_id            UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    overall_score    NUMERIC(5,2),                 -- 0..100
    readiness_delta  NUMERIC(5,2),                 -- readiness score before/after
    config           JSONB,                        -- {questionCount, adaptive, copilotEnabled, language}
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_interviews_user ON interviews (user_id, created_at DESC);

CREATE TABLE interview_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    sequence      INTEGER NOT NULL,               -- ordering within interview
    question_id   UUID REFERENCES questions(id) ON DELETE SET NULL,
    question_text TEXT,                           -- snapshot of the asked question
    user_answer   TEXT,
    ai_feedback   JSONB,                          -- {strengths[], improvements[], keyPointsHit[]}
    score         NUMERIC(5,2),                   -- 0..100 per answer
    metrics       JSONB,                          -- {fillerWords, paceWpm, clarity, confidence, durationMs}
    transcript    JSONB,                          -- time-stamped turns for review timeline
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (interview_id, sequence)
);
CREATE INDEX idx_sessions_interview ON interview_sessions (interview_id, sequence);

-- =====================================================================
-- MEDIA & REPORTS
-- =====================================================================
CREATE TABLE media_assets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID REFERENCES interviews(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind          TEXT NOT NULL,                  -- audio | video | transcript | screen_capture
    s3_key        TEXT NOT NULL,
    mime_type     TEXT,
    duration_secs INTEGER,
    status        TEXT DEFAULT 'uploading',       -- uploading | processing | ready | failed
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_interview ON media_assets (interview_id);

CREATE TABLE feedback_reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary       TEXT,
    metrics       JSONB,                          -- overall delivery metrics
    strengths     JSONB,
    improvements  JSONB,
    skill_impact  JSONB,                          -- {skillId: delta}
    recommendations JSONB,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_interview ON feedback_reports (interview_id);

-- =====================================================================
-- LIVE COPILOT SESSIONS (flagship feature)
-- =====================================================================
CREATE TABLE copilot_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_id  UUID REFERENCES interviews(id) ON DELETE SET NULL,
    device        TEXT,                           -- browser | mobile | extension
    status        TEXT DEFAULT 'active',          -- active | paused | ended
    settings      JSONB,                          -- {discreetMode, hintFrequency, voiceAssist}
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ,
    tokens_used   INTEGER DEFAULT 0
);
CREATE INDEX idx_copilot_user ON copilot_sessions (user_id, started_at DESC);

CREATE TABLE copilot_interactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID NOT NULL REFERENCES copilot_sessions(id) ON DELETE CASCADE,
    user_prompt   TEXT,
    ai_suggestion JSONB,                          -- suggested talking points / hints / STAR outline
    latency_ms    INTEGER,
    delivered     BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_copilot_ints ON copilot_interactions (session_id, created_at);

-- =====================================================================
-- PRACTICE / DAILY CHALLENGES / GAMIFICATION
-- =====================================================================
CREATE TABLE practice_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind          TEXT NOT NULL,                  -- daily_challenge | question_of_day | skill_quiz | spaced_review
    question_id   UUID REFERENCES questions(id) ON DELETE SET NULL,
    score         NUMERIC(5,2),
    answered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_practice_user ON practice_runs (user_id, answered_at DESC);

CREATE TABLE streaks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity  DATE NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- =====================================================================
-- ANALYTICS / EVENTS
-- =====================================================================
CREATE TABLE analytics_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID,
    event_name    TEXT NOT NULL,
    properties    JSONB,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_name_time ON analytics_events (event_name, occurred_at DESC);
CREATE INDEX idx_analytics_user_time ON analytics_events (user_id, occurred_at DESC);

-- =====================================================================
-- TRIGGERS: updated_at maintenance
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- ROW-LEVEL SECURITY (multi-tenant isolation)
-- =====================================================================
ALTER TABLE resumes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports     ENABLE ROW LEVEL SECURITY;

-- Example policy (Supabase/Postgres role = authenticated):
-- CREATE POLICY "owner_access" ON interviews
--   FOR ALL USING (auth.uid() = user_id);
-- Apply equivalent policies to each tenant table above.
