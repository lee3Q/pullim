"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  dark?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  dark = false,
}: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const submittingRef = useRef(false);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || submittingRef.current) return;
    submittingRef.current = true;
    onSend(trimmed);
    setInput("");
    // 다음 틱에서 잠금 해제 (이중 전송 방지)
    setTimeout(() => { submittingRef.current = false; }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 한국어 IME 조합 중이면 무시
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (dark) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-end gap-2 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="rpg-input flex-1 resize-none px-4 py-2.5 text-sm
                       disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="rpg-button p-2.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent
                     disabled:bg-gray-50 disabled:text-gray-400
                     placeholder:text-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="p-2.5 rounded-xl bg-violet-600 text-white
                     hover:bg-violet-700 active:bg-violet-800
                     disabled:bg-gray-200 disabled:text-gray-400
                     transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19V5m0 0l-7 7m7-7l7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
