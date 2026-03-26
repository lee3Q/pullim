"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import type { StorySelectionRecord } from "@/lib/personalization/discovery-engine";
import { getThemeStory } from "@/lib/personalization/story-scenes";
import { buildProfileFromStory } from "@/lib/personalization/discovery-engine";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";

interface Props {
  theme: ThemeType;
  userName: string;
  speechStyle: "casual" | "formal";
  primaryColor: string;
  showRecommendations?: boolean;
  onComplete: (profile: ProbabilityProfile, selections: StorySelectionRecord[]) => void;
}

type Phase = "intro" | "scene" | "continue-prompt" | "outro";

export default function StoryDiscovery({
  theme,
  userName,
  speechStyle,
  primaryColor,
  showRecommendations = true,
  onComplete,
}: Props) {
  const story = getThemeStory(theme);
  const [phase, setPhase] = useState<Phase>("intro");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const selections = useRef<StorySelectionRecord[]>([]);
  const sceneStartTime = useRef(Date.now());
  const outroCompleter = useRef<(() => void) | null>(null);

  const currentScene = story.scenes[sceneIndex];
  const pastMinScenes = sceneIndex >= story.minScenes;
  const hasMoreScenes = sceneIndex < story.scenes.length - 1;

  const finish = useCallback(() => {
    const profile = buildProfileFromStory(
      selections.current,
      userName,
      speechStyle,
      theme
    );
    setPhase("outro");
    outroCompleter.current = () => onComplete(profile, [...selections.current]);
    setTimeout(() => outroCompleter.current?.(), 2500);
  }, [userName, speechStyle, theme, onComplete]);

  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (!currentScene) return;
      const choice = currentScene.choices[choiceIndex];
      const timeMs = Date.now() - sceneStartTime.current;

      selections.current.push({
        sceneId: currentScene.id,
        choiceIndex,
        signals: choice.signals,
        wasRecommended: choice.recommended ?? false,
        timeMs,
      });

      setFadeOut(true);
      setTimeout(() => {
        setFadeOut(false);
        const nextIndex = sceneIndex + 1;

        if (nextIndex >= story.scenes.length) {
          // 마지막 장면
          finish();
        } else if (nextIndex === story.minScenes) {
          // 기본 장면 끝 → 계속할지 물어보기
          sceneStartTime.current = Date.now();
          setSceneIndex(nextIndex);
          setPhase("continue-prompt");
        } else {
          setSceneIndex(nextIndex);
          sceneStartTime.current = Date.now();
        }
      }, 350);
    },
    [currentScene, sceneIndex, story.scenes.length, story.minScenes, finish]
  );

  const handleContinue = useCallback(() => {
    setPhase("scene");
    sceneStartTime.current = Date.now();
  }, []);

  // intro 단계: 첫 장면 이미지 프리로드
  useEffect(() => {
    const firstScene = story.scenes[0];
    if (firstScene?.imagePath) {
      const img = new window.Image();
      img.src = firstScene.imagePath;
    }
  }, [story.scenes]);

  // 다음 2장면 이미지 프리로드
  useEffect(() => {
    const nextScenes = story.scenes.slice(sceneIndex + 1, sceneIndex + 3);
    nextScenes.forEach(scene => {
      if (scene.imagePath) {
        const img = new window.Image();
        img.src = scene.imagePath;
      }
    });
  }, [sceneIndex, story.scenes]);

  // ─── 인트로 ───
  if (phase === "intro") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <SceneCard primaryColor={primaryColor} bgImage={story.bgImage}>
          <p className="text-sm leading-relaxed whitespace-pre-line font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {story.introText}
          </p>
          <button
            onClick={() => {
              setPhase("scene");
              sceneStartTime.current = Date.now();
            }}
            className="w-full py-3 rounded-xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
              border: "1px solid var(--fantasy-gold-dark)",
              color: "var(--fantasy-button-text)",
              boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
            }}
          >
            출발
          </button>
        </SceneCard>
      </div>
    );
  }

  // ─── 아웃트로 ───
  if (phase === "outro") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <SceneCard primaryColor={primaryColor} bgImage={story.bgImage}>
          {story.outroImagePath && (
            <div
              className="rounded-xl overflow-hidden relative"
              style={{ height: 140, border: "1px solid rgba(192,163,116,0.3)" }}
            >
              <Image
                src={story.outroImagePath}
                alt="outro"
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {story.outroNarrative}
          </p>
          <button
            onClick={() => outroCompleter.current?.()}
            className="w-full py-3 rounded-xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
              border: "1px solid var(--fantasy-gold-dark)",
              color: "var(--fantasy-button-text)",
              boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
            }}
          >
            {story.outroButtonText}
          </button>
        </SceneCard>
      </div>
    );
  }

  // ─── 계속할지 물어보기 ───
  if (phase === "continue-prompt") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <SceneCard primaryColor={primaryColor} bgImage={story.bgImage}>
          <p className="text-sm leading-relaxed font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {story.continuePrompt}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 py-3 rounded-xl text-sm font-medium font-rpg transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
                border: "1px solid var(--fantasy-gold-dark)",
                color: "var(--fantasy-button-text)",
                boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
                textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
              }}
            >
              좋아, 계속!
            </button>
            <button
              onClick={finish}
              className="flex-1 py-3 rounded-xl text-sm font-medium font-rpg transition-all border active:scale-[0.98]"
              style={{
                background: "rgba(26,22,18,0.7)",
                borderColor: "rgba(192,163,116,0.35)",
                color: "var(--fantasy-text)",
              }}
            >
              {story.startPrompt}
            </button>
          </div>
        </SceneCard>
      </div>
    );
  }

  // ─── 장면 진행 ───
  if (!currentScene) return null;

  const progress = (sceneIndex + 1) / story.scenes.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <SceneCard primaryColor={primaryColor} bgImage={story.bgImage}>
        <div
          className={`space-y-4 transition-opacity duration-300 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* 진행 바 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(192,163,116,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%`, background: primaryColor }}
              />
            </div>
            <span className="text-[10px] opacity-60" style={{ color: "rgba(192,167,136,1)" }}>
              {sceneIndex + 1}/{story.scenes.length}
            </span>
          </div>

          {/* 일러스트 영역 */}
          <div
            className="rounded-xl overflow-hidden relative"
            style={{
              height: 140,
              background: `linear-gradient(to bottom, rgba(26,22,18,0.5), rgba(13,11,8,0.8))`,
              border: "1px solid rgba(192,163,116,0.2)",
            }}
          >
            {currentScene.imagePath ? (
              <Image
                src={currentScene.imagePath}
                alt={currentScene.illustration}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                style={{ objectFit: "cover" }}
                priority={sceneIndex === 0}
              />
            ) : (
              <div className="flex items-end justify-center h-full p-3">
                <p className="text-[11px] text-white/25 text-center italic">
                  {currentScene.illustration}
                </p>
              </div>
            )}
          </div>

          {/* 나레이션 */}
          <p className="text-sm leading-relaxed whitespace-pre-line font-rpg" style={{ color: "var(--fantasy-text)" }}>
            {currentScene.narrative}
          </p>

          {/* 선택지 */}
          <div className="space-y-2">
            {currentScene.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                className="w-full text-left py-3.5 px-4 rounded-lg text-sm font-rpg transition-all
                           hover:scale-[1.01] active:scale-[0.98] flex items-center gap-3"
                style={{
                  background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
                  border: "1px solid var(--fantasy-gold-dark)",
                  color: "var(--fantasy-button-text)",
                  boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
                  textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
                  animationDelay: `${0.1 + i * 0.1}s`,
                  animation: "stage-fade-in 0.4s ease-out backwards",
                }}
              >
                <span className="text-lg shrink-0">{choice.emoji}</span>
                <span className="flex-1">{choice.label}</span>
                {showRecommendations && choice.recommended && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(192,163,116,0.25)", color: "var(--fantasy-gold-bright)" }}
                  >
                    추천
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 기본 장면 이후: 시작하기 링크 */}
          {pastMinScenes && hasMoreScenes && (
            <button
              onClick={finish}
              className="w-full text-center text-xs transition-colors py-1 font-rpg-sm"
              style={{ color: "rgba(192,163,116,0.4)" }}
            >
              {story.startPrompt} →
            </button>
          )}
        </div>
      </SceneCard>
    </div>
  );
}

// ─── 장면 카드 래퍼 ───
function SceneCard({
  children,
  primaryColor,
  bgImage,
}: {
  children: React.ReactNode;
  primaryColor: string;
  bgImage: string;
}) {
  return (
    <div
      className="rounded-xl p-5 space-y-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, var(--fantasy-card), var(--fantasy-card-deep))`,
        border: `1.5px solid var(--fantasy-gold)`,
        boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(241,225,197,0.15), 0 8px 24px rgba(0,0,0,0.9)`,
      }}
    >
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 opacity-[0.15] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* 양피지 텍스처 — CSS gradient (SVG feTurbulence 금지) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0, rgba(192,167,136,0.03) 1px, transparent 2px)",
          backgroundSize: "4px 4px",
        }}
      />
      {/* 상단 금색 라인 */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(192,163,116,0.6), transparent)" }}
      />
      {/* 하단 금색 라인 */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(192,163,116,0.3), transparent)" }}
      />
      <div className="relative z-10 space-y-4">{children}</div>
    </div>
  );
}
