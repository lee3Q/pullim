"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/session-store";
import { Message, StageName, STAGE_LABELS, ModelType, STAGE_ORDER } from "@/lib/types";
import StageIndicator from "@/components/StageIndicator";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import DecisionRecord from "@/components/DecisionRecord";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const session = useSessionStore((s) => s.sessions[sessionId]);
  const addMessage = useSessionStore((s) => s.addMessage);
  const advanceStage = useSessionStore((s) => s.advanceStage);
  const setDecisionRecord = useSessionStore((s) => s.setDecisionRecord);
  const completeSession = useSessionStore((s) => s.completeSession);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [stageTransition, setStageTransition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [streamingText, session?.stages]);

  // Get current stage messages
  const currentStage = session?.current_stage as StageName;
  const currentStageData = session?.stages.find((s) => s.name === currentStage);
  const allMessages = session?.stages.flatMap((s) =>
    s.status !== "pending" ? s.messages : []
  ) || [];

  // Count user messages in current stage to determine when to advance
  const userMsgCount = currentStageData?.messages.filter(
    (m) => m.role === "user"
  ).length || 0;

  const sendToLLM = useCallback(async (messages: Message[], stage: StageName, modelType: ModelType) => {
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, stage, modelType }),
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
            fullText += parsed.text;
            setStreamingText(fullText);
          } catch {
            // skip
          }
        }
      }

      // Check for decision record in COMMIT stage
      if (stage === "COMMIT" && fullText.includes("[DECISION_RECORD]")) {
        const match = fullText.match(
          /\[DECISION_RECORD\]([\s\S]*?)\[\/DECISION_RECORD\]/
        );
        if (match) {
          try {
            const record = JSON.parse(match[1]);
            record.share_id = sessionId;
            setDecisionRecord(sessionId, record);
            // Clean the display text
            fullText = fullText.replace(
              /\[DECISION_RECORD\][\s\S]*?\[\/DECISION_RECORD\]/,
              ""
            ).trim();
          } catch {
            // skip
          }
        }
      }

      // Save assistant message (빈 응답이면 fallback)
      const finalText = fullText.trim() || "계속 이야기해주세요. 당신의 생각을 듣고 있어요.";
      addMessage(sessionId, stage, {
        role: "assistant",
        content: finalText,
        timestamp: new Date().toISOString(),
      });

      setStreamingText("");
    } catch (error) {
      console.error("Chat error:", error);
      addMessage(sessionId, stage, {
        role: "assistant",
        content: "죄송합니다, 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId, addMessage, setDecisionRecord]);

  // Initial greeting when entering a stage
  useEffect(() => {
    if (
      !session ||
      !currentStageData ||
      currentStageData.status !== "active" ||
      currentStageData.messages.length > 0 ||
      isStreaming ||
      hasInitRef.current
    )
      return;

    hasInitRef.current = true;

    // Build initial context from previous stages
    const prevMessages: Message[] = [];

    // Add the original input as context
    prevMessages.push({
      role: "user",
      content: session.input_text,
      timestamp: session.created_at,
    });

    // Add previous stage conversations as context
    for (const stage of session.stages) {
      if (stage.status === "completed" && stage.messages.length > 0) {
        const summary = stage.messages
          .map((m) => `[${m.role}]: ${m.content}`)
          .join("\n");
        prevMessages.push({
          role: "user",
          content: `[이전 단계 "${STAGE_LABELS[stage.name]}" 대화 요약]\n${summary}`,
          timestamp: stage.messages[0].timestamp,
        });
        prevMessages.push({
          role: "assistant",
          content: `네, ${STAGE_LABELS[stage.name]} 단계를 확인했습니다. 이어서 진행할게요.`,
          timestamp: stage.messages[0].timestamp,
        });
      }
    }

    sendToLLM(prevMessages, currentStage, session.model_type!);
  }, [currentStage, currentStageData, session, isStreaming, sendToLLM]);

  // Reset init ref when stage changes
  useEffect(() => {
    hasInitRef.current = false;
  }, [currentStage]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">세션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // Show decision record if complete
  if (session.current_stage === "COMPLETE" && session.decision_record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-violet-600 text-sm font-medium">
            &larr; 새 고민
          </button>
          <span className="text-sm font-semibold text-gray-900">풀림</span>
          <div className="w-16" />
        </header>
        <DecisionRecord record={session.decision_record} />
      </div>
    );
  }

  const handleSend = async (text: string) => {
    if (isStreaming || !currentStageData) return;

    // Save user message
    addMessage(sessionId, currentStage, {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });

    // Check if we should advance stage
    // Heuristic: after 2-3 user messages per stage, or if assistant indicates completion
    const newUserCount = userMsgCount + 1;
    const shouldAdvance =
      (currentStage === "CLARIFY" && newUserCount >= 3) ||
      (currentStage === "CONTEXT" && newUserCount >= 3) ||
      (currentStage === "OPTIONS" && newUserCount >= 2) ||
      (currentStage === "EVALUATE" && newUserCount >= 2) ||
      (currentStage === "STRESS_TEST" && newUserCount >= 2) ||
      (currentStage === "DECIDE" && newUserCount >= 2) ||
      (currentStage === "COMMIT" && newUserCount >= 2);

    if (shouldAdvance) {
      // Get response then advance
      const msgs = [
        ...currentStageData.messages,
        { role: "user" as const, content: text, timestamp: new Date().toISOString() },
      ];

      await sendToLLM(msgs, currentStage, session.model_type!);

      // Advance to next stage
      const currentIdx = STAGE_ORDER.indexOf(currentStage);
      if (currentIdx < STAGE_ORDER.length - 1) {
        setStageTransition(true);
        setTimeout(() => {
          advanceStage(sessionId);
          setStageTransition(false);
        }, 1000);
      } else {
        // COMMIT 단계: decision_record가 있거나 충분한 대화가 이뤄졌을 때만 완료
        const updatedSession = useSessionStore.getState().sessions[sessionId];
        if (updatedSession?.decision_record) {
          completeSession(sessionId);
        }
        // decision_record 없으면 완료하지 않고 대화 계속 유지
      }
    } else {
      // Continue in current stage
      const msgs = [
        ...currentStageData.messages,
        { role: "user" as const, content: text, timestamp: new Date().toISOString() },
      ];
      await sendToLLM(msgs, currentStage, session.model_type!);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
          <span className="text-xs text-gray-400">
            {session.model_type && `모델 ${session.model_type}`}
          </span>
        </div>
        <StageIndicator
          currentStage={session.current_stage as StageName}
          stages={session.stages}
        />
      </header>

      {/* Routing explanation */}
      {session.routing_explanation && allMessages.length === 0 && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-violet-50 text-violet-700 text-sm rounded-xl px-4 py-3">
            {session.routing_explanation}
          </div>
        </div>
      )}

      {/* Stage transition */}
      {stageTransition && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-violet-50 text-violet-600 text-sm rounded-xl px-4 py-3 text-center animate-pulse">
            다음 단계로 넘어갑니다...
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {allMessages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role as "user" | "assistant"} content={msg.content} />
        ))}
        {isStreaming && streamingText && (
          <ChatMessage role="assistant" content={streamingText} isStreaming />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0">
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming || stageTransition || session.current_stage === "COMPLETE"}
          placeholder={
            currentStage && STAGE_LABELS[currentStage as StageName]
              ? `${STAGE_LABELS[currentStage as StageName]} 단계 — 생각을 말해주세요`
              : "메시지를 입력하세요..."
          }
        />
      </div>
    </div>
  );
}
