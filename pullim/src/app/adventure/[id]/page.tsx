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

const theme = getTheme("모험가");

const SAGE_ERROR_MSG = "구슬이 흐려졌군... 잠시 후 다시 시도해보게.";

export default function AdventureSessionPage() {
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

  // 캐릭터 대사 추가
  const addDialogue = useCallback(
    (role: "character" | "user", text: string) => {
      setDialogues((prev) => [...prev, { role, text }]);
    },
    []
  );

  // 초기 입장 — Strict Mode 대응: cleanup으로 setTimeout 해제
  useEffect(() => {
    if (stage === "ENTER" && dialogues.length === 0) {
      const t1 = setTimeout(() => {
        setShowInitialTyping(false);
        addDialogue("character", "...왔군.");
      }, 1000);
      const t2 = setTimeout(
        () =>
          addDialogue(
            "character",
            theme.labels.enter + "\n무엇이 자네를 여기까지 데려왔는가?"
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

  // Listen API (SSE)
  const callListenAPI = async (messages: { role: string; content: string }[], turns: number) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userName, turnCount: turns, theme: "모험가" }),
      });

      if (!response.ok) {
        addDialogue("character", SAGE_ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        addDialogue("character", SAGE_ERROR_MSG);
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

      // [OPTIONS] 태그에서 선택지 추출
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

      // 태그 제거 후 표시
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
            "대강 그림이 그려지는군.\n잠시 두루마리를 펼쳐보겠네..."
          );
          setStage("RESEARCH");
          callResearchAPI(newSummary);
        }, 1500);
      }
    } catch {
      addDialogue("character", SAGE_ERROR_MSG);
      setIsStreaming(false);
    }
  };

  // Analyze API
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
        addDialogue("character", SAGE_ERROR_MSG);
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

      // 구슬 이름을 선택지 버튼으로 표시 (텍스트 타이핑 불필요)
      const crystalOptions = analyses.map((a: CrystalAnalysis) => {
        const icon = CRYSTALS.find(c => c.name === a.crystal)?.icon || "🔮";
        return `${icon} ${a.crystal}`;
      });
      setOptions(crystalOptions);

      setTimeout(() => {
        addDialogue(
          "character",
          "세 구슬의 이야기를 들었네.\n어떤 구슬의 말이 가장 가슴에 와닿았는가?"
        );
        setAnalysisAtIndex(dialogues.length + 1);
      }, 500);
    } catch {
      addDialogue("character", SAGE_ERROR_MSG);
      setIsStreaming(false);
    }
  };

  // Debate API
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
          theme: "모험가",
        }),
      });

      if (!response.ok) {
        addDialogue("character", SAGE_ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();

      if (data.crisis || data.debateBlocked) {
        addDialogue(
          "character",
          "이 고민은 토론보다 다른 도움이 필요해 보이는군."
        );
        setIsStreaming(false);
        return;
      }

      if (data.skipped) {
        setDebateRounds([]);
        setDebateSynthesis(data.synthesis || "");
        setStage("DISCUSS_3");
        setIsStreaming(false);
        addDialogue("character", data.synthesis || "구슬 분석 결과로 정리하겠네.\n\n어떤가?");
        return;
      }

      setDebateRounds(data.rounds || []);
      setDebateSynthesis(data.synthesis || "");
      setStage("DISCUSS_3");
      setIsStreaming(false);

      setTimeout(() => {
        const synthesisText = data.synthesis || "구슬들의 토론이 끝났네.";
        addDialogue("character", synthesisText + "\n\n어떤가?");
      }, 500);
    } catch {
      addDialogue("character", SAGE_ERROR_MSG);
      setIsStreaming(false);
    }
  };

  // Conclude API
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
          theme: "모험가",
        }),
      });

      if (!response.ok) {
        addDialogue("character", SAGE_ERROR_MSG);
        setIsStreaming(false);
        return;
      }

      const data = await response.json();
      setConclusion(data.conclusion);
      setIsStreaming(false);
    } catch {
      addDialogue("character", SAGE_ERROR_MSG);
      setIsStreaming(false);
    }
  };

  // Research API (Perplexity)
  const callResearchAPI = async (summary: string) => {
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ultimate/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, listenSummary: summary }),
      });

      if (!response.ok) {
        addDialogue(
          "character",
          "두루마리가 흐려졌군... 기록 없이 진행하겠네."
        );
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
        addDialogue(
          "character",
          "두루마리가 흐려졌군... 기록 없이 진행하겠네.\n이제 수정구슬을 보여주겠네."
        );
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }

      await callJudgeFactcheck(data.cards);

      setDataCards(data.cards);
      setIsStreaming(false);

      addDialogue(
        "character",
        "세상의 기록을 살펴보았네.\n이 중, 자네에게 가장 무겁게 느껴지는 것은?"
      );
      setResearchAtIndex(dialogues.length + 1);
      setStage("DISCUSS_1");
    } catch {
      addDialogue(
        "character",
        "두루마리가 흐려졌군... 기록 없이 진행하겠네."
      );
      setDataCards([]);
      setStage("CRYSTAL_SELECT");
      setIsStreaming(false);
    }
  };

  // Judge API — 팩트체크
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

  // Judge API — 논리 검증
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
        addDialogue(
          "character",
          `한 가지 더 짚어주겠네.\n${data.issues[0]}`
        );
      }
      return data.passed !== false;
    } catch {
      return true;
    }
  };

  // 사용자 입력 처리
  const handleUserInput = async (text: string) => {
    addDialogue("user", text);
    setOptions([]); // 선택지 클리어

    switch (stage) {
      case "ENTER":
        // 이름 입력 없이 바로 고민 시작
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
          addDialogue(
            "character",
            `${text}... 알겠네.\n이제 수정구슬을 보여줄 차례일세.`
          );
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
            addDialogue(
              "character",
              "좋아. 그럼 구슬들끼리 이야기를 나눠보게 하지."
            );
            setStage("DEBATE");
            await callDebateAPI(selectedForDebate);
          }
        }
        break;

      case "DISCUSS_3":
        addDialogue(
          "character",
          "오늘 자네의 이야기를 들여다보았네."
        );
        setStage("JUDGE");
        await callJudgeLogic();
        setStage("CONCLUDE");
        await callConcludeAPI();
        break;

      default:
        break;
    }
  };

  // 선택지 선택 처리
  const handleOptionSelect = (option: string) => {
    handleUserInput(option);
  };

  // 구슬 선택 확인
  const handleCrystalConfirm = (crystals: CrystalName[]) => {
    setSelectedCrystals(crystals);
    addDialogue("user", `${crystals.join(", ")}을 선택했습니다`);
    const crystalDef = crystals.map((name) => {
      const c: Record<string, string> = {
        금화: "\uD83D\uDCB0",
        나침반: "\uD83E\uDDED",
        거울: "\uD83C\uDFAF",
        저울: "\u2696\uFE0F",
        모닥불: "\uD83D\uDD25",
        타인: "\uD83E\uDE9E",
        심연: "\uD83E\uDDE0",
        전략: "\uD83D\uDCCA",
        뒤집기: "\uD83E\uDD14",
        몸: "\uD83C\uDFC3",
      };
      return c[name] || "\uD83D\uDD2E";
    });
    addDialogue(
      "character",
      `${crystalDef.join(", ")}... 흥미로운 조합이군.\n구슬이 비추고 있네. 잠시 기다리게.`
    );
    setStage("CRYSTAL_ANALYZE");
    callAnalyzeAPI(crystals);
  };

  // 데이터 카드 선택
  const handleDataCardSelect = (index: number) => {
    const card = dataCards[index];
    if (card) {
      addDialogue(
        "character",
        `"${card.fact}"... 그것이 가장 무겁군.\n왜 그것이 마음에 걸리는가?`
      );
    }
  };

  const handleCommit = (commitment: ActionCommitment) => {
    addDialogue(
      "character",
      `그래, ${commitment.deadline}에 다시 보지.\n${theme.labels.farewell}`
    );
    setStage("COMPLETE");
  };

  // 로딩 오버레이 stage 매핑
  const getLoadingStage = (): "research" | "analyze" | "debate" | "conclude" | null => {
    if (!isStreaming) return null;
    if (stage === "RESEARCH") return "research";
    if (stage === "CRYSTAL_ANALYZE") return "analyze";
    if (stage === "DEBATE") return "debate";
    if (stage === "CONCLUDE") return "conclude";
    return null;
  };
  const loadingStage = getLoadingStage();

  // 현재 단계에서 보여줄 UI 결정
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

      {/* Header -- RPG 스타일 */}
      <header className="sticky top-0 px-4 py-3 flex justify-between items-center z-20 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-2">
          <a href="/" className="text-lg hover:opacity-70 transition-opacity" aria-label="홈으로">{theme.icon}</a>
          <span className="text-sm font-rpg text-white/60">
            {theme.title}
          </span>
        </div>
        {/* BGM 컨트롤 */}
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

      {/* Content */}
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

                {/* 구슬 선택 */}
                {showCrystals && (
                  <div className="stage-enter">
                    <CrystalSelector max={3} crystalLabel={theme.crystalLabel} crystalShape={theme.crystalShape} primaryColor={theme.colors.primary} onConfirm={handleCrystalConfirm} />
                  </div>
                )}

                {/* 구슬 분석 결과 */}
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

      {/* Input -- 다크 RPG 테마 */}
      {showInput && !isStreaming && options.length === 0 && (
        <div className="relative z-10">
          <ChatInput
            onSend={handleUserInput}
            dark
            placeholder="고민을 이야기해보세요..."
          />
        </div>
      )}
    </div>
  );
}
