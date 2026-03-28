"use client";

import { useState } from "react";
import Image from "next/image";
import type { PersonalityType } from "@/lib/personalization/personality-type";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import FeedbackForm from "./FeedbackForm";
import { nativeShare, hapticLight } from "@/lib/native/capacitor";

interface Props {
  type: PersonalityType;
  profile: ProbabilityProfile;
  theme: ThemeType;
  primaryColor: string;
  onContinue: () => void;
}

const THEME_GRADIENTS: Record<ThemeType, string> = {
  adventure: "from-amber-900/40 via-orange-950/30 to-red-950/20",
  garden: "from-indigo-950/40 via-purple-950/30 to-blue-950/20",
  strategy: "from-slate-800/40 via-zinc-900/30 to-neutral-950/20",
  stargazer: "from-indigo-900/40 via-indigo-950/30 to-violet-950/20",
};

const THEME_LABELS: Record<ThemeType, string> = {
  adventure: "모험가의 숲",
  garden: "달빛정원",
  strategy: "전략실",
  stargazer: "천문대",
};

function StatBar({ label, value, color }: { label: [string, string]; value: number; color: string }) {
  const percent = Math.round((value + 1) * 50); // -1~1 → 0~100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-rpg-sm text-white/60">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            marginLeft: 0,
          }}
        />
      </div>
    </div>
  );
}

