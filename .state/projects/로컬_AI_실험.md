# 로컬 AI 실험 환경 구축
**상태**: 진행 중
**현재 단계**: 2. 논의 완료 → 체험 완료 → 대기 (Mac Studio 구매 전까지 보류)

## 목적
API 비용 0원으로 무한 테스트할 수 있는 로컬 LLM 환경 구축.
개발/테스트/데모에 활용, 프로덕션은 Claude API 유지 (하이브리드 전략).

## 단계 (순서 강제)
1. **리서치** — 방법: /research (3자 병렬: Claude + Gemini + Perplexity)
   - [x] Claude 자체 리서치 3건 병렬 완료 (2026-03-21)
     - [x] 하드웨어 + 서빙 스택 조사
     - [x] 한국어 로컬 모델 조사
     - [x] 비용 분석 + 연동 방안 조사
   - [x] Gemini Deep Research 결과 수신
   - [x] Perplexity 결과 수신
   - [x] 3자 합성 → 리서치/로컬_AI_실험_환경_2026-03.md 작성
2. **논의** — 완료 (2026-03-21). 불일치 분석, Mac Studio 구매 보류 결정
3. **체험** — 완료 (2026-03-21). M1 8GB + Qwen2.5 3B로 풀림 로컬 연동 확인
4. **실행** — 코드 연동 완료, 하드웨어 구매 대기
   - [x] Ollama 설치 + 모델 다운로드 (qwen2.5:3b, qwen3:4b)
   - [x] providers/local.ts 생성 (openai.ts 기반)
   - [x] listen/route.ts 로컬 분기 추가
   - [x] 환경변수 전환 (.env.local LLM_MODE=local/cloud)
   - [x] 데모모드 바이패스 (LLM_MODE=local이면 isDemoMode=false)
   - [x] 풀림 로컬 모델 통합 테스트 — **동작 확인, 품질 불가 (3B 한계)**
   - [ ] 하드웨어 구매 결정 → /cross-check (보류)
   - ⚡ 품질검증 체크포인트 (Mac Studio 구매 후)
   - [ ] Mac Studio에서 32B 모델 품질 테스트
5. **최종 검증** — Mac Studio 구매 후 로컬/클라우드 품질 비교

## 현재까지 핵심 발견 (Claude 자체 리서치)

### 하드웨어
- 현재 MacBook Air M1 8GB → 7B Q4까지 (느림, 실험용 부적합)
- **추천: Mac Studio M4 Max 64GB (~404만원)** — 30B 여유, 70B 시도 가능
- NVIDIA GPU는 VRAM 벽(24-32GB)으로 LLM에 부적합
- M4 Ultra 미출시 (현재 M3 Ultra만 존재)

### 서빙 스택
- **Ollama 1순위** — 설치 1줄, OpenAI API 호환, 풀림 연동 가장 쉬움
- MLX가 Apple Silicon에서 21-87% 더 빠름 (성능 중시 시)
- llama.cpp는 Anthropic Messages API도 지원

### 한국어 모델
- **EXAONE 4.0 32B** — 한국어 최고 (KMMLU-Pro 67.7), 단 NC 라이선스
- **Qwen3/3.5 27-32B** — Apache 2.0, 상업적 자유, 한국어 상위
- 7B급은 상담 품질 한계적 → 개발 테스트에만
- KULLM/KoAlpaca/Polyglot-Ko는 레거시

### 비용
- API 절감 BEP: 3~5년 (비경제적)
- 부가가치 (오프라인 데모, 무한 실험, 프라이버시) 고려 시 합리적

### 풀림 연동
- openai.ts 복사 → local.ts (baseURL 변경) → 30분 작업
- 환경변수 LLM_MODE=local|cloud 전환
- 마커 파싱 실패 fallback 강화 필요
