"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import Link from "next/link";
import LadderSessionPage from "@/components/session/LadderSessionPage";

const theme = getTheme("전략실");

// 새 에셋 (themes/index.ts 수정 금지이므로 여기서 오버라이드)
const AVATAR_SRC = "/assets/strategy-cat.png";
const STAGE_BACKGROUNDS: Partial<Record<string, string>> = {
  ENTER: "/assets/strategy-bg.png",
  LISTEN: "/assets/strategy-bg.png",
  RESEARCH: "/assets/strategy-office-bg.png",
  VERIFY: "/assets/strategy-office-bg.png",
  DISCUSS_1: "/assets/strategy-office-bg.png",
  CRYSTAL_SELECT: "/assets/strategy-office-bg.png",
  CRYSTAL_ANALYZE: "/assets/strategy-office-bg.png",
  DISCUSS_2: "/assets/strategy-office-bg.png",
  DEBATE: "/assets/strategy-office-bg.png",
  DISCUSS_3: "/assets/strategy-office-bg.png",
  JUDGE: "/assets/strategy-office-bg.png",
  CONCLUDE: "/assets/strategy-bg.png",
  COMPLETE: "/assets/strategy-bg.png",
};

const ERROR_MSG =
  "시스템 접속이 일시 중단되었습니다. 다시 시도해주세요.";
const FREE_INPUT_LABEL = "직접 입력";

const DEFAULT_CHOICES: Partial<Record<string, string[]>> = {
  ENTER: ["커리어 고민입니다", "의사결정이 필요합니다", FREE_INPUT_LABEL],
  LISTEN_FALLBACK: ["추가 정보가 있습니다", "이게 전부입니다", FREE_INPUT_LABEL],
  DISCUSS_1: ["유효한 데이터입니다", "보완이 필요합니다", FREE_INPUT_LABEL],
  DISCUSS_3: ["분석이 적절합니다", "재검토가 필요합니다"],
};

// ─── 씬 기록 (이전 답변 탐색용) ───
interface SceneRecord {
  characterText: string;
  userInput?: string;
}

interface CurrentScene {
  characterText: string;
  userLastInput?: string;
}

