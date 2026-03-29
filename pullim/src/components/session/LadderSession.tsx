"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  LadderLevel,
  EntryMode,
  LadderMessage,
  LadderOption,
  CheatAction,
  ThemeSuggestion,
  PullimPromise,
} from "@/lib/session/ladder-types";
import { getActivePromises, checkPromise } from "@/lib/session/promise-store";
import { LEVEL_LABELS } from "@/lib/session/ladder-types";
import { useLadderStore } from "@/lib/session/ladder-store";
import { parseResponse } from "@/lib/session/response-parser";
import { getDemoSummary } from "@/lib/session/demo-ladder";
import { inferState, buildBehindContext, inferCheatAction, describeBehindInference } from "@/lib/session/behind-the-scenes";
import type { BehindInference } from "@/lib/session/behind-the-scenes";
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
  theme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말";
  entryMode: EntryMode;
  profileContext?: string; // ProbabilityProfile 기반 프롬프트 (있으면)
  onCrisis?: (crisis: { message: string; hotline: string }) => void;
  onThemeChange?: (theme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말") => void;
}

type Phase = "entry" | "session" | "summary";

interface EntryOption {
  level: LadderLevel;
  emoji: string;
  label: string;
  sub: string;
  recommended?: boolean;
}

const THEME_IMAGE_MAP: Record<string, string> = {
  "모험가": "adventure",
  "달빛정원": "garden",
  "전략실": "strategy",
  "천문대": "stargazer",
  "종말": "apocalypse",
};

const LEVEL_NARRATIVES: Record<string, Record<number, string>> = {
  adventure: {
    1: "갈림길 앞에 섰다. 모닥불이 흔들린다.",
    2: "두 갈래 길이 나타났다. 어느 쪽이 더 끌려?",
    3: "낡은 지도를 펼쳤다. 선명하게 보이는 것들이 있다.",
    4: "동료가 물었다. 어디로 향할 건지.",
    5: "마침내 직접 말할 차례다.",
  },
  garden: {
    1: "달빛이 내려앉은 정원. 꽃들이 저마다 다른 방향으로 피었다.",
    2: "두 갈래 오솔길이 나뉜다. 어느 쪽이 더 마음에 끌려?",
    3: "달빛 아래 물웅덩이에 무언가가 비친다.",
    4: "정원 한켠의 벤치. 이제 선택할 시간이다.",
    5: "마음 속 이야기를 직접 들어줄게.",
  },
  strategy: {
    1: "회의실 불이 켜졌다. 무엇부터 짚어볼까.",
    2: "두 선택지가 화이트보드에 나란히 적혔다.",
    3: "데이터를 정리했다. 패턴이 보이기 시작한다.",
    4: "결정을 내릴 시간이다. 어떻게 할 건지.",
    5: "직접 상황을 설명해줘.",
  },
  stargazer: {
    1: "별자리들이 빛난다. 어떤 별이 먼저 눈에 들어와?",
    2: "두 개의 별이 서로 다른 방향으로 이끈다.",
    3: "망원경을 통해 더 선명하게 보인다.",
    4: "우주의 좌표를 설정할 시간이다.",
    5: "직접 탐색 방향을 말해줘.",
  },
  apocalypse: {
    1: "폐허 속에서도 감각은 살아있다.",
    2: "두 갈래 생존 경로가 눈앞을 막는다.",
    3: "잔해들 사이로 패턴이 보이기 시작했다.",
    4: "마지막 선택의 순간이 왔다.",
    5: "있는 그대로 말해줘.",
  },
};

function getEntryOptions(profileContext?: string): EntryOption[] {
  // 프로필 기반: 분석적 성향이면 직접 말하기 추천, 나머지는 이야기 모드 추천
  let recommendLevel5 = false;
  if (profileContext) {
    const saMatch = profileContext.match(/selfAwareness:\s*([-\d.]+)/);
    const apMatch = profileContext.match(/approachStyle:\s*([-\d.]+)/);
    if (saMatch && apMatch) {
      const sa = parseFloat(saMatch[1]);
      const ap = parseFloat(apMatch[1]);
      if (sa > 0.3 && ap < -0.3) recommendLevel5 = true;
    }
  }

  return [
    {
      level: 1,
      emoji: "🎮",
      label: "이야기로 풀어볼래",
      sub: "레벨 1부터 선택지로 시작",
      recommended: !recommendLevel5,
    },
    {
      level: 5,
      emoji: "💬",
      label: "직접 말할게",
      sub: "자유롭게 이야기",
      recommended: recommendLevel5,
    },
  ];
}

