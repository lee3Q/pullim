-- 세션 분석 테이블 — Phase 1 실사용자 추적용
-- 익명 UUID 기반, Auth 없이 동작

-- 1. 방문 기록 (페이지 진입)
CREATE TABLE IF NOT EXISTS visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,           -- nanoid (localStorage)
  page TEXT NOT NULL,              -- '/', '/adventure/1', '/garden/1', '/strategy/1'
  referrer TEXT,                   -- document.referrer (유입 경로)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);

-- 2. 세션 기록 (사다리 세션 시작~종료)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,             -- nanoid
  user_id TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('garden', 'adventure', 'strategy')),
  mode TEXT DEFAULT 'ladder',      -- 'ladder' | 'ultimate'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,            -- null = 미완료
  turn_count INT DEFAULT 0,
  max_level INT DEFAULT 1,         -- 도달한 최고 레벨 (1~5)
  cheat_count INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE, -- 세션 정상 종료 여부
  satisfaction INT,                -- 1~5 (세션 후 만족도, nullable)
  model TEXT                       -- 사용된 모델명 (A/B 테스트용)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_theme ON sessions(theme);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(started_at DESC);

-- 3. 분석 뷰 — 핵심 PMF 지표
CREATE OR REPLACE VIEW pmf_metrics AS
SELECT
  -- 일별 활성 사용자
  DATE(s.started_at) AS day,
  COUNT(DISTINCT s.user_id) AS dau,
  -- 세션 수
  COUNT(*) AS total_sessions,
  -- 완주율
  ROUND(AVG(CASE WHEN s.completed THEN 1.0 ELSE 0.0 END) * 100, 1) AS completion_rate_pct,
  -- 평균 턴 수
  ROUND(AVG(s.turn_count), 1) AS avg_turns,
  -- 평균 만족도
  ROUND(AVG(s.satisfaction), 2) AS avg_satisfaction,
  -- 치트 비율
  ROUND(AVG(s.cheat_count), 1) AS avg_cheats
FROM sessions s
GROUP BY DATE(s.started_at)
ORDER BY day DESC;

-- 4. 재방문 뷰 — 7일 내 재방문율
CREATE OR REPLACE VIEW retention_7d AS
SELECT
  first_visit.user_id,
  first_visit.first_day,
  CASE WHEN revisit.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS returned_7d
FROM (
  SELECT user_id, DATE(MIN(started_at)) AS first_day
  FROM sessions
  GROUP BY user_id
) first_visit
LEFT JOIN (
  SELECT DISTINCT user_id, DATE(started_at) AS visit_day
  FROM sessions
) revisit
ON first_visit.user_id = revisit.user_id
AND revisit.visit_day BETWEEN first_visit.first_day + INTERVAL '1 day'
                         AND first_visit.first_day + INTERVAL '7 days';