export default function PersonalityResult({ type, profile, theme, primaryColor, onContinue }: Props) {
  const displayName = type.themedName[theme];
  const displayEmoji = type.themedEmoji[theme];
  const displayAttitude = type.themedAttitude[theme];
  const characterImage = `/images/personality/${theme}_${type.id}.png`;
  const [imgError, setImgError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/result?theme=${theme}&type=${type.id}`
    : `https://pullim.vercel.app/result?theme=${theme}&type=${type.id}`;

  const shareTitle = `나는 "${displayName}" 유형이래!`;
  const shareText = `${THEME_LABELS[theme]}에서 발견한 나 — ${displayName}. 너도 해볼래?`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleShare() {
    try {
      await hapticLight();
      const shared = await nativeShare({ title: shareTitle, text: shareText, url: shareUrl });
      if (!shared) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      }
    } catch {
      // 사용자가 공유 취소 시 무시
    }
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-700">

      {/* ===== 공유용 결과 카드 ===== */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${THEME_GRADIENTS[theme]} p-6 pb-5`}
        style={{ border: `1px solid ${primaryColor}25` }}
      >
        {/* 배경 파티클 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ background: primaryColor, top: "10%", right: "-10%" }}
          />
          <div
            className="absolute w-24 h-24 rounded-full blur-3xl opacity-15 animate-pulse [animation-delay:1s]"
            style={{ background: primaryColor, bottom: "20%", left: "-5%" }}
          />
        </div>

        {/* 테마 라벨 */}
        <p
          className="relative text-[10px] font-rpg-sm tracking-[0.2em] uppercase text-center mb-5"
          style={{ color: `${primaryColor}77` }}
        >
          {THEME_LABELS[theme]}에서 발견한 당신
        </p>

        {/* 캐릭터 이미지 또는 이모지 */}
        <div className="relative text-center mb-4">
          {/* 글로우 링 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-28 h-28 md:w-40 md:h-40 rounded-full animate-pulse opacity-20"
              style={{
                background: `radial-gradient(circle, ${primaryColor}44, transparent 70%)`,
              }}
            />
          </div>
          {!imgError ? (
            <div className="relative w-40 h-40 md:w-52 md:h-52 mx-auto my-2">
              <Image
                src={characterImage}
                alt={displayName}
                fill
                sizes="(max-width: 768px) 160px, 208px"
                className="object-cover rounded-2xl"
                style={{
                  filter: `drop-shadow(0 0 20px ${primaryColor}66)`,
                }}
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div
              className="relative text-7xl leading-none py-4"
              style={{
                filter: `drop-shadow(0 0 30px ${primaryColor}88) drop-shadow(0 0 60px ${primaryColor}44)`,
              }}
            >
              {displayEmoji}
            </div>
          )}
        </div>

        {/* 유형명 */}
        <h2
          className="relative text-center text-2xl font-bold font-rpg-lg mb-2"
          style={{
            color: primaryColor,
            textShadow: `0 0 24px ${primaryColor}66, 0 0 48px ${primaryColor}33`,
          }}
        >
          {displayName}
        </h2>

        {/* 한 줄 설명 */}
        <p
          className="relative text-center text-xs font-rpg-sm leading-relaxed px-2 mb-4"
          style={{ color: "var(--fantasy-text)", opacity: 0.9 }}
        >
          {type.description}
        </p>

        {/* 4축 미니 스탯 */}
        <div className="relative grid grid-cols-2 gap-x-4 gap-y-2 px-2">
          <StatBar label={["분석적", "직관적"]} value={profile.approachStyle.value} color={primaryColor} />
          <StatBar label={["신중함", "도전적"]} value={profile.riskTolerance.value} color={primaryColor} />
          <StatBar label={["해결형", "공감형"]} value={profile.copingStyle.value} color={primaryColor} />
          <StatBar label={["숙고형", "즉흥형"]} value={profile.decisionSpeed.value} color={primaryColor} />
        </div>

        {/* 풀림 워터마크 */}
        <p className="relative text-center text-[9px] font-rpg-sm mt-4" style={{ color: `${primaryColor}44` }}>
          pullim.vercel.app
        </p>
      </div>

      {/* 공유 버튼 */}
      <div className="flex items-center justify-center gap-2">
        {canShare && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-rpg-sm transition-all active:scale-95"
            style={{
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}35`,
              color: primaryColor,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            친구에게 공유
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-rpg-sm transition-all active:scale-95"
          style={{
            background: copied ? `${primaryColor}18` : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? primaryColor + "55" : "rgba(255,255,255,0.1)"}`,
            color: copied ? primaryColor : "rgba(192,167,136,0.6)",
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              복사됨!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              링크 복사
            </>
          )}
        </button>
      </div>

      {/* 풀림의 태도 예고 */}
      <div
        className="rounded-2xl px-5 py-5 space-y-3"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}0c, ${primaryColor}04)`,
          border: `1px solid ${primaryColor}20`,
        }}
      >
        <p
          className="text-xs font-rpg-sm"
          style={{ color: `${primaryColor}88` }}
        >
          풀림이 출시되면, 당신에게는
        </p>
        <p
          className="text-sm font-rpg leading-relaxed"
          style={{ color: "var(--fantasy-text)" }}
        >
          &ldquo;{displayAttitude}&rdquo;
        </p>
      </div>

      {/* 풀림 대화 미리보기 */}
      <div
        className="rounded-2xl px-5 py-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p
          className="text-xs font-rpg-sm"
          style={{ color: "rgba(192,167,136,0.45)" }}
        >
          이런 식으로 대화할 거예요
        </p>
        <div className="space-y-2">
          {type.pullimConversation.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[82%] px-4 py-2.5 text-sm font-rpg leading-relaxed"
                style={
                  turn.role === "pullim"
                    ? {
                        background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}0a)`,
                        border: `1px solid ${primaryColor}30`,
                        color: "var(--fantasy-text)",
                        borderRadius: "16px 16px 16px 4px",
                      }
                    : {
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(192,167,136,0.8)",
                        borderRadius: "16px 16px 4px 16px",
                      }
                }
              >
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 강점 / 놓치기 쉬운 것 - 아코디언 */}
      <div className="space-y-2">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm font-rpg transition-all active:scale-[0.99]"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(192,167,136,0.55)",
          }}
        >
          <span>강점 &amp; 놓치기 쉬운 것</span>
          <span className="text-xs">{showDetails ? "▲" : "▼"}</span>
        </button>

        {showDetails && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div
              className="rounded-xl px-5 py-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs font-rpg-sm"
                style={{ color: `${primaryColor}cc` }}
              >
                ✦ 강점
              </p>
              <ul className="space-y-1.5">
                {type.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm font-rpg flex items-start gap-2"
                    style={{ color: "var(--fantasy-text)" }}
                  >
                    <span style={{ color: primaryColor, flexShrink: 0 }}>·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl px-5 py-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs font-rpg-sm"
                style={{ color: "rgba(192,167,136,0.5)" }}
              >
                ⚠ 놓치기 쉬운 것
              </p>
              <ul className="space-y-1.5">
                {type.blindSpots.map((b, i) => (
                  <li
                    key={i}
                    className="text-sm font-rpg flex items-start gap-2"
                    style={{ color: "rgba(192,167,136,0.8)" }}
                  >
                    <span style={{ color: "rgba(192,167,136,0.4)", flexShrink: 0 }}>·</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 피드백 폼 */}
      <FeedbackForm personalityType={displayName} />

      {/* CTA */}
      <div className="space-y-3 pb-6">
        <p
          className="text-center text-xs font-rpg-sm leading-relaxed"
          style={{ color: "rgba(192,167,136,0.45)" }}
        >
          파악한 유형을 바탕으로, AI가 당신에게 맞는 대화를 시작합니다
        </p>
        <button
          onClick={onContinue}
          className="w-full py-4 px-5 rounded-2xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
            border: "1px solid var(--fantasy-gold-dark)",
            color: "var(--fantasy-button-text)",
            boxShadow:
              "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
            textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
          }}
        >
          대화 시작하기
        </button>
      </div>
    </div>
  );
}
