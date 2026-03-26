"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  LadderLevel,
  EntryMode,
  LadderMessage,
  LadderOption,
} from "@/lib/session/ladder-types";
import { LEVEL_LABELS } from "@/lib/session/ladder-types";
import { useLadderStore } from "@/lib/session/ladder-store";
import { parseResponse } from "@/lib/session/response-parser";
import { inferState, buildBehindContext } from "@/lib/session/behind-the-scenes";
import { buildLevelPrompt, buildEndDetectionPrompt } from "@/lib/session/prompt-builder";
import { shouldLevelUp, shouldLevelDown, detectFreeTextIntent } from "@/lib/session/level-detector";
import type { BehaviorSignals } from "@/lib/personalization/behavior-reader";
import { updateRecommendationRate } from "@/lib/personalization/probability-profile";
import { useSettings } from "@/hooks/useSettings";

import SensoryLevel from "./levels/SensoryLevel";
import ComparisonLevel from "./levels/ComparisonLevel";
import AnalysisLevel from "./levels/AnalysisLevel";
import ChoiceLevel from "./levels/ChoiceLevel";
import TextInputLevel from "./levels/TextInputLevel";
import SessionSummary from "./SessionSummary";

interface LadderSessionProps {
  theme: "모험가" | "전략실" | "달빛정원";
  entryMode: EntryMode;
  profileContext?: string; // ProbabilityProfile 기반 프롬프트 (있으면)
  onCrisis?: (crisis: { message: string; hotline: string }) => void;
}

type Phase = "entry" | "session" | "summary";

interface EntryOption {
  level: LadderLevel;
  emoji: string;
  label: string;
  sub: string;
  recommended?: boolean;
}

function getEntryOptions(profileContext?: string): EntryOption[] {
  // 프로필이 있으면 selfAwareness 기반 추천, 없으면 Level 4 기본 추천
  let recommendedLevel: LadderLevel = 4;
  if (profileContext) {
    const saMatch = profileContext.match(/selfAwareness:\s*([-\d.]+)/);
    const apMatch = profileContext.match(/approachStyle:\s*([-\d.]+)/);
    if (saMatch && apMatch) {
      const sa = parseFloat(saMatch[1]);
      const ap = parseFloat(apMatch[1]);
      if (sa > 0.3 && ap < -0.3) recommendedLevel = 5; // 분석적 → 직접 말하기
      else if (sa < -0.3) recommendedLevel = 1; // 자기이해 낮음 → 감각
    }
  }

  return [
    { level: 5, emoji: "💬", label: "직접 말할게", sub: "자유롭게 이야기", recommended: recommendedLevel === 5 },
    { level: 4, emoji: "📋", label: "선택지 보여줘", sub: "골라가면서 진행", recommended: recommendedLevel === 4 },
    { level: 1, emoji: "🎴", label: "느낌으로 할래", sub: "감각적으로 시작", recommended: recommendedLevel === 1 },
  ];
}

