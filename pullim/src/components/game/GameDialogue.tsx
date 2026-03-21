"use client";

import { useEffect, useState, useRef } from "react";
import { CharacterName } from "@/lib/types-ultimate";
import { CHARACTER_ICONS, type GameUIStyle } from "@/lib/themes";
import CharacterDialogue from "@/components/ultimate/CharacterDialogue";

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

  // Typewriter effect for game UI
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

  // Fire callback when typing completes
  useEffect(() => {
    if (isTypingDone && onTypingCompleteRef.current) {
      onTypingCompleteRef.current();
    }
  }, [isTypingDone]);

  // Fallback: no gameUI -> use original CharacterDialogue
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

  return (
    <div
      className="flex gap-3 items-start max-w-lg"
      style={{ animation: "sage-appear 0.4s ease-out" }}
    >
      {/* Character icon (emoji, 48px) */}
      <div
        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-2xl border"
        style={{
          borderColor: `${primaryColor}40`,
          background: `${primaryColor}10`,
          boxShadow: `0 0 12px ${primaryColor}15`,
        }}
      >
        {icon}
      </div>

      {/* Dialogue box — style depends on dialogueStyle */}
      <div
        className={`${
          gameUI.dialogueStyle === "card"
            ? "game-card-box"
            : gameUI.dialogueStyle === "parchment"
            ? "game-parchment-box"
            : "game-letter-box"
        } ${
          gameUI.dialogueStyle === "card"
            ? "rounded-lg rounded-tl-sm"
            : "rounded-2xl rounded-tl-sm"
        } px-4 py-3 text-sm leading-relaxed max-w-[calc(100%-60px)] font-rpg`}
        style={{ color: "rgba(255,255,255,0.88)" }}
      >
        {typing ? (
          <span className="flex items-center gap-1.5 py-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: primaryColor,
                animation: "rpg-dot-bounce 1.2s ease-in-out infinite",
                animationDelay: "0ms",
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: primaryColor,
                animation: "rpg-dot-bounce 1.2s ease-in-out infinite",
                animationDelay: "200ms",
              }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: primaryColor,
                animation: "rpg-dot-bounce 1.2s ease-in-out infinite",
                animationDelay: "400ms",
              }}
            />
          </span>
        ) : (
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
        )}
      </div>
    </div>
  );
}
