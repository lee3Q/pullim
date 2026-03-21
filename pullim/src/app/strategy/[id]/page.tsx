"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  StageName,
  CrystalName,
  CrystalAnalysis,
  Disagreement,
  ModelProvider,
  DataCard,
  ConclusionData,
  ActionCommitment,
  DebateRound,
  CRYSTALS,
} from "@/lib/types-ultimate";
import { getTheme } from "@/lib/themes";
import { useBGM } from "@/hooks/useBGM";
import ThemedBackground from "@/components/ultimate/backgrounds/ThemedBackground";
import ProgressVisual from "@/components/game/ProgressVisual";
import CrystalSelector from "@/components/ultimate/CrystalSelector";
import DataCardList from "@/components/ultimate/DataCardList";
import CrystalAnalysisView from "@/components/ultimate/CrystalAnalysisView";
import ConclusionView from "@/components/ultimate/ConclusionView";
import LoadingOverlay from "@/components/ultimate/LoadingOverlay";
import CrisisAlert from "@/components/CrisisAlert";
import GameDialogue from "@/components/game/GameDialogue";
import GameChoices from "@/components/game/GameChoices";
import GameInput from "@/components/game/GameInput";

const theme = getTheme("전략실");

const ERROR_MSG = "시스템 응답 지연입니다. 잠시 후 다시 시도해주세요.";

type TimelineItem =
  | { type: "dialogue"; role: "character" | "user"; text: string }
  | { type: "research-cards" }
  | { type: "crystal-analysis" };

