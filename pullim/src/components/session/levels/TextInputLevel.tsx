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
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="편하게 말해봐..."
          disabled={isLoading}
          rows={2}
          className="glass-input w-full px-4 py-3 text-sm resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 bottom-2 glass-btn px-3 py-1 text-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          ↑
        </button>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onSwitchToChoices}
          className="text-xs font-rpg-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          선택지 보여줘
        </button>
      </div>
    </div>
  );
}
