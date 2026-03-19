# .state/ 프로젝트 기반 상태 관리

## 문제
- 세션_맥락.md 단일 파일 → 덮어쓰기로 이전 맥락 유실
- 다중 세션 동시 작업 시 충돌
- 반복 작업 발생 (이미 한 걸 또 함)

## 방법
```
.state/
├── project-config.md      ← 불변 (아키텍처, 원칙, 안전규칙)
├── projects/
│   ├── 프로젝트A.md       ← active (해당 프로젝트 세션만 수정)
│   ├── _backlog/          ← 아이디어/예비 프로젝트
│   └── _done/             ← 완료 → 아카이브
├── decisions/             ← 추가만 (날짜별, 덮어쓰기 금지)
├── handoffs/              ← 추가만 (세션 맥락 보존)
├── sessions/              ← 추가만
└── playbook/              ← 검증된 패턴/실패/프롬프트
```

## 핵심 원칙
1. **불변 vs 가변 분리**: project-config는 거의 안 바뀜
2. **프로젝트별 파일 분리**: 다중 세션 충돌 방지
3. **축적 디렉토리는 덮어쓰기 금지**: decisions/, handoffs/, sessions/
4. **git 버전관리**: 실수로 덮어써도 복구 가능

## 3겹 안전망 (컨텍스트 소실 방지)
- Layer 1: .state/ (결론+상태) — 항상 존재
- Layer 2: /handoff (맥락+과정) — compact/종료 전
- Layer 3: /resume-session (전체 대화) — 풀 transcript

## 재사용 조건
- 새 프로젝트/도메인에서 상태 관리가 필요할 때
- 다중 세션 병렬 작업 시
