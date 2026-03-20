"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import StageIndicator from "@/components/ultimate/StageIndicator";
import CharacterDialogue from "@/components/ultimate/CharacterDialogue";
import CrystalSelector from "@/components/ultimate/CrystalSelector";
import DataCardList from "@/components/ultimate/DataCardList";
import CrystalAnalysisView from "@/components/ultimate/CrystalAnalysisView";
import ConclusionView from "@/components/ultimate/ConclusionView";
import LoadingOverlay from "@/components/ultimate/LoadingOverlay";
import SelectionButtons from "@/components/ultimate/SelectionButtons";
import CrisisAlert from "@/components/CrisisAlert";
import ChatInput from "@/components/ChatInput";

const theme = getTheme("달빛정원");

const ERROR_MSG = "꽃봉오리가 잠시 잠들었어요... 다시 한번 이야기해줄 수 있어요?";

export default function GardenSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { playing, trackLabel, toggle: toggleBGM, nextTrack } = useBGM(theme.assets.bgmTracks);

  // 세션 상태
  const [stage, setStage] = useState<StageName>("ENTER");
  const [userName, setUserName] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<
    { role: "character" | "user"; text: string }[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [crisis, setCrisis] = useState<{
    message: string;
    hotline: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [showInitialTyping, setShowInitialTyping] = useState(true);
  const [researchAtIndex, setResearchAtIndex] = useState<number | null>(null);
  const [analysisAtIndex, setAnalysisAtIndex] = useState<number | null>(null);

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
  }, [dialogues, scrollToBottom]);

  const addDialogue = useCallback(
    (role: "character" | "user", text: string) => {
      setDialogues((prev) => [...prev, { role, text }]);
    },
    []
  );

  // 초기 입장
  useEffect(() => {
    if (stage === "ENTER" && dialogues.length === 0) {
      const t1 = setTimeout(() => {
        setShowInitialTyping(false);
        addDialogue("character", "...어서 와요.");
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
  }, [stage, dialogues.length, addDialogue]);

  // --- API 호출 함수들 ---

  const callListenAPI = async (messages: { role: string; content: string }[], turns: number) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userName, turnCount: turns, theme: "달빛정원" }),
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
            "마음이 보이기 시작해요.\n잠깐, 정원에서 찾아볼게요..."
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

      // 꽃봉오리 이름으로 선택지 표시
      const crystalOptions = analyses.map((a: CrystalAnalysis) => {
        const c = CRYSTALS.find(c => c.name === a.crystal);
        return `${c?.icon || "🌸"} ${a.crystal}의 꽃봉오리`;
      });
      setOptions(crystalOptions);

      setTimeout(() => {
        addDialogue(
          "character",
          "꽃봉오리들이 이야기를 들려줬어요.\n어떤 이야기가 가장 마음에 와닿았어요?"
        );
        setAnalysisAtIndex(dialogues.length + 1);
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
          theme: "달빛정원",
        }),
      });

      if (!response.ok) {
        addDialogue("character", ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();

      if (data.crisis || data.debateBlocked) {
        addDialogue("character", "이 마음에는 다른 종류의 돌봄이 필요해 보여요.");
        setIsStreaming(false);
        return;
      }

      if (data.skipped) {
        setDebateRounds([]);
        setDebateSynthesis(data.synthesis || "");
        setStage("DISCUSS_3");
        setIsStreaming(false);
        addDialogue("character", data.synthesis || "꽃봉오리가 정리해줬어요.\n\n어떻게 느껴져요?");
        return;
      }

      setDebateRounds(data.rounds || []);
      setDebateSynthesis(data.synthesis || "");
      setStage("DISCUSS_3");
      setIsStreaming(false);

      setTimeout(() => {
        const synthesisText = data.synthesis || "꽃봉오리들의 이야기가 끝났어요.";
        addDialogue("character", synthesisText + "\n\n어떻게 느껴져요?");
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
          theme: "달빛정원",
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
        addDialogue("character", "정원의 기록이 흐려졌어요... 그래도 괜찮아요, 계속 이야기해요.");
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
        addDialogue("character", "기록이 많지 않아요.\n꽃봉오리에게 물어볼게요.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }

      await callJudgeFactcheck(data.cards);

      setDataCards(data.cards);
      setIsStreaming(false);

      addDialogue("character", "정원에서 비슷한 이야기를 찾았어요.\n어떤 이야기가 가장 마음에 걸려요?");
      setResearchAtIndex(dialogues.length + 1);
      setStage("DISCUSS_1");
    } catch {
      addDialogue("character", "정원의 기록이 흐려졌어요... 그래도 괜찮아요.");
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
        addDialogue("character", `하나만 더 이야기해도 될까요?\n${data.issues[0]}`);
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
          addDialogue("character", `그 마음이 이해돼요.\n꽃봉오리를 보여줄게요.`);
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
            addDialogue("character", "꽃봉오리들끼리 이야기를 나눠볼게요.");
            setStage("DEBATE");
            await callDebateAPI(selectedForDebate);
          }
        }
        break;

      case "DISCUSS_3":
        addDialogue("character", "오늘 나눈 이야기를 정리해볼게요.");
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
    addDialogue("user", `${crystals.join(", ")}을 선택했어요`);
    addDialogue("character", "꽃봉오리가 피어나고 있어요. 잠깐만 기다려줘요.");
    setStage("CRYSTAL_ANALYZE");
    callAnalyzeAPI(crystals);
  };

  const handleDataCardSelect = (index: number) => {
    const card = dataCards[index];
    if (card) {
      addDialogue("character", `"${card.fact}"... 그게 마음에 걸리는 거군요.`);
    }
  };

  const handleCommit = (commitment: ActionCommitment) => {
    addDialogue("character", `${commitment.deadline}에 다시 만나요.\n${theme.labels.farewell}`);
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
  const showAnalysis =
    stage === "DISCUSS_2" || stage === "DEBATE" || stage === "DISCUSS_3";
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

      <ThemedBackground theme={theme} />

      <header className="sticky top-0 px-4 py-3 flex justify-between items-center z-20 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-2">
          <a href="/" className="text-lg hover:opacity-70 transition-opacity" aria-label="홈으로">{theme.icon}</a>
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
        <StageIndicator
          currentStage={stage}
          primaryColor={theme.colors.primary}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {/* 초기 타이핑 인디케이터 */}
          {showInitialTyping && stage === "ENTER" && dialogues.length === 0 && (
            <CharacterDialogue
              character={theme.character}
              text=""
              primaryColor={theme.colors.primary}
              avatarSrc={theme.assets.avatar}
              typing
            />
          )}

          {/* 타임라인: 대화 → 리서치카드 → 대화 → 분석 → 대화 순서로 렌더링 */}
          {(() => {
            const splitR = researchAtIndex ?? dialogues.length;
            const splitA = analysisAtIndex ?? dialogues.length;
            const renderDialogue = (d: { role: "character" | "user"; text: string }, i: number) =>
              d.role === "character" ? (
                <CharacterDialogue key={`d${i}`} character={theme.character} text={d.text} primaryColor={theme.colors.primary} avatarSrc={theme.assets.avatar} />
              ) : (
                <div key={`d${i}`} className="self-end max-w-[80%]">
                  <div className="rpg-panel-light rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white/90 font-rpg">{d.text}</div>
                </div>
              );

            return (
              <>
                {/* 리서치 전 대화 */}
                {dialogues.slice(0, splitR).map(renderDialogue)}

                {/* 데이터 카드 */}
                {dataCards.length > 0 && researchAtIndex !== null && (
                  <div className="stage-enter">
                    <DataCardList cards={dataCards} primaryColor={theme.colors.primary} onSelect={handleDataCardSelect} />
                  </div>
                )}

                {/* 리서치 후 ~ 분석 전 대화 */}
                {dialogues.slice(splitR, splitA).map(renderDialogue)}

                {/* 꽃봉오리 선택 */}
                {showCrystals && (
                  <div className="stage-enter">
                    <CrystalSelector max={3} crystalLabel={theme.crystalLabel} crystalShape={theme.crystalShape} primaryColor={theme.colors.primary} onConfirm={handleCrystalConfirm} />
                  </div>
                )}

                {/* 꽃봉오리 분석 결과 */}
                {showAnalysis && crystalAnalyses.length > 0 && (
                  <div className="stage-enter">
                    <CrystalAnalysisView analyses={crystalAnalyses} disagreements={disagreements} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} />
                  </div>
                )}

                {/* 분석 후 대화 */}
                {dialogues.slice(splitA).map(renderDialogue)}

                {/* 결론 */}
                {showConclusion && (
                  <div className="stage-enter">
                    <ConclusionView conclusion={conclusion} tagline={theme.labels.tagline} farewell={theme.labels.farewell} primaryColor={theme.colors.primary} onCommit={handleCommit} />
                  </div>
                )}
              </>
            );
          })()}

          {/* 스트리밍 인디케이터 */}
          {isStreaming && !loadingStage && (
            <CharacterDialogue character={theme.character} text="" primaryColor={theme.colors.primary} avatarSrc={theme.assets.avatar} typing />
          )}

          {/* 로딩 오버레이 */}
          {loadingStage && (
            <div className="stage-enter">
              <LoadingOverlay stage={loadingStage} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
            </div>
          )}

          {/* 선택지 버튼 */}
          {options.length > 0 && !isStreaming && (
            <div className="stage-enter">
              <SelectionButtons options={options} onSelect={handleOptionSelect} primaryColor={theme.colors.primary} onCustomInput={() => setOptions([])} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {showInput && !isStreaming && options.length === 0 && (
        <div className="relative z-10">
          <ChatInput
            onSend={handleUserInput}
            dark
            placeholder="마음을 이야기해보세요..."
          />
        </div>
      )}
    </div>
  );
}