export default function StrategySessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const searchParams = useSearchParams();

  if (searchParams.get("mode") === "ladder") {
    return <LadderSessionPage theme="전략실" bgImage="/assets/strategy-bg.png" />;
  }

  const isGameMode = searchParams.get("mode") !== "chat";
  const activeGameUI = isGameMode ? theme.gameUI : undefined;
  const {
    playing,
    trackLabel,
    toggle: toggleBGM,
    nextTrack,
  } = useBGM(theme.assets.bgmTracks);

  // ─── 씬 상태 ───
  const [stage, setStage] = useState<StageName>("ENTER");
  const [userName, setUserName] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<CurrentScene>({
    characterText: "",
  });
  const currentSceneRef = useRef<CurrentScene>({ characterText: "" });

  // 씬 히스토리 (◀ ▶ 탐색용)
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [viewIndex, setViewIndex] = useState(-1); // -1 = 현재(라이브) 씬

  const [isStreaming, setIsStreaming] = useState(false);
  const [crisis, setCrisis] = useState<{
    message: string;
    hotline: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [showFreeInput, setShowFreeInput] = useState(false);
  const [enterPhase, setEnterPhase] = useState(0);

  // ─── 파이프라인 데이터 (변경 없음) ───
  const [concern, setConcern] = useState("");
  const [listenSummary, setListenSummary] = useState("");
  const [listenMessages, setListenMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [turnCount, setTurnCount] = useState(0);
  const [dataCards, setDataCards] = useState<DataCard[]>([]);
  const [factcheckResult, setFactcheckResult] = useState<{
    confidence: "high" | "medium" | "low";
    issues: string[];
    passed: boolean;
  } | null>(null);
  const [userResearchOpinion, setUserResearchOpinion] = useState("");
  const [crystalAnalyses, setCrystalAnalyses] = useState<CrystalAnalysis[]>([]);
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [debateRounds, setDebateRounds] = useState<DebateRound[]>([]);
  const [debateSynthesis, setDebateSynthesis] = useState("");
  const [crystalModelMap, setCrystalModelMap] = useState<
    Partial<Record<CrystalName, ModelProvider>>
  >({});
  const [selectedCrystals, setSelectedCrystals] = useState<CrystalName[]>([]);
  const [conclusion, setConclusion] = useState<ConclusionData | null>(null);

  // ─── 씬 전환 헬퍼 ───

  const setScene = useCallback((characterText: string) => {
    const scene: CurrentScene = { characterText };
    currentSceneRef.current = scene;
    setCurrentScene(scene);
  }, []);

  const advanceScene = useCallback((characterText: string) => {
    const prev = currentSceneRef.current;
    if (prev.characterText) {
      setScenes((s) => [...s, { characterText: prev.characterText }]);
    }
    const scene: CurrentScene = { characterText };
    currentSceneRef.current = scene;
    setCurrentScene(scene);
    setViewIndex(-1);
  }, []);

  // ─── 씬 내비게이션 ───
  const isViewingPast = viewIndex >= 0;
  const canGoBack = isViewingPast ? viewIndex > 0 : scenes.length > 0;
  const canGoForward = isViewingPast;
  const totalScenes = scenes.length + (currentScene.characterText ? 1 : 0);
  const currentPageNum = isViewingPast ? viewIndex + 1 : totalScenes;

  const displayText = isViewingPast
    ? scenes[viewIndex]?.characterText || ""
    : currentScene.characterText;

  const displayUserInput = isViewingPast
    ? scenes[viewIndex]?.userInput
    : undefined;

  const goBack = useCallback(() => {
    if (viewIndex === -1 && scenes.length > 0) {
      setViewIndex(scenes.length - 1);
    } else if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
    }
  }, [viewIndex, scenes.length]);

  const goForward = useCallback(() => {
    if (viewIndex >= 0 && viewIndex < scenes.length - 1) {
      setViewIndex(viewIndex + 1);
    } else {
      setViewIndex(-1);
    }
  }, [viewIndex, scenes.length]);

  // ─── 컨텐츠 표시 조건 ───
  const showDataCards =
    !isViewingPast && stage === "DISCUSS_1" && dataCards.length > 0;
  const showCrystalAnalysis =
    !isViewingPast && stage === "DISCUSS_2" && crystalAnalyses.length > 0;
  const showCrystals = !isViewingPast && stage === "CRYSTAL_SELECT";
  const showConclusion = !isViewingPast && stage === "CONCLUDE" && conclusion;
  const choicesVisible =
    !isViewingPast && !isStreaming && options.length > 0 && !showFreeInput;

  const getLoadingStage = ():
    | "research"
    | "analyze"
    | "debate"
    | "conclude"
    | null => {
    if (!isStreaming || isViewingPast) return null;
    if (stage === "RESEARCH") return "research";
    if (stage === "CRYSTAL_ANALYZE") return "analyze";
    if (stage === "DEBATE") return "debate";
    if (stage === "CONCLUDE") return "conclude";
    return null;
  };
  const loadingStage = getLoadingStage();

  const showDialogue =
    displayText ||
    (!isViewingPast && stage === "ENTER" && enterPhase === 0) ||
    (!isViewingPast && isStreaming && !loadingStage);

  const isDialogueTyping =
    !isViewingPast &&
    ((stage === "ENTER" && enterPhase === 0) ||
      (isStreaming && !loadingStage));

  // 특수 컨텐츠가 없을 때만 캐릭터 초상화 표시
  const showPortrait =
    !showDataCards &&
    !showCrystalAnalysis &&
    !showCrystals &&
    !showConclusion &&
    !loadingStage;

  // ─── ENTER 페이즈 ───
  useEffect(() => {
    if (stage === "ENTER" && enterPhase === 0) {
      const t = setTimeout(() => {
        setEnterPhase(1);
        setScene("...접속 완료.");
      }, 1000);
      return () => clearTimeout(t);
    }
    if (!activeGameUI && stage === "ENTER" && enterPhase === 1) {
      const t = setTimeout(() => {
        setEnterPhase(2);
        setScene(theme.labels.enter + "\n" + theme.labels.askConcern);
      }, 1500);
      return () => clearTimeout(t);
    }
    if (!activeGameUI && stage === "ENTER" && enterPhase === 2) {
      const t = setTimeout(() => {
        setOptions(DEFAULT_CHOICES.ENTER || []);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [stage, enterPhase, setScene, activeGameUI]);

  const handleTypingComplete = useCallback(() => {
    if (stage === "ENTER" && enterPhase === 1) {
      setTimeout(() => {
        setEnterPhase(2);
        setScene(theme.labels.enter + "\n" + theme.labels.askConcern);
      }, 800);
    } else if (stage === "ENTER" && enterPhase === 2) {
      setOptions(DEFAULT_CHOICES.ENTER || []);
    }
  }, [stage, enterPhase, setScene]);

  // ─── API 호출 (로직 동일) ───

  const callListenAPI = async (
    messages: { role: string; content: string }[],
    turns: number,
    currentConcern?: string
  ) => {
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          userName,
          turnCount: turns,
          theme: "전략실",
        }),
      });
      if (!response.ok) {
        setScene(ERROR_MSG);
        setIsStreaming(false);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        setScene(ERROR_MSG);
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
        for (const line of chunk.split("\n")) {
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
            if (parsed.text) fullText += parsed.text;
            if (parsed.listenSummary) {
              newSummary = parsed.listenSummary;
              setListenSummary(parsed.listenSummary);
            }
            if (parsed.recommendedCrystals) void parsed.recommendedCrystals;
            if (parsed.listenComplete) listenComplete = true;
          } catch {
            /* ignore */
          }
        }
      }

      const optionsMatch = fullText.match(
        /\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/
      );
      if (optionsMatch) {
        const apiOptions = optionsMatch[1]
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        setOptions([...apiOptions, FREE_INPUT_LABEL]);
      } else {
        setOptions(DEFAULT_CHOICES.LISTEN_FALLBACK || []);
      }

      const displayText = fullText
        .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "")
        .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/, "")
        .replace(/\[CRYSTALS\][\s\S]*?\[\/CRYSTALS\]/, "")
        .replace(/\[LISTEN_COMPLETE\]/, "")
        .trim();
      if (displayText) setScene(displayText);
      setIsStreaming(false);

      if (listenComplete && newSummary) {
        const concernForResearch = currentConcern || concern;
        setTimeout(() => {
          advanceScene(
            "분석 패턴이 감지되었습니다.\n데이터베이스를 검색합니다..."
          );
          setOptions([]);
          setStage("RESEARCH");
          callResearchAPI(newSummary, concernForResearch);
        }, 1500);
      }
    } catch {
      setScene(ERROR_MSG);
      setIsStreaming(false);
    }
  };

  const callResearchAPI = async (summary: string, currentConcern?: string) => {
    const effectiveConcern = currentConcern || concern;
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern: effectiveConcern, listenSummary: summary }),
      });
      if (!response.ok) {
        advanceScene("데이터 접근에 실패했습니다. 계속 진행합니다.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }
      const data = await response.json();
      if (data.crisis) {
        setCrisis({ message: data.message, hotline: data.hotlines?.[0]?.number || "109" });
        setIsStreaming(false);
        return;
      }
      if (data.skipped || !data.cards || data.cards.length === 0) {
        advanceScene("관련 데이터가 제한적입니다.\n전문가에게 직접 분석을 요청합니다.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }
      const fcResult = await callJudgeFactcheck(data.cards, effectiveConcern);
      setDataCards(data.cards);
      setIsStreaming(false);
      const discuss1Text = fcResult && !fcResult.passed && fcResult.issues.length > 0
        ? "데이터 검증 중 주의사항이 발견되었습니다.\n어떻게 판단하십니까?"
        : "데이터 검증을 완료했습니다.\n어떻게 판단하십니까?";
      advanceScene(discuss1Text);
      setStage("DISCUSS_1");
      setOptions(DEFAULT_CHOICES.DISCUSS_1 || []);
    } catch {
      advanceScene("데이터 접근에 실패했습니다.");
      setDataCards([]);
      setStage("CRYSTAL_SELECT");
      setIsStreaming(false);
    }
  };

  const callJudgeFactcheck = async (cards: DataCard[], currentConcern?: string) => {
    const effectiveConcern = currentConcern || concern;
    try {
      const res = await fetch("/api/ultimate/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "factcheck", cards, concern: effectiveConcern }),
      });
      if (res.ok) {
        const data = await res.json();
        setFactcheckResult(data);
        return data as { confidence: string; issues: string[]; passed: boolean };
      }
    } catch { /* ignore */ }
    return null;
  };

  const callAnalyzeAPI = async (crystals: CrystalName[]) => {
    setIsStreaming(true);
    const enrichedSummary = userResearchOpinion
      ? `${listenSummary}\n\n[리서치 후 사용자 의견]\n${userResearchOpinion}`
      : listenSummary;
    try {
      const response = await fetch("/api/ultimate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, selectedCrystals: crystals, listenSummary: enrichedSummary, concern }),
      });
      if (!response.ok) { setScene(ERROR_MSG); setIsStreaming(false); return; }
      const data = await response.json();
      if (data.crisis) { setCrisis({ message: data.message, hotline: data.hotlines?.[0]?.number || "109" }); setIsStreaming(false); return; }
      const analyses = data.analyses || [];
      setCrystalAnalyses(analyses);
      setDisagreements(data.disagreements || []);
      setCrystalModelMap(data.crystalModelMap || {});
      setIsStreaming(false);
      const crystalOptions = analyses.map((a: CrystalAnalysis) => {
        const c = CRYSTALS.find((cr) => cr.name === a.crystal);
        return `${c?.icon || "🌸"} ${a.crystal}의 분석 관점`;
      });
      setOptions(crystalOptions);
      setStage("DISCUSS_2");
      advanceScene("전문가 분석이 완료되었습니다.\n어떤 관점이 가장 유효하다고 판단하십니까?");
    } catch { setScene(ERROR_MSG); setIsStreaming(false); }
  };

  const callDebateAPI = async (selectedCrystal: CrystalName) => {
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses: crystalAnalyses, disagreements, selectedCrystal, listenSummary, crystalModelMap, theme: "전략실" }),
      });
      if (!response.ok) { setScene(ERROR_MSG); setIsStreaming(false); return; }
      const data = await response.json();
      if (data.crisis || data.debateBlocked) { advanceScene("이 안건은 다른 접근이 필요해 보입니다."); setIsStreaming(false); return; }
      if (data.skipped) {
        setDebateRounds([]); setDebateSynthesis(data.synthesis || ""); setStage("DISCUSS_3"); setIsStreaming(false);
        advanceScene(data.synthesis || "분석이 완료되었습니다.\n\n어떻게 느껴져요?");
        setOptions(DEFAULT_CHOICES.DISCUSS_3 || []); return;
      }
      setDebateRounds(data.rounds || []); setDebateSynthesis(data.synthesis || ""); setStage("DISCUSS_3"); setIsStreaming(false);
      advanceScene((data.synthesis || "전문가 검토가 완료되었습니다.") + "\n\n어떻게 느껴져요?");
      setOptions(DEFAULT_CHOICES.DISCUSS_3 || []);
    } catch { setScene(ERROR_MSG); setIsStreaming(false); }
  };

  const callConcludeAPI = async () => {
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/conclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, listenSummary, analyses: crystalAnalyses, disagreements, debateRounds, debateSynthesis, userName, theme: "전략실" }),
      });
      if (!response.ok) { setScene(ERROR_MSG); setIsStreaming(false); return; }
      const data = await response.json();
      setConclusion(data.conclusion);
      setIsStreaming(false);
    } catch { setScene(ERROR_MSG); setIsStreaming(false); }
  };

  const callJudgeLogic = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/ultimate/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "logic", concern, listenSummary, analyses: crystalAnalyses, disagreements, debateRounds, debateSynthesis }),
      });
      if (!response.ok) return true;
      const data = await response.json();
      if (!data.passed && data.issues?.length > 0) advanceScene(`추가 확인 사항이 있습니다.\n${data.issues[0]}`);
      return data.passed !== false;
    } catch { return true; }
  };

  // ─── 사용자 입력 처리 ───

  const handleUserInput = async (text: string) => {
    const prev = currentSceneRef.current;
    if (prev.characterText) {
      setScenes((s) => [
        ...s,
        { characterText: prev.characterText, userInput: text },
      ]);
    }
    const emptyScene: CurrentScene = { characterText: "", userLastInput: text };
    currentSceneRef.current = emptyScene;
    setCurrentScene(emptyScene);
    setOptions([]);
    setShowFreeInput(false);
    setViewIndex(-1);

    switch (stage) {
      case "ENTER":
        setConcern(text);
        setStage("LISTEN");
        { const m = [{ role: "user", content: text }]; setListenMessages(m); setTurnCount(1); await callListenAPI(m, 1, text); }
        break;
      case "LISTEN": {
        const m = [...listenMessages, { role: "user", content: text }];
        setListenMessages(m);
        const tc = turnCount + 1; setTurnCount(tc);
        await callListenAPI(m, tc);
        break;
      }
      case "DISCUSS_1":
        setUserResearchOpinion(text);
        setTimeout(() => { setScene("해당 포인트를 파악했습니다.\n전문가 관점을 준비합니다."); setStage("CRYSTAL_SELECT"); }, 800);
        break;
      case "DISCUSS_2": {
        const mc = crystalAnalyses.find((a) => text.includes(a.crystal));
        const sel = mc ? mc.crystal : crystalAnalyses[0]?.crystal;
        if (sel) {
          if (disagreements.length === 0) {
            setScene("전문가들의 의견이 일치합니다.\n방향이 명확해지고 있습니다.");
            setStage("DISCUSS_3");
            setOptions(["확신이 생겼습니다", "다른 관점도 검토하고 싶습니다", "아직 판단이 어렵습니다"]);
          } else {
            const intro = disagreements.length >= 3
              ? "전문가 간 의견 차이가 다수 발견되었습니다.\n심층 교차 검증을 진행합니다."
              : "전문가 간 교차 검증을 시작합니다.";
            setScene(intro);
            await new Promise(r => setTimeout(r, 1000));
            setStage("DEBATE"); await callDebateAPI(sel);
          }
        }
        break;
      }
      case "DISCUSS_3": {
        setScene("브리핑을 정리합니다.");
        await new Promise(r => setTimeout(r, 1000));
        const judgePassed = await callJudgeLogic();
        if (!judgePassed) {
          setStage("DISCUSS_3");
          setOptions(DEFAULT_CHOICES.DISCUSS_3 || []);
          break;
        }
        setStage("CONCLUDE"); await callConcludeAPI();
        break;
      }
      default: break;
    }
  };

  const handleOptionSelect = (option: string) => {
    if (option === FREE_INPUT_LABEL) { setShowFreeInput(true); return; }
    handleUserInput(option);
  };

  const handleFreeInputSend = (text: string) => { setShowFreeInput(false); handleUserInput(text); };
  const handleFreeInputCollapse = () => { setShowFreeInput(false); };

  const handleCrystalConfirm = (crystals: CrystalName[]) => {
    setSelectedCrystals(crystals);
    if (currentSceneRef.current.characterText) {
      setScenes((s) => [...s, { characterText: currentSceneRef.current.characterText, userInput: `${crystals.join(", ")} 선택` }]);
    }
    setScene("전문가 분석을 실행 중입니다. 잠시 대기해주세요.");
    setStage("CRYSTAL_ANALYZE");
    callAnalyzeAPI(crystals);
  };

  const handleDataCardSelect = (index: number) => {
    const card = dataCards[index];
    if (card) setScene(`"${card.fact}"... 해당 포인트를 기록했습니다.`);
  };

  const handleCommit = (commitment: ActionCommitment) => {
    advanceScene(`${commitment.deadline}에 다시 만나요.\n${theme.labels.farewell}`);
    setStage("COMPLETE");
  };

  // ─── 렌더링 ───

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden overflow-y-auto w-full max-w-[100vw]">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      <ThemedBackground theme={theme} currentStage={stage} />

      {/* 씬 배경 일러스트 + 그라디언트 (게임 모드만) */}
      {isGameMode && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STAGE_BACKGROUNDS[stage] || "/assets/strategy-bg.png"}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ zIndex: 2, opacity: 0.85, transition: "opacity 0.8s ease" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "70%",
              background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
              zIndex: 5,
            }}
          />
        </>
      )}

      {/* 캐릭터 초상화 — 배경 씬 위에 표시 */}
      {isGameMode && showPortrait && AVATAR_SRC && (
        <div
          className="absolute inset-x-0 flex justify-center pointer-events-none transition-opacity duration-500"
          style={{ top: "22%", zIndex: 6, opacity: isViewingPast ? 0.4 : 0.75 }}
        >
          <div
            className="w-24 h-24 sm:w-36 sm:h-36 rounded-3xl overflow-hidden"
            style={{
              boxShadow: `0 4px 30px ${theme.colors.primary}20`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AVATAR_SRC}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="sticky top-0 px-4 py-3 flex justify-between items-center z-20 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg hover:opacity-70 transition-opacity" aria-label="홈으로">
            {theme.icon}
          </Link>
          <span className="text-sm font-rpg text-white/60">{theme.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={nextTrack} className="rpg-button-ghost px-2 py-1.5 text-[10px] font-rpg-sm" aria-label="곡 변경">
            🎵 {trackLabel}
          </button>
          <button onClick={toggleBGM} className="rpg-button-ghost px-2 py-1.5 text-xs" aria-label={playing ? "음악 끄기" : "음악 켜기"}>
            {playing ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {/* 진행 표시 */}
      <div className="sticky top-[52px] z-20 backdrop-blur-md bg-black/30">
        <ProgressVisual currentStage={stage} primaryColor={theme.colors.primary} gameUI={activeGameUI} progressStyle={theme.gameUI?.progressStyle} />
      </div>

      {/* 메인 씬 영역 */}
      <main className="flex-1 flex flex-col justify-end px-3 sm:px-4 pb-4 pt-8 relative z-10 min-h-0">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-3 sm:gap-4">

          {/* 스테이지별 특수 컨텐츠 (현재 씬에서만) */}
          {showDataCards && (
            <div className="stage-enter garden-skin-cards">
              <DataCardList cards={dataCards} primaryColor={theme.colors.primary} onSelect={handleDataCardSelect} factcheckResult={factcheckResult} />
            </div>
          )}
          {showCrystalAnalysis && (
            <div className="stage-enter garden-skin-cards">
              <CrystalAnalysisView analyses={crystalAnalyses} disagreements={disagreements} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} />
            </div>
          )}
          {showCrystals && (
            <div className="stage-enter garden-skin-cards">
              <CrystalSelector max={3} crystalLabel={theme.crystalLabel} crystalShape={theme.crystalShape} primaryColor={theme.colors.primary} onConfirm={handleCrystalConfirm} />
            </div>
          )}
          {showConclusion && (
            <div className="stage-enter garden-skin-cards">
              <ConclusionView conclusion={conclusion} tagline={theme.labels.tagline} farewell={theme.labels.farewell} primaryColor={theme.colors.primary} onCommit={handleCommit} />
            </div>
          )}

          {/* 로딩 — 배경 위에서 직접 */}
          {loadingStage && (
            <div className="stage-enter garden-skin-cards">
              <LoadingOverlay stage={loadingStage} primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
            </div>
          )}

          {/* 게임 텍스트 — 배경 위에 직접 렌더링 */}
          {showDialogue && (
            <GameDialogue
              character={theme.character}
              text={isDialogueTyping ? "" : displayText}
              primaryColor={theme.colors.primary}
              avatarSrc={AVATAR_SRC}
              typing={isDialogueTyping}
              gameUI={activeGameUI}
              onTypingComplete={isViewingPast ? undefined : handleTypingComplete}
            />
          )}

          {/* 과거 씬 열람 시: 유저 응답 표시 */}
          {isViewingPast && displayUserInput && (
            <div className="text-xs font-rpg text-white/30 text-right pr-2">
              💬 {displayUserInput}
            </div>
          )}

          {/* ◀ ▶ 씬 내비게이션 */}
          {scenes.length > 0 && (
            <div className="flex items-center justify-center gap-6 py-1">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 disabled:text-white/10 transition-colors text-lg"
                aria-label="이전 답변"
              >
                ‹
              </button>
              <span className="text-[10px] text-white/25 font-rpg tabular-nums min-w-[40px] text-center">
                {currentPageNum} / {totalScenes}
              </span>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 disabled:text-white/10 transition-colors text-lg"
                aria-label="다음 답변"
              >
                ›
              </button>
            </div>
          )}

          {/* 선택지 (현재 씬, 직접 말하기 모드 아닐 때) */}
          {choicesVisible && (
            <div className="stage-enter">
              <GameChoices
                options={options}
                onSelect={handleOptionSelect}
                primaryColor={theme.colors.primary}
                visible={choicesVisible}
                gameUI={activeGameUI}
              />
            </div>
          )}

          {/* 자유입력 */}
          {!isViewingPast && showFreeInput && (
            <div style={{ animation: "stage-fade-in 0.25s ease-out" }}>
              <GameInput
                onSend={handleFreeInputSend}
                placeholder="안건을 입력해주세요..."
                gameUI={activeGameUI}
                primaryColor={theme.colors.primary}
                forceExpanded
                onCollapse={handleFreeInputCollapse}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
