"use client";

import { CharacterName } from "@/lib/types-ultimate";

interface Props {
  stage: "research" | "analyze" | "debate" | "conclude";
  primaryColor: string;
  crystalLabel: string;
  character?: CharacterName;
}

const STAGE_CONFIG = {
  research: {
    variant: "spin" as const,
    emoji: "📜",
    text: {
      현자: "두루마리를 펼치는 중...",
      비서: "데이터를 조회하는 중...",
      친구: "이야기를 찾아보는 중...",
      코치: "자료를 조사하는 중...",
      별지기: "별자리를 읽는 중...",
      동행자: "흔적을 따라가는 중...",
    } as Record<CharacterName, string>,
  },
  analyze: {
    variant: "glow" as const,
    emoji: "🔮",
    text: {
      현자: "구슬이 비추고 있습니다...",
      비서: "전문가 관점에서 분석하는 중...",
      친구: "꽃봉오리가 피어나는 중...",
      코치: "분석을 진행하는 중...",
      별지기: "별빛이 비추는 중...",
      동행자: "잿빛 속에서 빛을 찾는 중...",
    } as Record<CharacterName, string>,
  },
  debate: {
    variant: "cross" as const,
    emoji: "✨",
    text: {
      현자: "구슬들이 대화 중...",
      비서: "관점을 교차 검증 중...",
      친구: "꽃들이 속삭이는 중...",
      코치: "의견을 나누는 중...",
      별지기: "별들이 대화하는 중...",
      동행자: "폐허에서 이야기를 나누는 중...",
    } as Record<CharacterName, string>,
  },
  conclude: {
    variant: "fade" as const,
    emoji: "📖",
    text: {
      현자: "마지막 페이지를 펼치는 중...",
      비서: "보고서를 작성하는 중...",
      친구: "마음을 정리하는 중...",
      코치: "결론을 정리하는 중...",
      별지기: "밤하늘에 기록하는 중...",
      동행자: "마지막 페이지를 넘기는 중...",
    } as Record<CharacterName, string>,
  },
};

export default function LoadingOverlay({ stage, primaryColor, crystalLabel, character = "현자" }: Props) {
  const config = STAGE_CONFIG[stage];
  const displayText = config.text[character];

  return (
    <div
      className="rpg-panel rounded-2xl px-6 py-8 max-w-md md:max-w-xl lg:max-w-2xl mx-auto text-center font-rpg"
      style={{ animation: "sage-appear 0.4s ease-out" }}
    >
      {/* 이모지 영역 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {config.variant === "spin" && (
          <span
            className="text-3xl inline-block"
            style={{ animation: "loading-spin 2s linear infinite" }}
          >
            {config.emoji}
          </span>
        )}
        {config.variant === "glow" && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="text-2xl inline-block"
                style={{
                  animation: "loading-pulse-dot 1.5s ease-in-out infinite",
                  animationDelay: `${i * 300}ms`,
                  filter: `drop-shadow(0 0 8px ${primaryColor})`,
                }}
              >
                {config.emoji}
              </span>
            ))}
          </div>
        )}
        {config.variant === "cross" && (
          <div className="relative w-16 h-16 flex items-center justify-center">
            <span
              className="text-2xl absolute"
              style={{
                animation: "loading-pulse-dot 1.2s ease-in-out infinite",
                filter: `drop-shadow(0 0 12px ${primaryColor})`,
              }}
            >
              {config.emoji}
            </span>
            <span
              className="text-2xl absolute"
              style={{
                animation: "loading-pulse-dot 1.2s ease-in-out infinite",
                animationDelay: "400ms",
                filter: `drop-shadow(0 0 12px ${primaryColor})`,
                transform: "translateX(-10px)",
              }}
            >
              {config.emoji}
            </span>
            <span
              className="text-2xl absolute"
              style={{
                animation: "loading-pulse-dot 1.2s ease-in-out infinite",
                animationDelay: "800ms",
                filter: `drop-shadow(0 0 12px ${primaryColor})`,
                transform: "translateX(10px)",
              }}
            >
              {config.emoji}
            </span>
          </div>
        )}
        {config.variant === "fade" && (
          <span
            className="text-3xl inline-block"
            style={{
              animation: "loading-pulse-dot 2s ease-in-out infinite",
              filter: `drop-shadow(0 0 8px ${primaryColor})`,
            }}
          >
            {config.emoji}
          </span>
        )}
      </div>

      {/* 텍스트 */}
      <p className="text-sm text-white/70 mb-3">{displayText}</p>

      {/* 프로그레스 도트 */}
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: primaryColor,
              animation: "loading-pulse-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