export default function LadderSession({
  theme,
  entryMode,
  profileContext,
  onCrisis,
}: LadderSessionProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const store = useLadderStore();

  const [phase, setPhase] = useState<Phase>("entry");
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [currentResponse, setCurrentResponse] = useState<ReturnType<typeof parseResponse> | null>(null);

  // 행동 신호 추적
  const lastResponseTime = useRef<number>(0);
  const messageLengths = useRef<number[]>([]);
  const choiceStartTime = useRef<number>(0);
  const choiceChanges = useRef<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [store.messages, streamText]);

  // ── 세션 시작 ──
  const handleStartLevel = useCallback(
    (level: LadderLevel) => {
      store.initSession({ theme, entryMode, startLevel: level });
      setPhase("session");

      // 첫 AI 메시지 요청
      sendToAI([], level, "세션을 시작합니다. 첫 번째 질문을 하세요.");
    },
    [theme, entryMode]
  );

  // ── AI에게 메시지 전송 ──
  const sendToAI = useCallback(
    async (
      history: LadderMessage[],
      level: LadderLevel,
      userText?: string
    ) => {
      setIsLoading(true);
      setStreamText("");
      setCurrentResponse(null);
      choiceStartTime.current = Date.now();

      const chatMessages = history
        .filter((m) => m.role !== "system")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      if (userText) {
        chatMessages.push({ role: "user" as const, content: userText });
      }

      // 행동 신호 수집
      const signals: BehaviorSignals = {
        responseTimeMs: lastResponseTime.current
          ? Date.now() - lastResponseTime.current
          : 0,
        messageLength: userText?.length || 0,
        lengthTrend: getLengthTrend(messageLengths.current),
        timeTrend: "stable",
        choiceHesitationMs: choiceStartTime.current
          ? Date.now() - choiceStartTime.current
          : 0,
        choiceChanges: choiceChanges.current,
        turnCount: store.turnCount,
      };

      // 이면 사고 추론 (LLM 기반, 실패 시 규칙 기반 폴백)
      const inference = await inferState(signals, store.behindEvents, level, history);
      const behindContext = buildBehindContext(inference);

      // 레벨 프롬프트
      const levelPrompt = buildLevelPrompt(level, store.entryMode);
      const endPrompt = buildEndDetectionPrompt();

      try {
        const response = await fetch("/api/ultimate/listen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatMessages.length > 0
              ? chatMessages
              : [{ role: "user", content: "시작" }],
            userName: null,
            turnCount: store.turnCount,
            theme,
            behaviorSignals: signals,
            personalizationContext: profileContext || undefined,
            sensoryLadderContext: [levelPrompt, endPrompt, behindContext]
              .filter(Boolean)
              .join("\n\n"),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("API error");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Tier A 위기 감지: 즉시 중단 + 모달
              if (parsed.crisis && parsed.tier === "A") {
                const hotlineText = parsed.hotlines
                  ?.map((h: { name: string; number: string; description: string }) => `${h.name}: ${h.number} (${h.description})`)
                  .join("\n") || "자살예방상담전화: 109";
                onCrisis?.({ message: parsed.text, hotline: hotlineText });
                setIsLoading(false);
                return;
              }

              if (parsed.text) {
                fullText += parsed.text;
                setStreamText(fullText);
              }
            } catch {
              // skip parse errors
            }
          }
        }

        // 전체 응답 파싱
        const result = parseResponse(fullText);
        setCurrentResponse(result);
        setStreamText("");

        // assistant 메시지 추가
        store.addMessage({
          role: "assistant",
          content: result.text,
          level,
          options: result.options.length > 0 ? result.options : undefined,
          analysisCard: result.analysisCard || undefined,
          comparisonCards: result.comparisonCards || undefined,
          sensoryCards: result.sensoryCards.length > 0 ? result.sensoryCards : undefined,
        });

        // 레벨 자동 조정 (이면 사고 기반)
        if (inference.suggestLevelUp && shouldLevelUp(level, inference, store.messages, store.behindEvents)) {
          const nextLevel = Math.min(5, level + 1) as LadderLevel;
          store.setLevel(nextLevel);
        }

        lastResponseTime.current = Date.now();
        choiceChanges.current = 0;

        // 세션 종료 제안 감지
        if (result.wrapSuggest && result.summary) {
          store.endSession(result.summary);
          setPhase("summary");
        }
      } catch {
        store.addMessage({
          role: "assistant",
          content: "잠깐 연결이 끊겼어... 다시 한번 해볼래?",
          level,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [theme, profileContext, store]
  );

  // ── 사용자 응답 처리 ──
  const handleUserResponse = useCallback(
    async (text: string, isUnknown = false, isCheat = false) => {
      const level = store.currentLevel;

      // 행동 길이 추적
      messageLengths.current.push(text.length);
      if (messageLengths.current.length > 10) messageLengths.current.shift();

      // user 메시지 추가
      store.addMessage({ role: "user", content: text, level });
      store.incrementTurn();

      // 이벤트 기록
      if (isCheat) {
        store.recordEvent({ type: "cheat", level });
      }

      // 레벨 이동 판단
      const signals: BehaviorSignals = {
        responseTimeMs: lastResponseTime.current ? Date.now() - lastResponseTime.current : 0,
        messageLength: text.length,
        lengthTrend: getLengthTrend(messageLengths.current),
        timeTrend: "stable",
        choiceHesitationMs: choiceStartTime.current ? Date.now() - choiceStartTime.current : 0,
        choiceChanges: choiceChanges.current,
        turnCount: store.turnCount,
      };
      const inference = await inferState(signals, store.behindEvents, level, store.messages);

      let nextLevel = level;
      if (isUnknown && shouldLevelDown(level, inference, true)) {
        nextLevel = Math.max(1, level - 1) as LadderLevel;
        store.setLevel(nextLevel);
      } else if (detectFreeTextIntent(text) && level === 4) {
        nextLevel = 5;
        store.setLevel(5);
      }

      // AI에게 전달
      sendToAI(store.messages, nextLevel, text);
    },
    [store, sendToAI]
  );

  // ── 선택지 선택 ──
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (!currentResponse) return;
      const opt = currentResponse.options.find((o) => o.id === optionId);
      if (!opt) return;

      // 추천 수락/거부 기록 + ProbabilityProfile 업데이트
      const recommended = currentResponse.options.find((o) => o.isRecommended);
      if (recommended) {
        const accepted = opt.isRecommended;
        store.recordEvent({
          type: accepted ? "recommendation_accept" : "recommendation_reject",
          level: store.currentLevel,
        });
        // localStorage의 프로필에 반영 (빈도가 성격)
        try {
          const raw = localStorage.getItem("pullim_profile");
          if (raw) {
            const profile = JSON.parse(raw);
            const updated = updateRecommendationRate(profile, accepted);
            localStorage.setItem("pullim_profile", JSON.stringify(updated));
          }
        } catch {}
      }

      handleUserResponse(
        `${opt.emoji} ${opt.text}`,
        opt.isFallback,
        false
      );
    },
    [currentResponse, store, handleUserResponse]
  );

  // ── 치트 선택지 ──
  const handleCheat = useCallback(() => {
    handleUserResponse(
      currentResponse?.cheatText || "다 별로야",
      false,
      true
    );
  }, [currentResponse, handleUserResponse]);

  // ── 세션 요약 생성 ──
  const generateSummary = useCallback(async () => {
    setIsLoading(true);
    // 대화에서 핵심 추출
    const userMessages = store.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .slice(-10);
    const assistantMessages = store.messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .slice(-5);

    if (userMessages.length === 0) {
      store.endSession("오늘은 여기까지.");
      setPhase("summary");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ultimate/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `지금까지 대화 요약:\n사용자: ${userMessages.join(" / ")}\nAI: ${assistantMessages.join(" / ")}` },
          ],
          userName: null,
          turnCount: 0,
          theme,
          sensoryLadderContext: [
            "[SESSION_SUMMARY_MODE]",
            "지금까지의 대화를 1~3줄로 정리하라. 오늘 발견한 것, 사용자가 보여준 경향을 중심으로.",
            "선택지, 분석카드, 태그 일체 사용하지 마라. 순수 텍스트만.",
            "따뜻하게, 짧게.",
            "[/SESSION_SUMMARY_MODE]",
          ].join("\n"),
        }),
      });

      if (!res.ok || !res.body) throw new Error("summary failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") continue;
          try { text += JSON.parse(d).text || ""; } catch {}
        }
      }
      // 태그 제거
      const clean = text
        .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/g, "")
        .replace(/\[CHEAT\][\s\S]*?\[\/CHEAT\]/g, "")
        .trim();
      store.endSession(clean || "오늘 이야기를 나눴어.");
    } catch {
      store.endSession("오늘도 수고했어.");
    }
    setPhase("summary");
    setIsLoading(false);
  }, [store, theme]);

  // ── 렌더링 ──
  const level = store.currentLevel;

  // 진입 화면
  if (phase === "entry") {
    return (
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <h2
            className="text-lg font-bold mb-2 font-rpg-lg"
            style={{ color: "var(--fantasy-gold-bright)", textShadow: "0 0 20px rgba(192,163,116,0.3)" }}
          >
            오늘은 어떻게 시작할까?
          </h2>
          <p className="text-xs font-rpg-sm" style={{ color: "rgba(192,167,136,0.70)" }}>편한 방식을 골라봐</p>
        </div>

        <div className="space-y-3">
          {getEntryOptions(profileContext).map((opt) => (
            <button
              key={opt.level}
              onClick={() => handleStartLevel(opt.level)}
              className="rpg-panel-light w-full text-left py-4 px-5 rounded-2xl transition-all active:scale-[0.98] hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-medium font-rpg" style={{ color: "var(--fantasy-text)" }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5 font-rpg-sm" style={{ color: "rgba(192,167,136,0.65)" }}>{opt.sub}</p>
                  </div>
                </div>
                {opt.recommended && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(192,163,116,0.2)", color: "var(--fantasy-gold)" }}>
                    추천
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 요약 화면
  if (phase === "summary" && store.summary) {
    return (
      <SessionSummary
        summary={store.summary}
        onClose={() => {
          store.endSession(store.summary!); // keep summary
          setPhase("session");
          // 이미 isEnded=true 이므로 리셋
          useLadderStore.setState({ isEnded: false });
        }}
        onBackToHome={() => router.push("/")}
      />
    );
  }

  // 세션 화면
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      {/* 레벨 인디케이터 */}
      <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-2">
          {([1, 2, 3, 4, 5] as LadderLevel[]).map((l) => (
            <div
              key={l}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                background: l === level ? "var(--fantasy-gold)" : "rgba(192,163,116,0.2)",
                transform: l === level ? "scale(1.25)" : "scale(1)",
                boxShadow: l === level ? "0 0 6px rgba(192,163,116,0.4)" : "none",
              }}
            />
          ))}
          <span className="text-[10px] ml-2 font-rpg-sm" style={{ color: "rgba(192,167,136,0.60)" }}>
            {LEVEL_LABELS[level]}
          </span>
        </div>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="text-[10px] font-rpg-sm transition-colors disabled:opacity-30 py-2 px-1"
          style={{ color: "rgba(192,163,116,0.55)" }}
        >
          오늘은 여기까지
        </button>
      </div>

      {/* 대화 히스토리 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {store.messages.map((msg) => {
          // 구조화 데이터(감각카드/선택지/분석/대비)가 있는 assistant 메시지는 텍스트 숨김
          const hasStructured = msg.role === "assistant" && (
            (msg.sensoryCards && msg.sensoryCards.length > 0) ||
            (msg.options && msg.options.length > 0) ||
            msg.analysisCard ||
            msg.comparisonCards
          );
          return (
            <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
              {msg.role === "user" ? (
                <div
                  className="inline-block max-w-[80%] py-2 px-4 rounded-2xl text-sm font-rpg"
                  style={{
                    background: "rgba(75,43,26,0.4)",
                    border: "1px solid rgba(192,163,116,0.2)",
                    color: "var(--fantasy-gold-bright)",
                  }}
                >
                  {msg.content}
                </div>
              ) : hasStructured ? null : (
                <div className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
                  {msg.content}
                </div>
              )}
            </div>
          );
        })}

        {/* 스트리밍 중 */}
        {isLoading && streamText && (
          <div className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {streamText}
          </div>
        )}
        {isLoading && !streamText && (
          <div className="flex gap-1 py-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(192,163,116,0.3)" }} />
            <div className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:200ms]" style={{ background: "rgba(192,163,116,0.3)" }} />
            <div className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:400ms]" style={{ background: "rgba(192,163,116,0.3)" }} />
          </div>
        )}
      </div>

      {/* 현재 레벨 인터랙션 */}
      {!isLoading && currentResponse && (
        <div className="pb-4">
          {level === 1 && currentResponse.sensoryCards.length > 0 && (
            <SensoryLevel
              question={currentResponse.text}
              cards={currentResponse.sensoryCards}
              onSelect={(cardId) => {
                const card = currentResponse.sensoryCards.find((c) => c.id === cardId);
                if (card) handleUserResponse(`${card.emoji} ${card.label}`);
              }}
              onCheat={handleCheat}
            />
          )}

          {level === 2 && currentResponse.comparisonCards && (
            <ComparisonLevel
              cards={currentResponse.comparisonCards}
              onSelectA={() =>
                handleUserResponse(
                  `${currentResponse.comparisonCards![0].emoji} ${currentResponse.comparisonCards![0].title}`
                )
              }
              onSelectB={() =>
                handleUserResponse(
                  `${currentResponse.comparisonCards![1].emoji} ${currentResponse.comparisonCards![1].title}`
                )
              }
              onNeither={() => handleUserResponse("둘 다 아닌데", true)}
              onCheat={handleCheat}
            />
          )}

          {level === 3 && currentResponse.analysisCard && (
            <AnalysisLevel
              card={currentResponse.analysisCard}
              onAgree={() => handleUserResponse("맞아")}
              onDisagree={() => handleUserResponse("아닌데")}
              onUnsure={() => handleUserResponse("모르겠어", true)}
              onCheat={handleCheat}
            />
          )}

          {level === 4 && currentResponse.options.length > 0 && (
            <ChoiceLevel
              text={currentResponse.text}
              options={currentResponse.options}
              cheatText={currentResponse.cheatText}
              showRecommendations={settings.showRecommendations}
              onSelect={handleOptionSelect}
              onFreeText={() => {
                store.setLevel(5);
                // 같은 응답을 Level 5 형태로 보여줌
              }}
              onCheat={handleCheat}
            />
          )}

          {level === 5 && (
            <TextInputLevel
              text={currentResponse.text}
              onSend={(msg) => handleUserResponse(msg)}
              onSwitchToChoices={() => {
                store.setLevel(4);
                sendToAI(store.messages, 4);
              }}
              isLoading={isLoading}
            />
          )}

          {/* 폴백: 구조화 데이터 없으면 선택지 레벨로 */}
          {level !== 5 &&
            currentResponse.options.length === 0 &&
            !currentResponse.analysisCard &&
            !currentResponse.comparisonCards &&
            currentResponse.sensoryCards.length === 0 && (
              <TextInputLevel
                text={currentResponse.text}
                onSend={(msg) => handleUserResponse(msg)}
                onSwitchToChoices={() => sendToAI(store.messages, 4)}
                isLoading={isLoading}
              />
            )}
        </div>
      )}
    </div>
  );
}

// 유틸: 메시지 길이 트렌드
function getLengthTrend(
  lengths: number[]
): "shorter" | "stable" | "longer" {
  if (lengths.length < 3) return "stable";
  const recent = lengths.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prev = lengths.slice(-6, -3);
  if (prev.length === 0) return "stable";
  const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;

  if (avg < prevAvg * 0.6) return "shorter";
  if (avg > prevAvg * 1.5) return "longer";
  return "stable";
}