export default function StrategySessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { playing, trackLabel, toggle: toggleBGM, nextTrack } = useBGM(theme.assets.bgmTracks);

  // 세션 상태
  const [stage, setStage] = useState<StageName>("ENTER");
  const [userName, setUserName] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisis, setCrisis] = useState<{
    message: string;
    hotline: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [showInitialTyping, setShowInitialTyping] = useState(true);

  // 파이프라인 데이터
  const [concern, setConcern] = useState<string>("");
  const [listenSummary, setListenSummary] = useState<string>("");
  const [listenMessages, setListenMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [turnCount, setTurnCount] = useState(0);
  const [dataCards, setDataCards] = useState<DataCard[]>([]);
  const [crystalAnalyses, setCrystalAnalyses] = useState<CrystalAnalysis[]>([]);
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [debateRounds, setDebateRounds] = useState<DebateRound[]>([]);
  const [debateSynthesis, setDebateSynthesis] = useState("");
  const [crystalModelMap, setCrystalModelMap] = useState<
    Partial<Record<CrystalName, ModelProvider>>
  >({});
  const [selectedCrystals, setSelectedCrystals] = useState<CrystalName[]>([]);
  const [conclusion, setConclusion] = useState<ConclusionData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [timeline, scrollToBottom]);

  // Show game choices after streaming ends
  const choicesVisible = !isStreaming && options.length > 0;

  const addDialogue = useCallback(
    (role: "character" | "user", text: string) => {
      setTimeline((prev) => [...prev, { type: "dialogue", role, text }]);
    },
    []
  );

  const addTimelineMarker = useCallback(
    (type: "research-cards" | "crystal-analysis") => {
      setTimeline((prev) => [...prev, { type }]);
    },
    []
  );

  // 초기 입장
  useEffect(() => {
    if (stage === "ENTER" && timeline.length === 0) {
      const t1 = setTimeout(() => {
        setShowInitialTyping(false);
        addDialogue("character", "접수되었습니다.");
      }, 1000);
      const t2 = setTimeout(
        () =>
          addDialogue(
            "character",
            theme.labels.enter + "\n" + theme.labels.askConcern
          ),
        2500
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [stage, timeline.length, addDialogue]);

  // --- API 호출 함수들 ---

  const callListenAPI = async (messages: { role: string; content: string }[], turns: number) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userName, turnCount: turns, theme: "전략실" }),
      });

      if (!response.ok) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";
      let listenComplete = false;
      let newSummary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.crisis) {
              setCrisis({
                message: parsed.text || parsed.hotlines?.[0]?.name || "",
                hotline: parsed.hotlines?.[0]?.number || "109",
              });
              setIsStreaming(false);
              return;
            }

            if (parsed.text) {
              fullText += parsed.text;
            }

            if (parsed.listenSummary) {
              newSummary = parsed.listenSummary;
              setListenSummary(parsed.listenSummary);
            }

            if (parsed.recommendedCrystals) {
              void parsed.recommendedCrystals;
            }

            if (parsed.listenComplete) {
              listenComplete = true;
            }
          } catch {
            // 파싱 실패 무시
          }
        }
      }

      const optionsMatch = fullText.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
      if (optionsMatch) {
        const optionLines = optionsMatch[1]
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        setOptions(optionLines);
      } else {
        setOptions([]);
      }

      const displayText = fullText
        .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "")
        .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/, "")
        .replace(/\[CRYSTALS\][\s\S]*?\[\/CRYSTALS\]/, "")
        .replace(/\[LISTEN_COMPLETE\]/, "")
        .trim();

      if (displayText) {
        addDialogue("character", displayText);
      }

      setIsStreaming(false);

      if (listenComplete && newSummary) {
        setTimeout(() => {
          addDialogue(
            "character",
            "안건을 파악했습니다.\n관련 자료를 조회하겠습니다..."
          );
          setStage("RESEARCH");
          callResearchAPI(newSummary);
        }, 1500);
      }
    } catch {
      addDialogue("character", ERROR_MSG);
      setIsStreaming(false);
    }
  };

  const callAnalyzeAPI = async (crystals: CrystalName[]) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          selectedCrystals: crystals,
          listenSummary,
          concern,
        }),
      });

      if (!response.ok) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();

      if (data.crisis) {
        setCrisis({
          message: data.message,
          hotline: data.hotlines?.[0]?.number || "109",
        });
        setIsStreaming(false);
        return;
      }

      const analyses = data.analyses || [];
      setCrystalAnalyses(analyses);
      setDisagreements(data.disagreements || []);
      setCrystalModelMap(data.crystalModelMap || {});
      setStage("DISCUSS_2");
      setIsStreaming(false);

      // 전문가 이름으로 선택지 표시
      const crystalOptions = analyses.map((a: CrystalAnalysis) => {
        const c = CRYSTALS.find(c => c.name === a.crystal);
        return `${c?.icon || "🔮"} ${c?.expertLabel || a.crystal}`;
      });
      setOptions(crystalOptions);

      setTimeout(() => {
        addTimelineMarker("crystal-analysis");
        addDialogue(
          "character",
          "분석이 완료되었습니다.\n어떤 관점이 가장 유효하다고 보십니까?"
        );
      }, 500);
    } catch {
      addDialogue("character", ERROR_MSG);
      setIsStreaming(false);
    }
  };

  const callDebateAPI = async (selectedCrystal: CrystalName) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyses: crystalAnalyses,
          disagreements,
          selectedCrystal,
          listenSummary,
          crystalModelMap,
          theme: "전략실",
        }),
      });

      if (!response.ok) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();

      if (data.crisis || data.debateBlocked) {
        addDialogue(
          "character",
          "이 안건은 분석보다 다른 도움이 필요해 보입니다."
        );
        setIsStreaming(false);
        return;
      }

      if (data.skipped) {
        setDebateRounds([]);
        setDebateSynthesis(data.synthesis || "");
        setStage("DISCUSS_3");
        setIsStreaming(false);
        addDialogue("character", data.synthesis || "분석 결과를 정리하겠습니다.\n\n검토 부탁드립니다.");
        return;
      }

      setDebateRounds(data.rounds || []);
      setDebateSynthesis(data.synthesis || "");
      setStage("DISCUSS_3");
      setIsStreaming(false);

      setTimeout(() => {
        const synthesisText = data.synthesis || "토론이 완료되었습니다.";
        addDialogue("character", synthesisText + "\n\n검토 부탁드립니다.");
      }, 500);
    } catch {
      addDialogue("character", ERROR_MSG);
      setIsStreaming(false);
    }
  };

  const callConcludeAPI = async () => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/conclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concern,
          listenSummary,
          analyses: crystalAnalyses,
          disagreements,
          debateRounds,
          debateSynthesis,
          userName,
          theme: "전략실",
        }),
      });

      if (!response.ok) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();
      setConclusion(data.conclusion);
      setIsStreaming(false);
    } catch {
      addDialogue("character", ERROR_MSG);
      setIsStreaming(false);
    }
  };

  const callResearchAPI = async (summary: string) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, listenSummary: summary }),
      });

      if (!response.ok) {
        addDialogue("character", "자료 조회에 실패했습니다. 기록 없이 진행합니다.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }

      const data = await response.json();

      if (data.crisis) {
        setCrisis({
          message: data.message,
          hotline: data.hotlines?.[0]?.number || "109",
        });
        setIsStreaming(false);
        return;
      }

      if (data.skipped || !data.cards || data.cards.length === 0) {
        addDialogue("character", "관련 자료가 부족합니다.\n전문가 관점로 진행하겠습니다.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }

      await callJudgeFactcheck(data.cards);

      setDataCards(data.cards);
      setIsStreaming(false);

      addDialogue("character", "관련 자료를 수집했습니다.\n어떤 데이터가 이 안건에 가장 크게 작용합니까?");
      addTimelineMarker("research-cards");
      setStage("DISCUSS_1");
    } catch {
      addDialogue("character", "자료 조회에 실패했습니다. 기록 없이 진행합니다.");
      setDataCards([]);
      setStage("CRYSTAL_SELECT");
      setIsStreaming(false);
    }
  };

  const callJudgeFactcheck = async (cards: DataCard[]) => {
    try {
      await fetch("/api/ultimate/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "factcheck", cards, concern }),
      });
    } catch {
      // Judge 실패해도 세션 중단하지 않음
    }
  };

  const callJudgeLogic = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/ultimate/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "logic",
          concern,
          listenSummary,
          analyses: crystalAnalyses,
          disagreements,
          debateRounds,
          debateSynthesis,
        }),
      });

      if (!response.ok) return true;

      const data = await response.json();
      if (!data.passed && data.issues?.length > 0) {
        addDialogue("character", `추가 확인 사항이 있습니다.\n${data.issues[0]}`);
      }
      return data.passed !== false;
    } catch {
      return true;
    }
  };

  const handleUserInput = async (text: string) => {
    addDialogue("user", text);
    setOptions([]);

    switch (stage) {
      case "ENTER":
        setConcern(text);
        setStage("LISTEN");
        {
          const newMessages = [{ role: "user", content: text }];
          setListenMessages(newMessages);
          setTurnCount(1);
          await callListenAPI(newMessages, 1);
        }
        break;

      case "LISTEN": {
        const updatedMessages = [
          ...listenMessages,
          { role: "user", content: text },
        ];
        setListenMessages(updatedMessages);
        const newTurnCount = turnCount + 1;
        setTurnCount(newTurnCount);
        await callListenAPI(updatedMessages, newTurnCount);
        break;
      }

      case "DISCUSS_1":
        setTimeout(() => {
          addDialogue("character", `확인했습니다.\n전문가 관점를 준비하겠습니다.`);
          setStage("CRYSTAL_SELECT");
        }, 800);
        break;

      case "DISCUSS_2":
        {
          const matchedCrystal = crystalAnalyses.find((a) =>
            text.includes(a.crystal)
          );
          const selectedForDebate = matchedCrystal
            ? matchedCrystal.crystal
            : crystalAnalyses[0]?.crystal;

          if (selectedForDebate) {
            addDialogue("character", "해당 관점으로 교차 분석을 진행하겠습니다.");
            setStage("DEBATE");
            await callDebateAPI(selectedForDebate);
          }
        }
        break;

      case "DISCUSS_3":
        addDialogue("character", "브리핑을 정리하겠습니다.");
        setStage("JUDGE");
        await callJudgeLogic();
        setStage("CONCLUDE");
        await callConcludeAPI();
        break;

      default:
        break;
    }
  };

  const handleOptionSelect = (option: string) => {
    handleUserInput(option);
  };

  const handleCrystalConfirm = (crystals: CrystalName[]) => {
    setSelectedCrystals(crystals);
    addDialogue("user", `${crystals.join(", ")}을 선택했습니다`);
    addDialogue("character", "전문가 관점를 가동합니다. 잠시 기다려주십시오.");
    setStage("CRYSTAL_ANALYZE");
    callAnalyzeAPI(crystals);
  };

  const handleDataCardSelect = (index: number) => {
    const card = dataCards[index];
    if (card) {
      addDialogue("character", `"${card.fact}"... 해당 데이터를 중점으로 분석하겠습니다.`);
    }
  };

  const handleCommit = (commitment: ActionCommitment) => {
    addDialogue("character", `${commitment.deadline}에 후속 브리핑을 잡겠습니다.\n${theme.labels.farewell}`);
    setStage("COMPLETE");
  };

  const getLoadingStage = (): "research" | "analyze" | "debate" | "conclude" | null => {
    if (!isStreaming) return null;
    if (stage === "RESEARCH") return "research";
    if (stage === "CRYSTAL_ANALYZE") return "analyze";
    if (stage === "DEBATE") return "debate";
    if (stage === "CONCLUDE") return "conclude";
    return null;
  };
  const loadingStage = getLoadingStage();

  const showInput = [
    "ENTER",
    "LISTEN",
    "DISCUSS_1",
    "DISCUSS_2",
    "DISCUSS_3",
  ].includes(stage);
  const showCrystals = stage === "CRYSTAL_SELECT";
  const showConclusion = stage === "CONCLUDE" && conclusion;

  return (
    <div className="min-h-screen flex flex-col relative">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      <ThemedBackground theme={theme} currentStage={stage} />

      <header className="sticky top-0 px-4 py-3 flex justify-between items-center z-20 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg hover:opacity-70 transition-opacity" aria-label="홈으로">{theme.icon}</Link>
          <span className="text-sm font-rpg text-white/60">
            {theme.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={nextTrack}
            className="rpg-button-ghost px-2 py-1.5 text-[10px] font-rpg-sm"
            aria-label="곡 변경"
          >
            {"\uD83C\uDFB5"} {trackLabel}
          </button>
          <button
            onClick={toggleBGM}
            className="rpg-button-ghost px-2 py-1.5 text-xs"
            aria-label={playing ? "음악 끄기" : "음악 켜기"}
          >
            {playing ? "\uD83D\uDD0A" : "\uD83D\uDD07"}
          </button>
        </div>
      </header>
      <div className="sticky top-[52px] z-20 backdrop-blur-md bg-black/30">
        <ProgressVisual
          currentStage={stage}
          primaryColor={theme.colors.primary}
          gameUI={theme.gameUI}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {/* 초기 타이핑 인디케이터 */}
          {showInitialTyping && stage === "ENTER" && timeline.length === 0 && (
            <GameDialogue
              character={theme.character}
              text=""
              primaryColor={theme.colors.primary}
              avatarSrc={theme.assets.avatar}
              typing
              gameUI={theme.gameUI}
            />
          )}

          {/* 타임라인: 모든 컨텐츠를 시간순 렌더링 (최신이 항상 아래) */}
          {timeline.map((item, i) => {
            switch (item.type) {
              case "dialogue":
                return item.role === "character" ? (
                  <GameDialogue
                    key={`t${i}`}
                    character={theme.character}
                    text={item.text}
                    primaryColor={theme.colors.primary}
                    avatarSrc={theme.assets.avatar}
                    gameUI={theme.gameUI}
                  />
                ) : (
                  <div key={`t${i}`} className="self-end max-w-[80%]">
                    <div className="game-user-message-strategy px-4 py-3 text-sm text-white/90 font-rpg">{item.text}</div>
                  </div>
                );
              case "research-cards":
                return dataCards.length > 0 ? (
                  <div key={`t${i}`} className="stage-enter strategy-skin-cards">
                    <DataCardList cards={dataCards} primaryColor={theme.colors.primary} onSelect={handleDataCardSelect} />
                  </div>
                ) : null;
              case "crystal-analysis":
                return crystalAnalyses.length > 0 ? (
                  <div key={`t${i}`} className="stage-enter strategy-skin-cards">
                    <CrystalAnalysisView analyses={crystalAnalyses} disagreements={disagreements} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} useExpertLabels />
                  </div>
                ) : null;
              default:
                return null;
            }
          })}

          {/* 전문가 관점 선택 (인터랙티브 — 항상 타임라인 아래) */}
          {showCrystals && (
            <div className="stage-enter strategy-skin-cards">
              <CrystalSelector max={3} crystalLabel={theme.crystalLabel} crystalShape={theme.crystalShape} primaryColor={theme.colors.primary} onConfirm={handleCrystalConfirm} useExpertLabels />
            </div>
          )}

          {/* 결론 */}
          {showConclusion && (
            <div className="stage-enter strategy-skin-cards">
              <ConclusionView conclusion={conclusion} tagline={theme.labels.tagline} farewell={theme.labels.farewell} primaryColor={theme.colors.primary} onCommit={handleCommit} />
            </div>
          )}

          {/* 스트리밍 인디케이터 */}
          {isStreaming && !loadingStage && (
            <GameDialogue character={theme.character} text="" primaryColor={theme.colors.primary} avatarSrc={theme.assets.avatar} typing gameUI={theme.gameUI} />
          )}

          {/* 로딩 오버레이 */}
          {loadingStage && (
            <div className="stage-enter strategy-skin-cards">
              <LoadingOverlay stage={loadingStage} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
            </div>
          )}

          {/* 선택지 버튼 */}
          {options.length > 0 && (
            <div className="stage-enter">
              <GameChoices
                options={options}
                onSelect={handleOptionSelect}
                primaryColor={theme.colors.primary}
                onCustomInput={() => setOptions([])}
                visible={choicesVisible}
                gameUI={theme.gameUI}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {showInput && !isStreaming && options.length === 0 && (
        <div className="relative z-10">
          <GameInput
            onSend={handleUserInput}
            placeholder="안건을 말씀해주세요..."
            gameUI={theme.gameUI}
            primaryColor={theme.colors.primary}
          />
        </div>
      )}
    </div>
  );
}
