"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useV2SessionStore, V2Message } from "@/lib/store/v2-session-store";
import { ExpertName, DebateRound } from "@/lib/types-v2";
import { EXPERT_WHITELIST } from "@/lib/llm/expert-recommend";
import { EXPERT_STYLE } from "@/components/ExpertCard";
import V2StageIndicator from "@/components/V2StageIndicator";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SelectionButtons from "@/components/SelectionButtons";
import ExpertCard from "@/components/ExpertCard";
import AnalysisPanel from "@/components/AnalysisPanel";
import DebateView from "@/components/DebateView";
import CrisisAlert from "@/components/CrisisAlert";

export default function V2SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Store selectors
  const session = useV2SessionStore((s) => s.v2Sessions[sessionId]);
  const messages = useV2SessionStore((s) => s.v2Messages[sessionId] || []);
  const report = useV2SessionStore((s) => s.v2Reports[sessionId]);
  const debateSynthesis = useV2SessionStore((s) => s.v2DebateSynthesis[sessionId] || "");

  const addMessage = useV2SessionStore((s) => s.addV2Message);
  const setStage = useV2SessionStore((s) => s.setV2Stage);
  const setListenSummary = useV2SessionStore((s) => s.setListenSummary);
  const setSelectedExperts = useV2SessionStore((s) => s.setSelectedExperts);
  const setExpertAnalyses = useV2SessionStore((s) => s.setExpertAnalyses);
  const setDebateRounds = useV2SessionStore((s) => s.setDebateRounds);
  const setDebateSynthesisStore = useV2SessionStore((s) => s.setDebateSynthesis);
  const setCrisisLevel = useV2SessionStore((s) => s.setCrisisLevel);
  const setDebateUserContext = useV2SessionStore((s) => s.setDebateUserContext);
  const setReport = useV2SessionStore((s) => s.setV2Report);
  const completeSession = useV2SessionStore((s) => s.completeV2Session);
  const resetFromStage = useV2SessionStore((s) => s.resetFromStage);

  // Local state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [lastOptions, setLastOptions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDebating, setIsDebating] = useState(false);
  const [selectedPriorityExpert, setSelectedPriorityExpert] = useState<ExpertName | null>(null);
  const [crisis, setCrisis] = useState<{ message: string; hotline: string } | null>(null);
  const [isLanding, setIsLanding] = useState(false);

  // Expert selection: show all 10
  const [showOtherExperts, setShowOtherExperts] = useState(false);
  const [selectedExpertsLocal, setSelectedExpertsLocal] = useState<ExpertName[]>([]);

  // Intervention 1: after ANALYZE, before DEBATE
  const [analyzeInterventionPriority, setAnalyzeInterventionPriority] = useState<ExpertName | null>(null);
  const [analyzeInterventionContext, setAnalyzeInterventionContext] = useState("");

  // Intervention 2: after DEBATE, before LAND
  const [debateAdditionalComment, setDebateAdditionalComment] = useState("");
  const [showDebateAdditionalInput, setShowDebateAdditionalInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);
  const listenTurnCountRef = useRef(0);
  const isLandingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [streamingText, messages, scrollToBottom]);

  // Count user messages for listen stage progression
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  // ---------- LISTEN: SSE streaming to /api/chat ----------
  const sendListenMessage = useCallback(
    async (userText: string, allMessages: V2Message[]) => {
      setIsStreaming(true);
      setStreamingText("");

      // Build messages for the API
      const apiMessages = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      // Add the new user message
      apiMessages.push({
        role: "user" as const,
        content: userText,
        timestamp: new Date().toISOString(),
      });

      try {
        const res = await fetch("/api/chat/v2-listen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            toneSetting: session?.tone_setting || "해요체",
            turnCount: listenTurnCountRef.current,
          }),
        });

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let fullText = "";
        let parsedOptions: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);

              // Crisis check from server
              if (parsed.crisis) {
                setCrisis({
                  message: parsed.text || "위기 상황이 감지되었습니다.",
                  hotline: "109 (자살예방상담전화)",
                });
                setCrisisLevel(sessionId, parsed.tier === "A" ? "RED" : "YELLOW");
                setIsStreaming(false);
                setStreamingText("");
                return;
              }

              if (parsed.text) {
                fullText += parsed.text;
                // Strip [OPTIONS] block from display during streaming
                const displayable = fullText
                  .replace(/\[OPTIONS\][\s\S]*?(\[\/OPTIONS\])?$/, "")
                  .trim();
                setStreamingText(displayable);
              }
              if (parsed.options) {
                parsedOptions = parsed.options;
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Strip [OPTIONS] block from saved text
        let cleanedText = fullText
          .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "")
          .trim();

        // Check for listen summary signal
        let listenComplete = false;
        let summaryText = "";

        if (cleanedText.includes("[LISTEN_COMPLETE]")) {
          listenComplete = true;
          const parts = cleanedText.split("[LISTEN_COMPLETE]");
          cleanedText = parts[0].trim();
          summaryText = parts[1]?.trim() || cleanedText;
        }

        const finalText = cleanedText || "계속 이야기해주세요.";

        // Save assistant message
        addMessage(sessionId, {
          role: "assistant",
          content: finalText,
          timestamp: new Date().toISOString(),
          options: parsedOptions.length > 0 ? parsedOptions : undefined,
        });

        setLastOptions(parsedOptions);
        setStreamingText("");

        if (listenComplete) {
          setListenSummary(sessionId, summaryText);
          // Brief pause then advance
          setTimeout(() => {
            setStage(sessionId, "EXPERT_SELECT");
          }, 1500);
        }
      } catch (error) {
        void error;
        addMessage(sessionId, {
          role: "assistant",
          content: "죄송합니다, 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, session?.tone_setting, addMessage, setListenSummary, setStage, setCrisisLevel]
  );

  // ---------- LISTEN: Initial greeting ----------
  useEffect(() => {
    if (
      !session ||
      session.current_stage !== "LISTEN" ||
      hasInitRef.current ||
      messages.length > 0 ||
      isStreaming
    ) {
      return;
    }

    hasInitRef.current = true;
    listenTurnCountRef.current = 0;

    // Send initial empty message to get greeting + options
    sendListenMessage("", []);
  }, [session, messages.length, isStreaming, sendListenMessage]);

  // Reset init ref when stage changes
  useEffect(() => {
    hasInitRef.current = false;
  }, [session?.current_stage]);

  // Sync local expert selection from session when entering EXPERT_SELECT
  useEffect(() => {
    if (session?.current_stage === "EXPERT_SELECT") {
      setSelectedExpertsLocal(session.selected_experts.length > 0 ? session.selected_experts : session.recommended_experts);
      setSelectedPriorityExpert(null);
      setShowOtherExperts(false);
    }
  }, [session?.current_stage, session?.selected_experts, session?.recommended_experts]);

  // ---------- ANALYZE ----------
  const runAnalysis = useCallback(async () => {
    if (!session || isAnalyzing) return;

    setIsAnalyzing(true);
    setStage(sessionId, "ANALYZE");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: session.listen_summary || "",
          selectedExperts: session.selected_experts,
          listenSummary: session.listen_summary || "",
          toneSetting: session.tone_setting,
        }),
      });

      const data = await res.json();

      if (data.crisis) {
        setCrisis({
          message: data.message || "위기 상황이 감지되었습니다.",
          hotline: "109",
        });
        setCrisisLevel(sessionId, "RED");
        setIsAnalyzing(false);
        return;
      }

      if (data.safetyLevel) {
        setCrisisLevel(sessionId, data.safetyLevel);
      }

      setExpertAnalyses(sessionId, data.analyses);

      // Do NOT auto-advance: wait for user intervention (Change 3)
    } catch (error) {
      void error;
      addMessage(sessionId, {
        role: "assistant",
        content: "분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [session, sessionId, isAnalyzing, setStage, setExpertAnalyses, setCrisisLevel, addMessage]);

  // ---------- DEBATE ----------
  const runDebate = useCallback(async () => {
    if (!session || isDebating || session.expert_analyses.length < 3) return;

    setIsDebating(true);

    const priorityExpert = selectedPriorityExpert || session.selected_experts[0];

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyses: session.expert_analyses,
          selectedExpertName: priorityExpert,
          toneSetting: session.tone_setting,
          listenSummary: session.listen_summary || "",
          userContext: session.debate_user_context || undefined,
        }),
      });

      const data = await res.json();

      if (data.crisis) {
        setCrisis({
          message: data.message || "위기 상황이 감지되었습니다.",
          hotline: "109",
        });
        setIsDebating(false);
        return;
      }

      const allRounds: DebateRound[] = [...data.round1, data.round2];
      setDebateRounds(sessionId, allRounds);
      setDebateSynthesisStore(sessionId, data.debateSynthesis);

      // Do NOT auto-advance: wait for user intervention (Change 3)
    } catch (error) {
      void error;
      addMessage(sessionId, {
        role: "assistant",
        content: "토론 중 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsDebating(false);
    }
  }, [
    session,
    sessionId,
    isDebating,
    selectedPriorityExpert,
    setDebateRounds,
    setDebateSynthesisStore,
    addMessage,
  ]);

  // Auto-run debate when stage changes to DEBATE
  useEffect(() => {
    if (session?.current_stage === "DEBATE" && !isDebating && session.debate_rounds.length === 0) {
      runDebate();
    }
  }, [session?.current_stage, session?.debate_rounds.length, isDebating, runDebate]);

  // ---------- LAND ----------
  const runLanding = useCallback(async () => {
    if (!session || isLandingRef.current) return;

    isLandingRef.current = true;
    setIsLanding(true);
    setIsStreaming(true);
    setStreamingText("");

    const debateText = session.debate_rounds.map((r) => `${r.expert_name}: ${r.content}`).join("\n\n");

    try {
      const res = await fetch("/api/chat/v2-land", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listenSummary: session.listen_summary || "",
          expertAnalyses: session.expert_analyses,
          debateResult: debateText,
          debateSynthesis: debateSynthesis,
          toneSetting: session.tone_setting,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setStreamingText(fullText);
            }
          } catch {
            // skip
          }
        }
      }

      // Extract report data if present
      const reportMatch = fullText.match(/\[REPORT_DATA\]([\s\S]*?)\[\/REPORT_DATA\]/);
      const displayText = fullText
        .replace(/\[REPORT_DATA\][\s\S]*?\[\/REPORT_DATA\]/, "")
        .replace("[LAND_COMPLETE]", "")
        .trim();

      if (reportMatch) {
        try {
          const reportData = JSON.parse(reportMatch[1]);
          setReport(sessionId, reportData);
        } catch {
          // Report parse failed, continue without it
        }
      }

      const finalText = displayText || "정리가 완료되었습니다.";

      addMessage(sessionId, {
        role: "assistant",
        content: finalText,
        timestamp: new Date().toISOString(),
      });

      setStreamingText("");

      // Complete after a pause
      setTimeout(() => {
        completeSession(sessionId);
      }, 2000);
    } catch (error) {
      void error;
      addMessage(sessionId, {
        role: "assistant",
        content: "정리 중 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsStreaming(false);
      setIsLanding(false);
      isLandingRef.current = false;
    }
  }, [session, sessionId, debateSynthesis, addMessage, setReport, completeSession]);

  // Auto-run landing when stage changes to LAND
  useEffect(() => {
    if (session?.current_stage === "LAND" && !isLanding && !report) {
      runLanding();
    }
  }, [session?.current_stage, isLanding, report, runLanding]);

  // ---------- Handler: User sends a message in LISTEN ----------
  const handleListenSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      listenTurnCountRef.current += 1;

      // Save user message
      addMessage(sessionId, {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      });

      setLastOptions([]);

      // Auto-advance after enough turns
      const newUserCount = userMessageCount + 1;
      if (newUserCount >= 3) {
        // Force listen summary on next response
        listenTurnCountRef.current = 99; // signals to API to wrap up
      }

      sendListenMessage(text, messages);
    },
    [sessionId, isStreaming, userMessageCount, messages, addMessage, sendListenMessage]
  );

  // ---------- Handler: Expert selection (select 3 from all 10) ----------
  const handleExpertToggle = useCallback(
    (expertName: ExpertName) => {
      setSelectedExpertsLocal((prev) => {
        if (prev.includes(expertName)) {
          // Deselect
          return prev.filter((e) => e !== expertName);
        }
        if (prev.length >= 3) {
          // Already 3 selected — swap the last one
          return [...prev.slice(0, 2), expertName];
        }
        return [...prev, expertName];
      });
    },
    []
  );

  // Set first selected expert as priority (leads debate)
  const handleSetPriority = useCallback(
    (expertName: ExpertName) => {
      setSelectedPriorityExpert(expertName);
      // Move to front of selection
      setSelectedExpertsLocal((prev) => {
        if (!prev.includes(expertName)) return prev;
        return [expertName, ...prev.filter((e) => e !== expertName)];
      });
    },
    []
  );

  const handleConfirmExperts = useCallback(() => {
    if (selectedExpertsLocal.length !== 3) return;
    // Ensure priority expert is first
    const ordered = selectedPriorityExpert && selectedExpertsLocal.includes(selectedPriorityExpert)
      ? [selectedPriorityExpert, ...selectedExpertsLocal.filter((e) => e !== selectedPriorityExpert)]
      : selectedExpertsLocal;
    setSelectedExperts(sessionId, ordered);
    runAnalysis();
  }, [selectedExpertsLocal, selectedPriorityExpert, sessionId, setSelectedExperts, runAnalysis]);

  // ---------- Handler: Intervention 1 — Proceed to DEBATE ----------
  const handleProceedToDebate = useCallback(() => {
    if (!session) return;
    // Set priority expert for debate
    if (analyzeInterventionPriority) {
      setSelectedPriorityExpert(analyzeInterventionPriority);
    }
    // Save user context if provided
    if (analyzeInterventionContext.trim()) {
      setDebateUserContext(sessionId, analyzeInterventionContext.trim());
    }
    setStage(sessionId, "DEBATE");
  }, [session, sessionId, analyzeInterventionPriority, analyzeInterventionContext, setStage, setDebateUserContext]);

  // ---------- Handler: Intervention 2 — After DEBATE ----------
  const handleDebateAgree = useCallback(() => {
    setStage(sessionId, "LAND");
  }, [sessionId, setStage]);

  const handleDebateGoBack = useCallback(() => {
    resetFromStage(sessionId, "EXPERT_SELECT");
    setSelectedPriorityExpert(null);
    setAnalyzeInterventionPriority(null);
    setAnalyzeInterventionContext("");
    setShowDebateAdditionalInput(false);
    setDebateAdditionalComment("");
  }, [sessionId, resetFromStage]);

  const handleDebateAdditionalRound = useCallback(() => {
    if (!debateAdditionalComment.trim()) return;
    // Save context and re-run debate
    setDebateUserContext(sessionId, debateAdditionalComment.trim());
    // Clear current debate results to trigger re-run
    setDebateRounds(sessionId, []);
    setDebateSynthesisStore(sessionId, "");
    setShowDebateAdditionalInput(false);
    setDebateAdditionalComment("");
    // Stage stays DEBATE; the useEffect for DEBATE auto-run will trigger
  }, [sessionId, debateAdditionalComment, setDebateUserContext, setDebateRounds, setDebateSynthesisStore]);

  // ---------- Not found ----------
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">세션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // ---------- COMPLETE: Show report ----------
  if (session.current_stage === "COMPLETE") {
    return (
      <div className="min-h-screen bg-gray-50">
        {crisis && (
          <CrisisAlert
            message={crisis.message}
            hotline={crisis.hotline}
            onClose={() => setCrisis(null)}
          />
        )}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-violet-600 text-sm font-medium"
          >
            &larr; 새 고민
          </button>
          <span className="text-sm font-semibold text-gray-900">풀림</span>
          <div className="w-16" />
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">정리 완료</h1>
            <p className="text-sm text-gray-500">풀림이 함께 정리한 결과입니다</p>
          </div>

          {/* Listen summary */}
          {session.listen_summary && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-gray-900">고민 요약</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{session.listen_summary}</p>
            </div>
          )}

          {/* Expert analyses */}
          {session.expert_analyses.length > 0 && (
            <div className="mb-4">
              <AnalysisPanel analyses={session.expert_analyses} />
            </div>
          )}

          {/* Debate */}
          {session.debate_rounds.length > 0 && (
            <div className="mb-4">
              <DebateView
                round1={session.debate_rounds.filter((r) => r.round === 1)}
                round2={session.debate_rounds.find((r) => r.round === 2) || null}
                synthesis={debateSynthesis}
              />
            </div>
          )}

          {/* Report */}
          {report && (
            <div className="space-y-4 mt-6">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-violet-900 mb-2">핵심 발견</h3>
                <p className="text-sm text-violet-800 mb-2">{report.real_question}</p>
                <p className="text-sm text-violet-700">{report.new_discovery}</p>
              </div>

              {report.options.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">행동 방향</h3>
                  <div className="space-y-2">
                    {report.options.map((opt, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-800">{opt.direction}</p>
                        <p className="text-xs text-gray-500 mt-1">{opt.expected_outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.chosen_action && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <h3 className="text-lg font-bold text-green-900 mb-2">첫 걸음</h3>
                  <p className="text-sm text-green-800 font-medium">{report.chosen_action}</p>
                </div>
              )}
            </div>
          )}

          {/* Landing messages */}
          {messages.filter((m) => m.role === "assistant").length > 0 && (
            <div className="mt-6 space-y-4">
              {messages
                .filter((m) => m.role === "assistant")
                .slice(-1)
                .map((msg, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Main session view ----------
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {crisis && (
        <CrisisAlert
          message={crisis.message}
          hotline={crisis.hotline}
          onClose={() => setCrisis(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="text-violet-600 text-sm font-medium"
          >
            &larr; 홈
          </button>
          <span className="text-sm font-semibold text-gray-900">풀림</span>
          <span className="text-xs text-gray-400">V2</span>
        </div>
        <V2StageIndicator currentStage={session.current_stage} />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {/* LISTEN stage */}
        {(session.current_stage === "LISTEN" || session.current_stage === "ROUTING") && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                <ChatMessage role={msg.role} content={msg.content} />
                {/* Show options after assistant messages */}
                {msg.role === "assistant" && msg.options && msg.options.length > 0 && i === messages.length - 1 && !isStreaming && (
                  <div className="mt-3 ml-2">
                    <SelectionButtons
                      options={msg.options}
                      onSelect={handleListenSend}
                      disabled={isStreaming}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Show last options if they came separately */}
            {!isStreaming && lastOptions.length > 0 && messages.length > 0 && !(messages[messages.length - 1]?.options?.length) && (
              <div className="mt-3 ml-2">
                <SelectionButtons
                  options={lastOptions}
                  onSelect={handleListenSend}
                  disabled={isStreaming}
                />
              </div>
            )}

            {/* Streaming text */}
            {isStreaming && streamingText && (
              <ChatMessage role="assistant" content={streamingText} isStreaming />
            )}
          </div>
        )}

        {/* EXPERT_SELECT stage */}
        {session.current_stage === "EXPERT_SELECT" && (() => {
          const recommended = session.recommended_experts;
          const otherExperts = (EXPERT_WHITELIST as readonly ExpertName[]).filter(
            (e) => !recommended.includes(e)
          );
          const selectionCount = selectedExpertsLocal.length;

          return (
            <div className="space-y-4">
              {/* Summary of what was heard */}
              {session.listen_summary && (
                <div className="bg-violet-50 text-violet-700 text-sm rounded-2xl px-4 py-3 mb-4">
                  {session.listen_summary}
                </div>
              )}

              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  전문가 3명을 선택해주세요
                </h2>
                <p className="text-sm text-gray-500">
                  첫 번째 선택한 전문가가 토론을 이끌어요
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectionCount}/3 선택됨
                </p>
              </div>

              {/* Recommended experts */}
              <div className="space-y-3">
                {recommended.map((expert) => (
                  <ExpertCard
                    key={expert}
                    expertName={expert}
                    compact
                    isSelectable
                    isSelected={selectedExpertsLocal.includes(expert)}
                    isRecommended
                    onSelect={() => handleExpertToggle(expert)}
                  />
                ))}
              </div>

              {/* Other experts — expandable */}
              <div>
                <button
                  onClick={() => setShowOtherExperts((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500
                             hover:text-violet-600 transition-colors"
                >
                  <span>{showOtherExperts ? "접기" : "다른 전문가도 선택 가능"}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showOtherExperts ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showOtherExperts && (
                  <div className="space-y-3 mt-2">
                    {otherExperts.map((expert) => (
                      <ExpertCard
                        key={expert}
                        expertName={expert}
                        compact
                        isSelectable
                        isSelected={selectedExpertsLocal.includes(expert)}
                        onSelect={() => handleExpertToggle(expert)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Priority selection — when 3 are selected */}
              {selectionCount === 3 && (
                <div className="bg-violet-50 rounded-2xl p-4">
                  <p className="text-sm text-violet-700 font-medium mb-3">
                    토론을 이끌 전문가를 탭하세요
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpertsLocal.map((expert) => {
                      const style = EXPERT_STYLE[expert];
                      return (
                        <button
                          key={expert}
                          onClick={() => handleSetPriority(expert)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                                      transition-all border-2
                                      ${selectedPriorityExpert === expert
                                        ? "bg-violet-600 text-white border-violet-600"
                                        : `bg-white ${style.color} border-gray-200 hover:border-violet-300`
                                      }`}
                        >
                          <span>{style.emoji}</span>
                          <span>{expert}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirmExperts}
                disabled={selectionCount !== 3 || !selectedPriorityExpert}
                className="w-full mt-4 py-3.5 rounded-2xl bg-violet-600 text-white font-medium
                           hover:bg-violet-700 active:bg-violet-800
                           disabled:bg-gray-200 disabled:text-gray-400
                           transition-colors"
              >
                {selectionCount !== 3
                  ? `전문가 ${3 - selectionCount}명 더 선택해주세요`
                  : !selectedPriorityExpert
                    ? "리드 전문가를 선택해주세요"
                    : `${selectedPriorityExpert} 중심으로 분석 시작`}
              </button>
            </div>
          );
        })()}

        {/* ANALYZE stage */}
        {session.current_stage === "ANALYZE" && (
          <div className="space-y-4">
            <AnalysisPanel
              analyses={session.expert_analyses}
              isLoading={isAnalyzing}
            />

            {/* Intervention 1: after analysis loaded, user picks priority + optional context */}
            {!isAnalyzing && session.expert_analyses.length > 0 && (
              <div className="space-y-4 mt-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    가장 공감가는 분석은?
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {session.selected_experts.map((expert) => {
                      const style = EXPERT_STYLE[expert];
                      return (
                        <button
                          key={expert}
                          onClick={() => setAnalyzeInterventionPriority(expert)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                                      transition-all border-2
                                      ${analyzeInterventionPriority === expert
                                        ? "bg-violet-600 text-white border-violet-600"
                                        : `bg-white ${style.color} border-gray-200 hover:border-violet-300`
                                      }`}
                        >
                          <span>{style.emoji}</span>
                          <span>{expert}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    추가로 고려할 점이 있나요? <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={analyzeInterventionContext}
                    onChange={(e) => setAnalyzeInterventionContext(e.target.value)}
                    placeholder="예: 가족 상황도 고려해줘..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent
                               placeholder:text-gray-400"
                  />
                </div>

                <button
                  onClick={handleProceedToDebate}
                  disabled={!analyzeInterventionPriority}
                  className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-medium
                             hover:bg-violet-700 active:bg-violet-800
                             disabled:bg-gray-200 disabled:text-gray-400
                             transition-colors"
                >
                  {analyzeInterventionPriority
                    ? "이 관점들로 토론 시작"
                    : "공감가는 분석을 선택해주세요"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* DEBATE stage */}
        {session.current_stage === "DEBATE" && (
          <div className="space-y-4">
            <DebateView
              round1={session.debate_rounds.filter((r) => r.round === 1)}
              round2={session.debate_rounds.find((r) => r.round === 2) || null}
              synthesis={debateSynthesis}
              isLoading={isDebating}
            />

            {/* Intervention 2: after debate, user decides next step */}
            {!isDebating && session.debate_rounds.length > 0 && (
              <div className="space-y-3 mt-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    토론 결과에 동의하나요?
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={handleDebateAgree}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200
                                 bg-white text-sm text-gray-700
                                 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700
                                 active:bg-violet-100 transition-all"
                    >
                      동의해요, 정리해줘
                    </button>

                    <button
                      onClick={handleDebateGoBack}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200
                                 bg-white text-sm text-gray-700
                                 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700
                                 active:bg-violet-100 transition-all"
                    >
                      전문가를 다시 선택할래요
                    </button>

                    {!showDebateAdditionalInput ? (
                      <button
                        onClick={() => setShowDebateAdditionalInput(true)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200
                                   bg-white text-sm text-gray-700
                                   hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700
                                   active:bg-violet-100 transition-all"
                      >
                        추가 의견이 있어요
                      </button>
                    ) : (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={debateAdditionalComment}
                          onChange={(e) => setDebateAdditionalComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleDebateAdditionalRound();
                            }
                          }}
                          placeholder="추가로 고려할 점을 알려주세요..."
                          autoFocus
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent
                                     placeholder:text-gray-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleDebateAdditionalRound}
                            disabled={!debateAdditionalComment.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium
                                       hover:bg-violet-700 active:bg-violet-800
                                       disabled:bg-gray-200 disabled:text-gray-400
                                       transition-colors"
                          >
                            추가 토론 시작
                          </button>
                          <button
                            onClick={() => {
                              setShowDebateAdditionalInput(false);
                              setDebateAdditionalComment("");
                            }}
                            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-gray-600
                                       transition-colors text-sm"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LAND stage */}
        {session.current_stage === "LAND" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1">정리 중...</h2>
              <p className="text-sm text-gray-500">토론 결과를 종합하고 있어요</p>
            </div>

            {isStreaming && streamingText && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400 animate-pulse rounded-sm" />
                </p>
              </div>
            )}

            {!isStreaming && messages.filter((m) => m.role === "assistant").length > 0 && (
              <div className="space-y-4">
                {messages
                  .filter((m) => m.role === "assistant")
                  .slice(-1)
                  .map((msg, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - only for LISTEN stage */}
      {session.current_stage === "LISTEN" && (
        <div className="sticky bottom-0">
          <ChatInput
            onSend={handleListenSend}
            disabled={isStreaming}
            placeholder="생각을 말해주세요..."
          />
        </div>
      )}
    </div>
  );
}
