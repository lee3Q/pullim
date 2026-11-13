# Pullim: User Jobs, Research Foundations, and Safety Boundaries

## 1. Core User Job

An adult has an ordinary, non-emergency concern (career choice, project priority, relationship boundary, or cognitive overload). A blank journal is too hard to begin, while generic chatbots jump straight to prescriptive advice. They want a structured, Socratic unraveling flow that ends with **their own reversible choice and concrete action cue**, not an AI verdict.

Each Pullim session produces:

1. **Facts vs. Assumptions Separation**: What actually happened vs. unverified fears/projections, paired with counter-example questions.
2. **Cognitive Trap Inspection**: Detection of binary thinking, catastrophizing, mind-reading, should-pressure, sunk-cost bias, and analysis paralysis.
3. **Three Perspective Lenses**: Grounding (emotional/energy), Structural (reversibility/info-value), and Exploratory (inversion/48h trial).
4. **Bidirectional 5-Level Cognitive Ladder**:
   - **Climb Up (`Level 1 → 5`)**: Start from somatic/sensory resonance when overwhelmed and climb toward articulation.
   - **Step Down (`Level 5 → 1`)**: Step down from over-rationalized analysis to gut/sensory comparison when logically done but emotionally stuck.
5. **Reversible Micro-Experiment & If-Then Implementation Intention**: `"When [trigger X] occurs, I will do [10-minute action Y]."`
6. **Local-First Review & Portability**: Follow-up completion/reflection loop, Hall of Insights (`명예의 전당`), and full JSON/Markdown export & import.

---

## 2. Research Translated into Design

| Evidence | Design Implication in Pullim | Boundary |
|---|---|---|
| Becker et al. (2023), five-step metacognitive reflection experiment [1] | Separate facts from assumptions, ask how a choice was reached, and surface what new information would change it. | Does not clinically validate Pullim or diagnose a user. |
| Gollwitzer & Sheeran (2006), implementation-intentions meta-analysis [2] | Guide users to author concrete `If [situation X], then [action Y]` commitments and review them in the Decision Journal. | Mechanistic behavioral research, not a clinical trial of this software. |
| JMIR GenAI chatbot meta-analysis (2025) [3, 4] | Treat AI benefit as uncertain; prioritize deterministic safety gates, user agency, and zero dark-pattern lock-in. | Pullim is a non-clinical self-reflection and decision-structuring tool. |
| Decision-journal practitioner literature [5, 6] | Keep first use under 3 minutes; preserve rationale, alternatives, and recommended defaults; support Markdown/JSON portability. | Designed for everyday decision hygiene, not emergency intervention. |

---

## 3. Engineering & Open-Source Governance Status

- **License**: Released under the **MIT License** ([`LICENSE`](../LICENSE)).
- **Runtime Dependencies**: **0 external npm dependencies** (`npm audit` findings: **0**). Runs natively on Node.js 22+ TypeScript.
- **Verification**: 54 automated tests (`npm test`) covering deterministic crisis safety gates, policy state concurrency, fact/assumption separation, bidirectional 5-level ladder, JSON/Markdown portability, HTTP server endpoints, and CLI commands.

---

## 4. Sources

1. Becker et al. (2023), *Systematic metacognitive reflection helps people discover farsighted decision strategies: a process-tracing experiment*. https://www.cambridge.org/core/journals/judgment-and-decision-making/article/systematic-metacognitive-reflection-helps-people-discover-farsighted-decision-strategies-a-processtracing-experiment/BA25E058C30249E1A22D464A6145165E
2. Gollwitzer & Sheeran (2006), *Implementation intentions and goal achievement: a meta-analysis of effects and processes*. https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f
3. *Generative AI Mental Health Chatbots as Therapeutic Tools*, JMIR (2025). https://www.jmir.org/2025/1/e78238/
4. *The Effectiveness of AI Chatbots in Alleviating Mental Distress and Promoting Health Behaviors*, JMIR (2025). https://www.jmir.org/2025/1/e79850
5. Hacker News, *Use a Decision Journal* (2020). https://news.ycombinator.com/item?id=22694014
6. Reddit, *Do you use a Decision Journal?* (2020). https://www.reddit.com/r/slatestarcodex/comments/ge3yht/do_you_use_a_decision_journal/
