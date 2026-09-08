# Hosted Demo Warning (공개 데모 경고)

공개 데모를 운영할 때 알아야 할 위험과 필수 보호장치입니다.

## 기본 권장: LLM_MODE=demo

공개 데모는 **기본적으로 `LLM_MODE=demo`로 운영**하는 것을 권장합니다.

- `LLM_MODE=demo`에서는 모든 AI 응답이 큐레이션된 mock 데이터로 반환됩니다.
- 외부 API 호출이 없으므로 비용이 발생하지 않습니다.
- 남용 위험이 없습니다.

### 안전한 공개 데모 설정

```env
LLM_MODE=demo
PULLIM_HOSTED_DEMO=true
```

`PULLIM_HOSTED_DEMO=true`은 추가 안전장치로, `isDemoMode()`가 항상 `true`를 반환하도록 보장합니다. 다른 설정이나 환경 변수가 실수로 변경되더라도 외부 API 호출이 차단됩니다.

## 실제 API 키 연결 데모의 위험

실제 API 키를 연결한 공개 데모는 다음 위험이 있습니다:

- **비용 남용**: 누구나 무제한으로 API를 호출할 수 있습니다.
- **키 유출**: 클라이언트 측 코드나 네트워크 요청에서 키가 노출될 수 있습니다.
- **서비스 거부**: 대량 요청으로 API 할당량이 소진될 수 있습니다.

실제 API 키를 연결하려면 아래 보호장치가 **모두** 구현되어야 합니다.

## 필수 보호장치

### 1. Authentication (인증)

- 로그인 시스템 또는 API 토큰 발급
- 익명 접근 시 demo 모드만 허용
- 인증된 사용자만 실제 API 사용 가능

### 2. Rate Limiting (요청 제한)

- 사용자당 분/시간당 최대 요청 수
- IP 기반 제한 (인증 없는 경우)
- 권장 도구: upstash/ratelimit, Vercel KV
- 최우선 적용 라우트:
  - `ultimate/listen` — LLM 스트리밍
  - `ultimate/analyze` — 병렬 LLM 호출
  - `ultimate/debate` — 다중 모델 호출

### 3. Body Size Limit (본문 크기 제한)

- `Content-Length` 헤더 검사
- `JSON.parse()` 전 크기 제한 (예: 10KB)
- 과도한 입력으로 인한 처리 비용 방지

### 4. Quota (사용량 할당)

- 사용자당 일일/월간 API 호출 횟수 상한
- 할당 초과 시 demo 모드로 자동 전환
- 대시보드에서 사용량 모니터링

### 5. Budget Alert (비용 알림)

- API 제공자(Anthropic/OpenAI/Google)의 비용 알림 설정
- 일일/월간 비용 임계치 초과 시 자동 통지
- 임계치 초과 시 자동으로 demo 모드 또는 서비스 중단

## 현재 상태

v0.1에서는 **위 보호장치 중 어느 것도 구현되어 있지 않습니다**.

- 모든 API 라우트가 인증 없이 공개됩니다.
- Rate limit이 없습니다.
- Body size 제한이 없습니다.
- 사용량 추적이 없습니다.
- 비용 알림이 없습니다.

따라서 **공개 데모는 `LLM_MODE=demo`로만 운영**하세요.
