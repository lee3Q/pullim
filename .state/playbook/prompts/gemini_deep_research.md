# Gemini Deep Research 프롬프트

## 용도
심층 리서치 (학술+실무 종합, 가장 깊은 분석)

## 프롬프트 원문
```
Deep research request: "AI utilization strategies for solo founders — beyond AI team simulation"

Context:
- I'm a solo founder building an AI SaaS (mental health / decision support)
- I tried creating virtual AI team members (CTO, PM, Safety expert etc.) using LLM agent prompts and MCP servers
- This approach failed: hallucinations in cross-validation, no genuine diverse thinking, stateless agents pretending to be a team
- I need to find what ACTUALLY works for solo founders using AI

Research scope:
1. **Failure analysis**: Why do AI team simulations (multi-agent roleplaying) fail for solo founders? Academic papers, practitioner reports, known limitations of LLM-as-agent approaches
2. **What works instead**: Documented successful patterns for solo founders using AI — specific workflows, not theoretical frameworks
3. **Tool-specific insights**: How solo founders actually use Claude, GPT, Cursor, v0, Bolt, Replit Agent, etc. in their daily workflow
4. **Decision-making without a team**: How to get genuine second opinions from AI without the fake-team problem. Adversarial prompting, red-teaming, structured decision frameworks
5. **Product development workflow**: Solo founder → idea → validation → MVP → launch. Where does AI fit at each stage?
6. **Risk management**: Without real team members to catch errors, how do solo founders maintain quality and avoid blind spots?

Output: Comprehensive report with sections, citations, and actionable recommendations ranked by evidence strength.
```

## 결과 품질
- 6파트 종합 보고서 (Part I~VI + 6개 Ranked Recommendations)
- MAST 분류표 발견 (멀티에이전트 실패 정량 분류)
- Memory Bank 아키텍처 발견 (project_config.md + workflow_state.md)
- Judge Agent 개념 (독립 모델로 7x 정확도)
- CounselBench/MindEval 프레임워크 (멘탈헬스 특화)
- 3개 소스 중 가장 깊음

## 재사용 팁
- "Research scope" 를 번호 매겨서 구체적으로 지정하면 구조화된 보고서가 나옴
- "ranked by evidence strength" 가 핵심 — 근거 강도별 분류 강제
- Context에 실패 경험을 넣으면 "이미 해본 걸 또 추천"하는 걸 방지
