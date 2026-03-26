-- 스토리 파악 선택 기록 테이블
-- 사용자가 스토리 장면에서 한 선택을 원본 그대로 저장
-- profile은 선택에서 도출된 ProbabilityProfile

CREATE TABLE IF NOT EXISTS discovery_selections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('garden', 'adventure', 'strategy')),
  selections JSONB NOT NULL,  -- StorySelectionRecord[]
  profile JSONB,              -- ProbabilityProfile (nullable: 계산 실패 시)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_user ON discovery_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_created ON discovery_selections(created_at DESC);
