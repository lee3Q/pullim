"use client";

import { useEffect, useState, useRef } from "react";
import { CharacterName } from "@/lib/types-ultimate";
import { CHARACTER_ICONS, type GameUIStyle } from "@/lib/themes";
import CharacterDialogue from "@/components/ultimate/CharacterDialogue";

const CHARACTER_NAMES: Record<CharacterName, string> = {
  현자: "부엉이 현자",
  비서: "고양이 비서",
  코치: "코치",
  친구: "정원 친구",
};

interface Props {
  character: CharacterName;
  text: string;
  primaryColor: string;
  typing?: boolean;
  avatarSrc?: string;
  gameUI?: GameUIStyle;
  onTypingComplete?: () => void;
}

export default function GameDialogue({
  character,
  text,
  primaryColor,
  typing = false,
  avatarSrc,
  gameUI,
  onTypingComplete,
}: Props) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const onTypingCompleteRef = useRef(onTypingComplete);
  onTypingCompleteRef.current = onTypingComplete;

  // Typewriter effect
  useEffect(() => {
    if (!gameUI || typing || !text) {
      setDisplayedText("");
      setIsTypingDone(false);
      return;
    }
    setDisplayedText("");
    setIsTypingDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [gameUI, text, typing]);

  useEffect(() => {
    if (isTypingDone && onTypingCompleteRef.current) {
      onTypingCompleteRef.current();
    }
  }, [isTypingDone]);

  // Fallback: no gameUI → original CharacterDialogue
  if (!gameUI) {
    return (
      <CharacterDialogue
        character={character}
        text={text}
        primaryColor={primaryColor}
        typing={typing}
        avatarSrc={avatarSrc}
      />
    );
  }

  const icon = CHARACTER_ICONS[character];
  const characterName = CHARACTER_NAMES[character] || character;

  const typingIndicator = (
    <span className="flex items-center gap-2 py-2">
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full"
          style={{
            background: primaryColor,
            animation: "rpg-dot-bounce 1.2s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </span>
  );

  const textContent = (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {!isTypingDone && text && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 align-middle"
          style={{
            background: primaryColor,
            animation: "game-cursor-blink 0.8s step-end infinite",
          }}
        />
      )}
    </p>
  );

  // ─── 게임 스타일: 박스 없이 배경 위에 직접 렌더링 ───
  return (
    <div
      className="w-full px-2"
      style={{ animation: "sage-appear 0.5s ease-out" }}
    >
      {/* 캐릭터 이름 라벨 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <span
          className="text-xs font-rpg font-semibold tracking-wider uppercase"
          style={{
            color: primaryColor,
            textShadow: `0 0 12px ${primaryColor}40`,
          }}
        >
          {characterName}
        </span>
      </div>

      {/* 대화 텍스트 — 배경 위에 직접 표시, 텍스트 쉐도우로 가독성 확보 */}
      <div
        className="text-[14px] sm:text-[15px] leading-[1.7] sm:leading-[1.8] font-rpg"
        style={{
          color: "rgba(255,255,255,0.93)",
          textShadow:
            "0 1px 6px rgba(0,0,0,0.7), 0 0 24px rgba(0,0,0,0.4)",
        }}
      >
        {typing ? typingIndicator : textContent}
      </div>
    </div>
  );
}
