"use client";

interface Props {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
  showCustomInput?: boolean;
  onCustomInput?: (text: string) => void;
}

import { useState } from "react";

export default function SelectionButtons({
  options,
  onSelect,
  disabled = false,
  showCustomInput = true,
  onCustomInput,
}: Props) {
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState("");

  const handleCustomSubmit = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (onCustomInput) {
      onCustomInput(trimmed);
    } else {
      onSelect(trimmed);
    }
    setCustomText("");
    setShowInput(false);
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 rounded-xl border border-gray-200
                     bg-white text-sm text-gray-700
                     hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700
                     active:bg-violet-100
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
        >
          {option}
        </button>
      ))}

      {showCustomInput && !showInput && (
        <button
          onClick={() => setShowInput(true)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-gray-300
                     bg-gray-50 text-sm text-gray-500
                     hover:border-violet-300 hover:text-violet-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
        >
          직접 입력하기
        </button>
      )}

      {showCustomInput && showInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            placeholder="직접 입력해주세요..."
            autoFocus
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent
                       placeholder:text-gray-400"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customText.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium
                       hover:bg-violet-700 active:bg-violet-800
                       disabled:bg-gray-200 disabled:text-gray-400
                       transition-colors"
          >
            보내기
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setCustomText("");
            }}
            className="px-3 py-2.5 rounded-xl text-gray-400 hover:text-gray-600
                       transition-colors text-sm"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
