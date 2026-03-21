"use client";

import { useState, useRef, useEffect } from "react";
import { type GameUIStyle } from "@/lib/themes";
import ChatInput from "@/components/ChatInput";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  gameUI?: GameUIStyle;
  primaryColor: string;
  forceExpanded?: boolean;
  onCollapse?: () => void;
}

export default function GameInput({
  onSend,
  disabled = false,
  placeholder = "마음을 이야기해보세요...",
  gameUI,
  primaryColor,
  forceExpanded = false,
  onCollapse,
}: Props) {
  const [expanded, setExpanded] = useState(forceExpanded);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  // forceExpanded가 바뀌면 expanded 동기화
  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  // Fallback: no gameUI -> use original ChatInput
  if (!gameUI) {
    return <ChatInput onSend={onSend} disabled={disabled} placeholder={placeholder} dark />;
  }

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || submittingRef.current) return;
    submittingRef.current = true;
    onSend(trimmed);
    setInput("");
    setExpanded(false);
    setTimeout(() => {
      submittingRef.current = false;
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isCard = gameUI.dialogueStyle === "card";
  const isParchment = gameUI.dialogueStyle === "parchment";
  const toggleClass = isCard ? "game-card-input-toggle" : isParchment ? "game-parchment-input-toggle" : "game-input-toggle";
  const inputBoxClass = isCard ? "game-card-input" : isParchment ? "game-parchment-input" : "game-letter-input";
  const textareaClass = isCard ? "game-card-textarea" : isParchment ? "game-parchment-textarea" : "game-letter-textarea";
  const submitBtnClass = isCard ? "strategy-button px-4 py-1.5 text-xs disabled:opacity-30" : isParchment ? "rpg-button px-4 py-1.5 text-xs disabled:opacity-30" : "garden-button px-4 py-1.5 text-xs disabled:opacity-30";

  return (
    <div className="px-4 py-3">
      <div className="max-w-lg mx-auto">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            disabled={disabled}
            className={`${toggleClass} w-full py-3 text-sm font-rpg transition-all duration-300`}
            style={{
              borderColor: `${primaryColor}30`,
              color: `${primaryColor}cc`,
            }}
          >
            {gameUI.inputLabel}
          </button>
        ) : (
          <div
            className={`${inputBoxClass} ${isCard ? "rounded-lg" : "rounded-2xl"} overflow-hidden`}
            style={{ animation: "stage-fade-in 0.25s ease-out" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={3}
              className={`${textareaClass} w-full resize-none px-4 pt-3 pb-2 text-sm font-rpg`}
              style={{ color: "rgba(255,255,255,0.85)" }}
            />
            <div className="flex justify-between items-center px-4 pb-3">
              <button
                onClick={() => {
                  setExpanded(false);
                  setInput("");
                  onCollapse?.();
                }}
                className="text-xs font-rpg text-white/40 hover:text-white/60 transition-colors"
              >
                접기
              </button>
              <button
                onClick={handleSubmit}
                disabled={disabled || !input.trim()}
                className={submitBtnClass}
              >
                보내기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
