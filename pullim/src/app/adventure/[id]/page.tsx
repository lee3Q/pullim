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
import { useBehaviorSignals } from "@/hooks/useBehaviorSignals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { buildHistoryContext } from "@/lib/personalization/history-reader";
import { buildSensoryLadderContext } from "@/lib/personalization/sensory-ladder";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
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
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import SatisfactionRating from "@/components/discovery/SatisfactionRating";
import Link from "next/link";
import LadderSessionPage from "@/components/session/LadderSessionPage";

const theme = getTheme("모험가");

// 새 에셋 (themes/index.ts 수정 금지이므로 여기서 오버라이드)
const AVATAR_SRC = "/assets/adventure-owl.png";
const STAGE_BACKGROUNDS: Partial<Record<string, string>> = {
  ENTER: "/assets/adventure-enter-bg.png",
  LISTEN: "/assets/adventure-listen-bg.png",
  RESEARCH: "/assets/adventure-listen-bg.png",
  VERIFY: "/assets/adventure-listen-bg.png",
  DISCUSS_1: "/assets/adventure-listen-bg.png",
  CRYSTAL_SELECT: "/assets/adventure-crystal-bg.png",
  CRYSTAL_ANALYZE: "/assets/adventure-crystal-bg.png",
  DISCUSS_2: "/assets/adventure-crystal-bg.png",
  DEBATE: "/assets/adventure-crystal-bg.png",
  DISCUSS_3: "/assets/adventure-crystal-bg.png",
  JUDGE: "/assets/adventure-crystal-bg.png",
  CONCLUDE: "/assets/adventure-enter-bg.png",
  COMPLETE: "/assets/adventure-enter-bg.png",
};

const ERROR_MSG =
  "수정구슬이 잠시 흐려졌네... 다시 한번 말해주겠는가?";
const FREE_INPUT_LABEL = "직접 말하기";