export default function LadderSession({
  theme,
  entryMode,
  profileContext,
  onCrisis,
  onThemeChange,
}: LadderSessionProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const store = useLadderStore();

  const [phase, setPhase] = useState<Phase>("entry");
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [currentResponse, setCurrentResponse] = useState<ReturnType<typeof parseResponse> | null>(null);

  // 이면사고 추론 상태 (표시용)
  const [currentInference, setCurrentInference] = useState<BehindInference | null>(null);

  // 약속 확인 상태 (진입 화면)
  const [activePromise, setActivePromise] = useState<PullimPromise | null>(null);
  const [promiseChecked, setPromiseChecked] = useState(false);
  const [promiseFeedback, setPromiseFeedback] = useState<string | null>(null);

  // 치트 후 분기 상태
  const [cheatPostAction, setCheatPostAction] = useState<{
    show: boolean;
    action: CheatAction;
    themeSuggestion?: ThemeSuggestion;
  } | null>(null);

  // 행동 신호 추적
  const lastResponseTime = useRef<number>(0);
  const messageLengths = useRef<number[]>([]);
  const choiceStartTime = useRef<number>(0);
  const choiceChanges = useRef<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 배경 이미지 fade 트랜지션
  const [bgImage, setBgImage] = useState<string>("");
  const [bgOpacity, setBgOpacity] = useState<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [store.messages, streamText]);

  useEffect(() => {
    if (phase !== "session") return;
    const themeEn = THEME_IMAGE_MAP[theme] ?? "adventure";
    const newImage = `/images/levels/${themeEn}_level${store.currentLevel}.png`;
    setBgOpacity(0);
    const timer = setTimeout(() => {
      setBgImage(newImage);
      setBgOpacity(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [store.currentLevel, theme, phase]);

  // active 약속 로드 (진입 시 한 번)
  useEffect(() => {
    const promises = getActivePromises();
    if (promises.length > 0) {
      setActivePromise(promises[promises.length - 1]);
    }
  }, []);

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
      setCurrentInference(inference);
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
      setCurrentInference(inference);

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
      store.endSession(getDemoSummary(theme));
    }
    setPhase("summary");
    setIsLoading(false);
  }, [store, theme]);

  // ── 치트 선택지 ──
  const handleCheat = useCallback(() => {
    // cheatCount 증가
    store.incrementCheatCount();
    const newCheatCount = store.cheatCount + 1;

    // 이면사고 기반 치트 분기 판단
    const { action, themeSuggestion } = inferCheatAction(
      newCheatCount,
      store.behindEvents,
      store.messages,
      store.currentLevel,
      theme
    );

    // 이벤트 기록
    store.recordEvent({ type: "cheat", level: store.currentLevel });

    // 분기 UI 표시
    setCheatPostAction({ show: true, action, themeSuggestion });
  }, [store, theme]);

  // ── 치트 후 분기 처리 ──
  const handleCheatAction = useCallback(
    (selectedAction: CheatAction) => {
      setCheatPostAction(null);

      switch (selectedAction) {
        case "regenerate":
          // 같은 레벨에서 다시 생성
          sendToAI(store.messages, store.currentLevel, "[재생성 요청] 다른 접근으로 다시 시도해줘.");
          break;
        case "theme_suggest":
          // 테마 전환은 제안만 — 사용자가 수락하면 onThemeChange 호출
          // 이 경우 CheatPostActionUI에서 직접 처리
          break;
        case "fold":
          // 접어두기 → 세션 요약 생성
          generateSummary();
          break;
      }
    },
    [store, sendToAI, generateSummary]
  );

  // ── 테마 전환 수락 ──
  const handleThemeSwitch = useCallback(
    (targetTheme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말") => {
      setCheatPostAction(null);
      if (onThemeChange) {
        onThemeChange(targetTheme);
      } else {
        // 폴백: 라우터로 이동
        const themeRoutes: Record<string, string> = {
          "모험가": "/adventure",
          "전략실": "/strategy",
          "달빛정원": "/garden",
        };
        const route = themeRoutes[targetTheme] || "/adventure";
        const sessionId = store.sessionId || "new";
        router.push(`${route}/${sessionId}?mode=ladder&entry=${store.entryMode}`);
      }
    },
    [onThemeChange, router, store]
  );

  // ── 렌더링 ──
  const level = store.currentLevel;

  // 진입 화면 — 약속 확인 (active 약속 있을 때)
  if (phase === "entry" && activePromise && !promiseChecked) {
    return (
      <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2
            className="text-lg md:text-xl font-bold font-rpg-lg"
            style={{ color: "var(--fantasy-gold-bright)", textShadow: "0 0 20px rgba(192,163,116,0.3)" }}
          >
            지난번 약속 기억해?
          </h2>
          <p className="text-xs font-rpg-sm" style={{ color: "rgba(192,167,136,0.65)" }}>
            💫 해봤어?
          </p>
        </div>

        {!promiseFeedback ? (
          <>
            <div
              className="rpg-panel rounded-2xl p-5 space-y-3"
            >
              <p className="text-xs font-rpg-sm" style={{ color: "rgba(192,167,136,0.55)" }}>
                <span style={{ color: "var(--fantasy-gold)" }}>만약</span>{" "}
                {activePromise.trigger}
              </p>
              <p className="text-sm font-rpg" style={{ color: "var(--fantasy-text)" }}>
                → {activePromise.action}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  checkPromise(activePromise.id, "completed");
                  setPromiseFeedback("대단한데. 기억하고 지켜봤어.");
                }}
                className="rpg-panel-light w-full py-4 rounded-2xl text-sm font-rpg transition-all active:scale-[0.98] hover:scale-[1.01]"
                style={{ color: "var(--fantasy-gold-bright)" }}
              >
                ✓ 했어
              </button>
              <button
                onClick={() => {
                  checkPromise(activePromise.id, "failed");
                  setPromiseFeedback("괜찮아, 이것도 하나의 발견이야.");
                }}
                className="rpg-panel-light w-full py-4 rounded-2xl text-sm font-rpg transition-all active:scale-[0.98] hover:scale-[1.01]"
                style={{ color: "var(--fantasy-text)" }}
              >
                못했어
              </button>
              <button
                onClick={() => {
                  checkPromise(activePromise.id, "skipped");
                  setPromiseChecked(true);
                }}
                className="w-full py-2 text-center text-xs font-rpg-sm transition-colors"
                style={{ color: "rgba(192,167,136,0.40)" }}
              >
                나중에 얘기할게
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rpg-panel rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-rpg" style={{ color: "var(--fantasy-text)" }}>
                {promiseFeedback}
              </p>
            </div>
            <button
              onClick={() => setPromiseChecked(true)}
              className="rpg-panel-light w-full py-4 rounded-2xl text-sm font-rpg transition-all active:scale-[0.98] hover:scale-[1.01]"
              style={{ color: "var(--fantasy-text)" }}
            >
              오늘도 시작할게
            </button>
          </div>
        )}
      </div>
    );
  }

  // 진입 화면
  if (phase === "entry") {
    return (
      <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2
            className="text-lg md:text-xl font-bold font-rpg-lg"
            style={{ color: "var(--fantasy-gold-bright)", textShadow: "0 0 20px rgba(192,163,116,0.3)" }}
          >
            오늘은 어떻게 시작할까?
          </h2>
          <p className="text-xs font-rpg-sm" style={{ color: "rgba(192,167,136,0.65)" }}>편한 방식을 골라봐</p>
        </div>

        <div className="space-y-3">
          {getEntryOptions(profileContext).map((opt) => (
            <button
              key={opt.level}
              onClick={() => handleStartLevel(opt.level)}
              className="rpg-panel-light w-full text-left rounded-2xl transition-all active:scale-[0.98] hover:scale-[1.01]"
              style={
                opt.recommended
                  ? { padding: "20px", borderColor: "rgba(192,163,116,0.45)", borderWidth: "1px", borderStyle: "solid" }
                  : { padding: "16px 20px" }
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: opt.recommended ? "2rem" : "1.5rem" }}>{opt.emoji}</span>
                  <div>
                    <p
                      className="font-rpg"
                      style={{
                        color: "var(--fantasy-text)",
                        fontSize: opt.recommended ? "0.9rem" : "0.8rem",
                        fontWeight: opt.recommended ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5 font-rpg-sm" style={{ color: "rgba(192,167,136,0.60)" }}>
                      {opt.sub}
                    </p>
                  </div>
                </div>
                {opt.recommended && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(192,163,116,0.2)", color: "var(--fantasy-gold)" }}
                  >
                    ✦ 추천
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
        theme={theme}
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
    <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      {/* 배경 이미지 */}
      {bgImage && (
        <div
          className="w-full rounded-xl overflow-hidden flex-shrink-0 relative"
          style={{
            height: "28vh",
            opacity: bgOpacity,
            transition: "opacity 250ms ease",
          }}
        >
          <img
            src={bgImage}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.65)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 35%, var(--fantasy-bg, #1a1612) 100%)" }}
          />
        </div>
      )}

      {/* 레벨 인디케이터 + 내러티브 */}
      <div className="py-2 px-1 flex-shrink-0">
        <div className="flex items-center justify-between">
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
            <span className="text-[10px] ml-2 font-rpg-sm" style={{ color: "rgba(192,167,136,0.55)" }}>
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
        {/* 내러티브 텍스트 */}
        <p
          className="text-[10px] font-rpg-sm italic mt-0.5 ml-1 animate-in fade-in duration-500"
          style={{ color: "rgba(192,167,136,0.45)" }}
        >
          {LEVEL_NARRATIVES[THEME_IMAGE_MAP[theme] ?? "adventure"]?.[level] ?? ""}
        </p>
      </div>

      {/* 이면사고 표시 (showBehindThoughts 설정 on 시) */}
      {settings.showBehindThoughts && currentInference && describeBehindInference(currentInference) && (
        <div
          className="px-1 pb-1 text-[10px] font-rpg-sm animate-in fade-in duration-300"
          style={{ color: "rgba(192,163,116,0.45)" }}
        >
          {describeBehindInference(currentInference)}
        </div>
      )}

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
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <span
                    className="text-[11px] font-rpg-sm italic"
                    style={{ color: "rgba(192,163,116,0.40)" }}
                  >
                    {msg.content}
                  </span>
                </div>
              ) : hasStructured ? null : (
                <div className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
                  {msg.content}
                </div>
              )}
            </div>
          );
        })}

        {/* 스트리밍 중 — 구조화 태그 제거 후 표시 */}
        {isLoading && streamText && (
          <div className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {streamText.split(/\[(?:COMPARISON|SENSORY|ANALYSIS|OPTIONS|CHEAT|WRAP_SUGGEST|LISTEN_COMPLETE|SUMMARY|SESSION_SUMMARY_MODE|BEHIND_THE_SCENES)/)[0].trim() || "..."}
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

      {/* 치트 후 분기 UI */}
      {cheatPostAction?.show && (
        <div className="pb-4 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rpg-panel rounded-2xl p-4 space-y-3">
            {cheatPostAction.action === "fold" ? (
              <>
                <p className="text-sm font-rpg text-center" style={{ color: "var(--fantasy-text)" }}>
                  계속 안 맞는 것 같아... 접어둘까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheatAction("fold")}
                    className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                    style={{ color: "var(--fantasy-text)" }}
                  >
                    🗂️ 오늘은 여기까지
                  </button>
                  <button
                    onClick={() => {
                      setCheatPostAction(null);
                      sendToAI(store.messages, store.currentLevel, "[재생성 요청] 다른 접근으로 다시 시도해줘.");
                    }}
                    className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                    style={{ color: "var(--fantasy-text)" }}
                  >
                    🔄 좀 더 해볼게
                  </button>
                </div>
              </>
            ) : cheatPostAction.action === "theme_suggest" && cheatPostAction.themeSuggestion ? (
              <>
                <p className="text-sm font-rpg text-center leading-relaxed" style={{ color: "var(--fantasy-text)" }}>
                  {cheatPostAction.themeSuggestion.reason}
                </p>
                <p className="text-xs font-rpg-sm text-center" style={{ color: "rgba(192,167,136,0.55)" }}>
                  분위기 바꿔볼까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleThemeSwitch(cheatPostAction.themeSuggestion!.targetTheme)}
                    className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                    style={{ color: "var(--fantasy-gold-bright)" }}
                  >
                    ✨ {cheatPostAction.themeSuggestion.targetTheme}로 가볼게
                  </button>
                  <button
                    onClick={() => {
                      setCheatPostAction(null);
                      sendToAI(store.messages, store.currentLevel, "[재생성 요청] 다른 접근으로 다시 시도해줘.");
                    }}
                    className="rpg-panel-light flex-1 py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                    style={{ color: "var(--fantasy-text)" }}
                  >
                    🔄 여기서 계속할게
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-rpg text-center" style={{ color: "var(--fantasy-text)" }}>
                  다른 방식으로 다시 해볼게
                </p>
                <button
                  onClick={() => handleCheatAction("regenerate")}
                  className="rpg-panel-light w-full py-3 rounded-xl text-sm font-rpg transition-all active:scale-95"
                  style={{ color: "var(--fantasy-text)" }}
                >
                  🔄 다시 해보자
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 현재 레벨 인터랙션 */}
      {!isLoading && currentResponse && !cheatPostAction?.show && (
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
              text=""
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
                text=""
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
