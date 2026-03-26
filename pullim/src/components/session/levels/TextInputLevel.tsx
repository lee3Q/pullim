"use client";

import { useState, useRef, useEffect } from "react";

interface TextInputLevelProps {
  text: string; // AI의 질문/응답
  onSend: (message: string) => void;
  onSwitchToChoices: () => void;
  isLoading: boolean;
}

export default function TextInputLevel({
  text,
  onSend,
  onSwitchToChoices,
  isLoading,
}: TextInputLevelProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {text && (
        <p className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>{text}</p>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="편하게 말해봐..."
          disabled={isLoading}
          rows={2}
          className="rpg-input w-full px-4 py-3 rounded-xl text-sm resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 bottom-3 disabled:opacity-30 transition-colors"
          style={{ color: "var(--fantasy-gold)" }}
        >
          ↑
        </button>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onSwitchToChoices}
          className="text-xs font-rpg-sm transition-colors"
          style={{ color: "rgba(192,163,116,0.35)" }}
        >
          선택지 보여줘
        </button>
      </div>
    </div>
  );
}