const DEFAULT_CHOICES: Partial<Record<string, string[]>> = {
  ENTER: ["갈림길에 서있어", "답을 못 찾겠어", FREE_INPUT_LABEL],
  LISTEN_FALLBACK: ["더 이야기하겠네", "이게 전부일세", FREE_INPUT_LABEL],
  DISCUSS_1: ["도움이 될 기록이군", "내 상황과는 좀 다르네", FREE_INPUT_LABEL],
  DISCUSS_3: ["정리가 되었네", "다시 생각해보겠네"],
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

export default function AdventureSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const searchParams = useSearchParams();

  // 양방향 사다리 모드
  if (searchParams.get("mode") === "ladder") {
    return <LadderSessionPage theme="모험가" bgImage="/assets/adventure-listen-bg.png" />;
  }

  const isGameMode = searchParams.get("mode") !== "chat";
  const activeGameUI = isGameMode ? theme.gameUI : undefined;
  const {
    playing,
    trackLabel,
    toggle: toggleBGM,
    nextTrack,
  } = useBGM(theme.assets.bgmTracks);

  // ─── 행동 기반 개인화 ───
  const behavior = useBehaviorSignals();
  const userProfile = useUserProfile();
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);

  // 온보딩 필요 여부 (첫 방문 + 온보딩 미완료)
  const needsOnboarding = !userProfile.loading && userProfile.isNewUser && !discoveryDone;

  // 개인화 컨텍스트 (재방문 시 프로필 기반)
  const personalizationContextRef = useRef<string>("");
  const sensoryLadderContextRef = useRef<string>("");

  useEffect(() => {
    if (userProfile.profile && !userProfile.isNewUser) {
      const history = {
        sessionCount: userProfile.sessionCount,
        lastSatisfaction: userProfile.lastSatisfaction,
        completionRate: userProfile.sessionCount > 0
          ? userProfile.completedSessions / userProfile.sessionCount
          : 1,
      };
      personalizationContextRef.current = buildHistoryContext(userProfile.profile, history);
      sensoryLadderContextRef.current = buildSensoryLadderContext(userProfile.profile);

      // 재방문 시 저장된 이름 사용
      if (userProfile.profile.userName) {
        setUserName(userProfile.profile.userName);
      }
    }
  }, [userProfile.profile, userProfile.isNewUser, userProfile.sessionCount, userProfile.lastSatisfaction, userProfile.completedSessions]);

  const handleOnboardingComplete = useCallback((profile: ProbabilityProfile) => {
    setDiscoveryDone(true);
    userProfile.saveProfile(profile);
    setUserName(profile.userName);
    // 새 프로필로 컨텍스트 바로 생성
    personalizationContextRef.current = buildHistoryContext(profile, {
      sessionCount: 1,
      lastSatisfaction: null,
      completionRate: 1,
    });
    sensoryLadderContextRef.current = buildSensoryLadderContext(profile);
  }, [userProfile]);

  const handleSatisfactionRate = useCallback((score: number | null) => {
    userProfile.saveSatisfaction(score);
    setShowSatisfaction(false);
  }, [userProfile]);

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
    // 온보딩 진행 중이면 ENTER 페이즈 진행하지 않음
    if (needsOnboarding) return;

    if (stage === "ENTER" && enterPhase === 0) {
      const t = setTimeout(() => {
        setEnterPhase(1);
        setScene("...왔군.");
      }, 1000);
      return () => clearTimeout(t);
    }
    // 채팅 모드: onTypingComplete 없으므로 타이머로 페이즈 전환
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
  }, [stage, enterPhase, setScene, activeGameUI, needsOnboarding]);

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
          theme: "모험가",
          behaviorSignals: behavior.getSignals(),
          personalizationContext: personalizationContextRef.current || undefined,
          sensoryLadderContext: sensoryLadderContextRef.current || undefined,
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
            "무언가 보이기 시작하는군.\n잠깐, 두루마리를 확인해보겠네..."
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
        advanceScene("기록이 흐려졌네... 그래도 괜찮네, 계속 이야기해주게.");
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
        advanceScene("기록이 많지 않군.\n수정구슬에게 물어보겠네.");
        setDataCards([]);
        setStage("CRYSTAL_SELECT");
        setIsStreaming(false);
        return;
      }
      const fcResult = await callJudgeFactcheck(data.cards, effectiveConcern);
      setDataCards(data.cards);
      setIsStreaming(false);
      const discuss1Text = fcResult && !fcResult.passed && fcResult.issues.length > 0
        ? "두루마리를 검증해봤네.\n주의할 점이 있네.\n\n어떻게 보는가?"
        : "두루마리를 검증해봤네.\n어떻게 보는가?";
      advanceScene(discuss1Text);
      setStage("DISCUSS_1");
      setOptions(DEFAULT_CHOICES.DISCUSS_1 || []);
    } catch {
      advanceScene("기록이 흐려졌네... 그래도 괜찮네.");
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
        return `${c?.icon || "🌸"} ${a.crystal}의 수정구슬`;
      });
      setOptions(crystalOptions);
      setStage("DISCUSS_2");
      advanceScene("수정구슬이 이야기를 보여주는군.\n어떤 이야기가 가장 와닿았는가?");
    } catch { setScene(ERROR_MSG); setIsStreaming(false); }
  };

  const callDebateAPI = async (selectedCrystal: CrystalName) => {
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses: crystalAnalyses, disagreements, selectedCrystal, listenSummary, crystalModelMap, theme: "모험가" }),
      });
      if (!response.ok) { setScene(ERROR_MSG); setIsStreaming(false); return; }
      const data = await response.json();
      if (data.crisis || data.debateBlocked) { advanceScene("이 길에는 다른 종류의 안내가 필요해 보이는군."); setIsStreaming(false); return; }
      if (data.skipped) {
        setDebateRounds([]); setDebateSynthesis(data.synthesis || ""); setStage("DISCUSS_3"); setIsStreaming(false);
        advanceScene(data.synthesis || "수정구슬이 정리해줬네.\n\n어떻게 느껴져요?");
        setOptions(DEFAULT_CHOICES.DISCUSS_3 || []); return;
      }
      setDebateRounds(data.rounds || []); setDebateSynthesis(data.synthesis || ""); setStage("DISCUSS_3"); setIsStreaming(false);
      advanceScene((data.synthesis || "수정구슬의 이야기가 끝났네.") + "\n\n어떻게 느껴져요?");
      setOptions(DEFAULT_CHOICES.DISCUSS_3 || []);
    } catch { setScene(ERROR_MSG); setIsStreaming(false); }
  };

  const callConcludeAPI = async () => {
    setIsStreaming(true);
    try {
      const response = await fetch("/api/ultimate/conclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern, listenSummary, analyses: crystalAnalyses, disagreements, debateRounds, debateSynthesis, userName, theme: "모험가" }),
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
      if (!data.passed && data.issues?.length > 0) advanceScene(`하나만 더 물어봐도 되겠는가?\n${data.issues[0]}`);
      return data.passed !== false;
    } catch { return true; }
  };

  // ─── 사용자 입력 처리 ───

  const handleUserInput = async (text: string) => {
    // 행동 신호 기록
    behavior.recordMessage(text);

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
        setTimeout(() => { setScene("그 마음이 보이네.\n수정구슬을 보여주겠네."); setStage("CRYSTAL_SELECT"); }, 800);
        break;
      case "DISCUSS_2": {
        const mc = crystalAnalyses.find((a) => text.includes(a.crystal));
        const sel = mc ? mc.crystal : crystalAnalyses[0]?.crystal;
        if (sel) {
          setScene("수정구슬끼리 논의를 시작하겠네.");
          await new Promise(r => setTimeout(r, 1000));
          setStage("DEBATE"); await callDebateAPI(sel);
        }
        break;
      }
      case "DISCUSS_3": {
        setScene("오늘 나눈 이야기를 정리해보겠네.");
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
    setScene("수정구슬이 빛나기 시작하네. 잠깐 기다려주게.");
    setStage("CRYSTAL_ANALYZE");
    callAnalyzeAPI(crystals);
  };

  const handleDataCardSelect = (index: number) => {
    const card = dataCards[index];
    if (card) setScene(`"${card.fact}"... 그게 마음에 걸리는 것이군.`);
  };

  const handleCommit = (commitment: ActionCommitment) => {
    advanceScene(`${commitment.deadline}에 다시 만나요.\n${theme.labels.farewell}`);
    setStage("COMPLETE");
    // 만족도 수집 표시
    setTimeout(() => setShowSatisfaction(true), 2000);
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
            src={STAGE_BACKGROUNDS[stage] || "/assets/adventure-enter-bg.png"}
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

          {/* 온보딩 (첫 방문 사용자) */}
          {needsOnboarding && stage === "ENTER" && (
            <OnboardingFlow
              onComplete={handleOnboardingComplete}
              primaryColor={theme.colors.primary}
            />
          )}

          {/* 만족도 수집 (세션 완료 후) */}
          {showSatisfaction && (
            <SatisfactionRating
              onRate={handleSatisfactionRate}
              primaryColor={theme.colors.primary}
            />
          )}

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
                placeholder="무엇이 자네를 고민하게 하는가..."
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
