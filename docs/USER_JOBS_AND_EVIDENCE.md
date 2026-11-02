# Pullim: user jobs and evidence boundaries

Research checked 2026-11-02. A product hypothesis, not proof of benefit.

## Proposed first user job

An adult has an ordinary, non-emergency concern such as which small project to
start this week. A blank journal is hard to begin. They want a short guided
conversation that ends with their own reversible choice, not an AI verdict.

A useful session would produce:

1. A question in the user's own words, with assumptions separated from facts.
2. Alternatives, including doing nothing or seeking more information.
3. A provisional choice the user may reject.
4. A next action and a cue for doing it, followed by a later review.

The current app has listen, research, analysis, conclusion and action stages
with consent and risk gates. This is relevant implementation, not evidence
that users complete the flow or make better decisions. The `/history` page at this revision always renders an empty state; there is no
complete visible return-and-review loop there. This is a concrete product gap,
not a request to add more themes. A research-stage label
also does not guarantee that every model statement has a reliable citation.

## Research translated into design, not marketing

| Evidence | Design implication | Boundary |
|---|---|---|
| Becker et al. (2023), five-step planning experiment [1] | Ask how a choice was reached, which information was used, and what might change it. | Does not validate Pullim, diagnose a person, or demonstrate everyday clinical benefit. |
| Gollwitzer & Sheeran (2006), implementation-intention meta-analysis [2] | Offer a user-authored action cue: "When situation X occurs, I will do Y." | The ultimate conclusion flow offers a deadline, which is not by itself an if-then plan. The separate LadderSession/SessionSummary path already saves if-then promises and supports completed/failed/skipped review; do not describe the entire app as missing follow-up. |
| JMIR GenAI chatbot meta-analysis (2025), 14 randomized trials [3] | Treat benefit as uncertain and study-specific; retain safety, consent, and human alternatives. | Pooled effect was 0.30 with a very wide prediction interval (-0.85 to 1.67). This is not an effect size for Pullim. |
| JMIR broader chatbot review (2025), 31 RCTs included, 26 meta-analyzed [4] | Engagement and safety deserve evaluation alongside symptom measures. | Mixed chatbot architectures and populations cannot establish effectiveness of this exact generative decision-support flow. |
| Decision-journal community discussions [5,6] | Keep first use short; preserve rationale and alternatives; avoid forcing a daily exhaustive diary. | Anecdotes are not interviews with Pullim users or representative market evidence. |

The reviews overlap in domain and may include overlapping studies. They are
not independent confirmations of this product. Older implementation-intention
research is mechanistic background, not a modern app trial.

## What to test before adding more features

First compare a guided flow with a plain note template using fictional or
consented, low-stakes decisions. Observe whether participants can explain the
question, alternatives, and next action, identify uncertainty, reject a model
suggestion, and find the privacy boundary. Record completion, abandonment,
misinterpretation, and adverse feedback. Do not call a small usability study an
RCT or claim clinical efficacy from satisfaction scores.

For a later outcomes study, predefine an active comparator, independent review
criteria, follow-up time, consent and data handling. Assess whether users can
recover and revise their own reasoning. Decision confidence alone is not
quality: a convincing chatbot could increase confidence while being wrong.
Clinical or crisis use would require qualified safety review and substantially
stronger evidence. It is outside the present use case.

## Engineering gates found in the current checkout

At revision 0819f3d, 24 Node tests and a production build passed. This does not
verify every UI branch or native app. `npm audit --omit=dev` on 2026-11-02 reported
17 findings, including 4 critical and 8 high. Next.js and Capacitor advisories
are listed below [7,8]; each has conditions of exploitability. Dependency
remediation and regression tests are required before public deployment, but
were deliberately not mixed into a documentation patch.

There is no repository license file at the inspected revision. Before calling
this reusable open-source software, its owner should select a license. No
license, public deployment, paid API activation, or release is authorized by
this document.

## Sources

1. Becker et al. (2023), primary process-tracing experiment. https://www.cambridge.org/core/journals/judgment-and-decision-making/article/systematic-metacognitive-reflection-helps-people-discover-farsighted-decision-strategies-a-processtracing-experiment/BA25E058C30249E1A22D464A6145165E
2. Gollwitzer & Sheeran (2006), *Implementation intentions and goal achievement: a meta-analysis of effects and processes*. University-hosted record and abstract. https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f
3. *Generative AI Mental Health Chatbots as Therapeutic Tools*, JMIR (2025). https://www.jmir.org/2025/1/e78238/
4. *The Effectiveness of AI Chatbots in Alleviating Mental Distress and Promoting Health Behaviors Among Adolescents and Young Adults*, JMIR (2025). https://www.jmir.org/2025/1/e79850
5. Hacker News, *Use a Decision Journal* (2020), anecdotes. https://news.ycombinator.com/item?id=22694014
6. Reddit, *Do you use a Decision Journal?* (2020), anecdotes. https://www.reddit.com/r/slatestarcodex/comments/ge3yht/do_you_use_a_decision_journal/
7. GitHub reviewed Next.js advisory GHSA-673q-mjm6-r5xr. https://github.com/advisories/GHSA-673q-mjm6-r5xr
8. GitHub reviewed Capacitor advisory GHSA-rvm3-566m-v7fv. https://github.com/advisories/GHSA-rvm3-566m-v7fv
