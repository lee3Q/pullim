---
captured: 2026-04-03 14:35:47
source: clipboard
status: unprocessed
tag: 클로드코드
---

Claude Code의 2026년 소스 코드 유출(2026년 3월 31일 npm 소스맵 사고)은 커뮤니티에서 큰 화제가 되었으며, Reddit과 HN 등에서 내부 구조와 숨겨진 기능에 대한 분석이 활발하다.  주요 인사이트는 시스템 프롬프트 차이, 메모리 처리, KAIROS 등이다.[1][2][3]

## 시스템 프롬프트 구조
내부 프롬프트는 외부 버전과 달리 상세한 지시를 포함한다: 설명을 충분히 하라, 협력자로서 행동하라, 코드 주석 작성 가이드라인, 응답 길이 25단어 이내(최종 100단어) 등.  외부는 간결성을 강조하나 내부는 검증과 협업을 우선한다.[3][1]

## CLAUDE.md와 MEMORY.md 처리
MEMORY.md는 가벼운 인덱스(포인터만 저장)로 항상 컨텍스트에 로드되며, 주제 파일은 필요시 불러온다.  CLAUDE.md는 프로젝트 컨텍스트를 유지하는 살아있는 문서로, Claude Code가 세션마다 읽으며 업데이트한다.  엄격한 쓰기 규칙으로 실패 시 메모리 오염 방지.[4][5][1]

## 토큰 사용 줄이기 팁
컨텍스트 2-3 메시지마다 클리어, Sonnet 모델 사용으로 비용 절감, 루트 디렉토리에서 터미널 실행.  메모리 계층화로 전체 로드 피함.[6][1]

## KAIROS 자율 모드
KAIROS는 백그라운드 데몬 모드로, 유휴 시 autoDream으로 관찰 병합, 모순 제거, 인사이트 사실화.  지속 컨텍스트 유지하며 파일/터미널 모니터링, 사용자 개입 없이 학습.  아직 플래그로 비활성.[7][8]

## 숨겨진 기능 (Feature Flags)
44개 플래그 중 20개 미출시: KAIROS 데몬, ULTRAPLAN 원격 계획, Coordinator 멀티에이전트, Buddy Tamagotchi 펫, ANTI_DISTILLATION(가짜 도구 주입), 음성 모드 등.[2][1]

## Hooks 시스템 활용
13개 훅 이벤트로 워크플로우 개입: 파일 쓰기 전/후 코드 실행, rm -rf 차단, .env 보호, Slack 알림, 자동 포맷, TDD 강제(테스트 없인 제출 막음).[9]

## 워크플로우 최적화 사례
1인 개발자: CLAUDE.md 자동 업데이트로 컨텍스트 유지, /feature로 스펙 먼저 생성 후 서브에이전트 배포(10-15분 무중단).  계획 단계 1시간 투자로 실행 가속, 21일 작업을 3일로 단축.[10][4]

소스: https://dev.to/varshithvhegde/the-great-claude-code-leak-of-2026-accident-incompetence-or-the-best-pr-stunt-in-ai-history-3igm, https://www.reddit.com/r/ClaudeCode/comments/1s99j2t/followup_claude_codes_source_confirms_the_system/, https://claudemythosai.io/blog/claude-code-kairos-daemon-mode/, https://www.reddit.com/r/ClaudeAI/comments/1qlzxr1/claude_codes_most_underrated_feature_hooks_wrote/.[8][1][3][7][9]

출처
[1] The Great Claude Code Leak of 2026: Accident, Incompetence, or ... https://dev.to/varshithvhegde/the-great-claude-code-leak-of-2026-accident-incompetence-or-the-best-pr-stunt-in-ai-history-3igm
[2] Claude Code Source Code Leaked: What's Inside (2026) - The AI Corner https://www.the-ai-corner.com/p/claude-code-source-code-leaked-2026
[3] Follow-up: Claude Code's source confirms the system prompt ... https://www.reddit.com/r/ClaudeCode/comments/1s99j2t/followup_claude_codes_source_confirms_the_system/
[4] Getting good results from Claude Code | Hacker News https://news.ycombinator.com/item?id=44836879
[5] Claude Memory | Hacker News https://news.ycombinator.com/item?id=45684134
[6] Input Token Optimization Tips? : r/ClaudeAI - Reddit https://www.reddit.com/r/ClaudeAI/comments/1mqd8xv/input_token_optimization_tips/
[7] Source Code for Anthropic's Claude Code Leaks at the Exact Wrong ... https://gizmodo.com/source-code-for-anthropics-claude-code-leaks-at-the-exact-wrong-time-2000740379
[8] KAIROS: The Hidden Daemon Mode Inside Claude Code https://claudemythosai.io/blog/claude-code-kairos-daemon-mode/
[9] Claude Code's Most Underrated Feature: Hooks (wrote a deep dive) https://www.reddit.com/r/ClaudeAI/comments/1qlzxr1/claude_codes_most_underrated_feature_hooks_wrote/
[10] The creator of Claude Code's Claude setup | Hacker News https://news.ycombinator.com/item?id=46470017
[11] Claude Code Source Leaked via npm Packaging Error, Anthropic ... https://thehackernews.com/2026/04/claude-code-tleaked-via-npm-packaging.html
[12] Anthropic's Claude Code Source Code Leaked https://www.davidborish.com/post/anthropic-s-claude-code-source-code-leaked-and-here-s-what-it-shows
[13] Claude Code feature specs from code: a simple workflow | Koder.ai https://koder.ai/blog/claude-code-feature-specs-from-code
[14] Endrit Restelica's Post - LinkedIn https://www.linkedin.com/posts/endritrestelica_claude-code-source-code-has-been-leaked-activity-7444748444088328193-bsQb
[15] The Claude Code System Prompt Leaked : r/ArtificialInteligence https://www.reddit.com/r/ArtificialInteligence/comments/1o7bfxj/the_claude_code_system_prompt_leaked/
