# 실패: AI 팀 시뮬레이션 (MCP 8인 에이전트)

## 뭘 했나
LLM 에이전트 8명(CTO, PM, AI Lead, Safety, CMO, CFO, Data, COS)을 프롬프트로 정의하고, MCP 서버(FastMCP)로 연결. 45차 회의 진행. dispatch/consult/meeting 3가지 모드. 역할별 YAML 설정.

## 왜 실패했나
1. **할루시네이션 교차검증 불가**: 같은 모델이 서로 동의 (sycophancy 58%)
2. **진짜 다양성 없음**: "fixed mental set" — 프롬프트가 달라도 추론 방식 동일
3. **MCP 상태 없음**: 1회성 API 호출, 맥락 유지 안 됨
4. **오버헤드만 증가**: 8인 조율 비용 > 실제 가치

## 근거
- ICLR 2025: MAD < CoT (74.73% vs 80.73%, 9개 벤치마크)
- MAST 분류: 41.77% specification 문제, 36.94% coordination 실패
- Gemini Deep Research: "operational model collapse" — 에이전트가 자기 출력을 재학습

## 대안 (현재 사용 중)
- 워크플로우 스택: 역할이 아니라 작업 유형별로 도구 분리
- 이종 모델 교차검증: 같은 모델 복제 대신 다른 모델로 검증

## 교훈
- AI에게 "역할"을 주는 건 인간 조직 구조를 흉내내는 것일 뿐
- 검증은 동종 모델 간에는 구조적으로 불가능
- 프롬프트 개선으로 해결할 수 있는 문제가 아님 (아키텍처 한계)
- 단, 역할 정의 YAML의 domain expertise 내용은 제품 프롬프트에 재활용 가치 있음
