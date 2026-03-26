#!/bin/bash
# Walking Skeleton — 밤새 ralph 배치
# 사용법: bash scripts/ralph_walking_skeleton.sh

set -e

cd ~/study/main/pullim

LOG_DIR="logs/ralph_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

echo "=== Walking Skeleton ralph 시작: $(date) ===" | tee "$LOG_DIR/progress.log"

# Seed 내용 읽기
SEED=$(cat .state/seeds/행동기반_개인화_walking_skeleton.md)

# 참고 파일 목록
REF_FILES="제품/풀림_진짜시작_2026-03-24.md
리서치/대형프로젝트_진행방법론_2026-03-24.md
제품/고민_라우팅_설계.md"

# ralph 프롬프트 구성
PROMPT=$(cat <<'PROMPT_EOF'
너는 풀림(Pullim) 프로젝트의 Walking Skeleton을 구현하는 개발자다.

## 임무
아래 Seed 명세를 읽고, 완료 기준(AC)을 모두 만족하는 코드를 구현하라.

## Seed
SEED_PLACEHOLDER

## 작업 순서 (강제)
1. 먼저 기존 코드를 충분히 읽어라:
   - pullim/src/lib/types-ultimate.ts
   - pullim/src/app/api/ultimate/listen/route.ts
   - pullim/src/app/adventure/[id]/page.tsx (또는 가장 최근 수정된 세션 페이지)
   - pullim/src/lib/llm/ 전체
   - pullim/src/lib/providers/ 전체
   - pullim/src/components/game/ 전체
   - pullim/src/lib/safety/crisis-detector.ts
   - pullim/package.json (의존성 확인)

2. Supabase 연결 설정 (lib/supabase/client.ts)
   - 환경변수가 없으면 .env.local.example에 필요한 키 목록만 기록
   - Supabase 없이도 로컬에서 동작하도록 폴백 (localStorage 기반)

3. Seed의 "새 파일 목록" 순서대로 구현
   - 각 파일 완성 후 TypeScript 컴파일 에러 확인 (npx tsc --noEmit)
   - 에러 있으면 즉시 수정

4. 기존 파일 최소 변경
   - listen/route.ts: behaviorSignals 파라미터 + [BEHAVIOR_CONTEXT] 주입
   - 세션 페이지: useBehaviorSignals 훅 + 파악 게임 분기

5. 구현 완료 후 검증:
   - npx tsc --noEmit (타입 에러 0)
   - npm run build (빌드 성공)
   - 기존 파이프라인 동작 확인 (listen API가 behaviorSignals 없이도 동작)

## 원칙
- 기존 코드를 깨뜨리지 마라. 새 기능은 새 파일에.
- Supabase가 없어도 동작해야 한다 (localStorage 폴백).
- 사용자에게 보이는 UI는 파악 게임 + 만족도 별점만. 나머지는 이면에서.
- 위기 감지(crisis-detector)가 항상 behavior-reader보다 먼저 실행.
- 파악 게임 질문은 Big Five 기반 초안. 완벽하지 않아도 된다.
- "비일관성도 데이터" — consistency 측정 로직 반드시 포함.

## 참고
- 이것은 기존 파이프라인과 별개의 새로운 경험이다. listen→research→analyze→debate→conclude 파이프라인을 수정하지 않는다.
- listen/route.ts에는 behaviorSignals 파라미터와 [BEHAVIOR_CONTEXT] 주입만 추가한다.

끝나면 구현 결과 요약과 빌드 상태를 출력하라.
PROMPT_EOF
)

# Seed 내용 삽입
PROMPT="${PROMPT/SEED_PLACEHOLDER/$SEED}"

echo "프롬프트 길이: $(echo "$PROMPT" | wc -c) bytes" | tee -a "$LOG_DIR/progress.log"
echo "$PROMPT" > "$LOG_DIR/prompt.txt"

# ralph 실행 (caffeinate로 슬립 방지)
echo "=== claude -p 실행 시작: $(date) ===" | tee -a "$LOG_DIR/progress.log"

caffeinate -dis -- claude -p "$PROMPT" \
  --dangerously-skip-permissions \
  2>&1 | tee "$LOG_DIR/output.log"

EXIT_CODE=$?

echo "=== 완료: $(date), exit code: $EXIT_CODE ===" | tee -a "$LOG_DIR/progress.log"

# 빌드 확인
echo "=== 빌드 검증 ===" | tee -a "$LOG_DIR/progress.log"
cd pullim
npx tsc --noEmit 2>&1 | tee "$LOG_DIR/tsc_result.log"
npm run build 2>&1 | tee "$LOG_DIR/build_result.log"

echo "=== 전체 완료: $(date) ===" | tee -a "$LOG_DIR/progress.log"
