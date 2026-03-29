"use client";

import Image from "next/image";
import { CharacterName } from "@/lib/types-ultimate";

const CHARACTER_ICONS: Record<CharacterName, string> = {
  현자: "🦉",
  비서: "🐱",
  코치: "🔥",
  친구: "🐰",
  별지기: "⭐",
  동행자: "☄️",
};

interface Props {
  character: CharacterName;
  text: string;
  primaryColor: string;
  typing?: boolean;
  avatarSrc?: string;
}

export default function CharacterDialogue({ character, text, primaryColor, typing = false, avatarSrc }: Props) {
  return (
    <div className="flex gap-3 items-start max-w-lg md:max-w-2xl lg:max-w-3xl" style={{ animation: "sage-appear 0.4s ease-out" }}>
      {/* 캐릭터 아바타 */}
      <div
        className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 border-2"
        style={{ borderColor: `${primaryColor}50`, boxShadow: `0 0 12px ${primaryColor}20` }}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={character}
            width={72}
            height={72}
            className="object-cover w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-lg"
            style={{ background: `${primaryColor}15` }}
          >
            {CHARACTER_ICONS[character]}
          </div>
        )}
      </div>

      {/* 대사 — RPG 패널 스타일 */}
      <div
        className="rpg-panel-light rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[calc(100%-84px)] font-rpg"
        style={{
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {typing ? (
          <span className="flex items-center gap-1.5 py-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: primaryColor, animation: "rpg-dot-bounce 1.2s ease-in-out infinite", animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: primaryColor, animation: "rpg-dot-bounce 1.2s ease-in-out infinite", animationDelay: "200ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: primaryColor, animation: "rpg-dot-bounce 1.2s ease-in-out infinite", animationDelay: "400ms" }}
            />
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}
