"use client";

import { useState } from "react";
import ThemedBackground from "@/components/ultimate/backgrounds/ThemedBackground";
import StageIndicator from "@/components/ultimate/StageIndicator";
import CharacterDialogue from "@/components/ultimate/CharacterDialogue";
import CrystalSelector from "@/components/ultimate/CrystalSelector";
import DataCardList from "@/components/ultimate/DataCardList";
import CrystalAnalysisView from "@/components/ultimate/CrystalAnalysisView";
import ConclusionView from "@/components/ultimate/ConclusionView";
import LoadingOverlay from "@/components/ultimate/LoadingOverlay";
import SelectionButtons from "@/components/ultimate/SelectionButtons";
import ChatInput from "@/components/ChatInput";
import { THEMES, getTheme } from "@/lib/themes";
import { ThemeName, StageName, CrystalAnalysis, Disagreement, ConclusionData } from "@/lib/types-ultimate";

const THEME_NAMES: ThemeName[] = ["모험가", "전략실", "달빛정원"];

const MOCK_DATA_CARDS = [
  { title: "📊 1인 AI SaaS 생존율", fact: "3년 생존율 약 37%", source: { name: "중소벤처기업부, 2025", url: "" }, confidence: "high" as const },
  { title: "💰 구독 서비스 평균 단가", fact: "월 7,000~15,000원", source: { name: "Statista, 2025", url: "" }, confidence: "medium" as const },
  { title: "👥 AI 코칭 이용 의향", fact: "응답자의 48%가 긍정적", source: { name: "한국갤럽, 2025", url: "" }, confidence: "high" as const },
];

const MOCK_ANALYSES: CrystalAnalysis[] = [
  { crystal: "금화", model: "claude", observation: "실패 시 손실: 최대 500만원. 기회비용: 취업했으면 연 3,000만원.", insight: "리스크 대비 학습 가치가 높은 시기", risk: "자본 소진", question: "최악의 시나리오를 감당할 수 있는가?", latencyMs: 1200 },
  { crystal: "나침반", model: "gpt", observation: "시나리오 A: 창업 지속 → 12개월 뒤 시장 검증. 시나리오 B: 취업 전환 → 안정적 수입.", insight: "두 길 모두 되돌릴 수 있다", risk: "시간 기회비용", question: "어떤 시나리오가 더 후회될까?", latencyMs: 980 },
  { crystal: "거울", model: "gemini", observation: "'목숨을 걸어도 되냐'는 이미 답을 정한 질문이다.", insight: "확증 편향 가능성 있음", risk: "자기합리화", question: "반대 의견을 진심으로 고려했는가?", latencyMs: 1100 },
];

const MOCK_DISAGREEMENTS: Disagreement[] = [
  {
    topic: "리스크 해석",
    positions: [
      { crystal: "금화", model: "claude", stance: "재무적 리스크가 크다" },
      { crystal: "거울", model: "gemini", stance: "안 하는 게 더 큰 리스크" },
    ],
    severity: "major",
    userImplication: "금화는 '리스크'를, 거울은 '안 하는 게 리스크'를 말합니다. 이것이 핵심 갈림길입니다.",
  },
];

const MOCK_CONCLUSION: ConclusionData = {
  situationSummary: "자네는 AI 창업이라는 갈림길에 서 있네. 재무적으로는 리스크가 있으나, 내면적으로는 이미 방향을 정한 듯하군.",
  options: [
    { direction: "창업 지속", risk: "최대 500만원 손실", reward: "시장 검증 + 성장" },
    { direction: "취업 전환", risk: "후회 가능성", reward: "안정적 수입" },
  ],
  keyCrossroad: "리스크 감수 vs 안정 추구",
  userTendency: "변화를 선호하는 성향",
};

const STAGES: StageName[] = ["ENTER", "LISTEN", "RESEARCH", "CRYSTAL_SELECT", "CONCLUDE"];

export default function PreviewPage() {
  const [themeName, setThemeName] = useState<ThemeName>("모험가");
  const [currentStage, setCurrentStage] = useState<StageName>("CRYSTAL_SELECT");

  const theme = getTheme(themeName);

  return (
    <div className="min-h-screen relative">
      <ThemedBackground theme={theme} />

      {/* 헤더 */}
      <header className="px-4 py-3 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{theme.icon}</span>
          <span className="text-sm font-rpg text-white/60">{theme.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-rpg-sm">PREVIEW</span>
        </div>
      </header>

      {/* 테마 전환 */}
      <div className="relative z-10 px-4 py-1 flex gap-2">
        {THEME_NAMES.map((t) => (
          <button
            key={t}
            onClick={() => setThemeName(t)}
            className={`text-[11px] px-3 py-1.5 rounded-full font-rpg-sm transition-all ${
              themeName === t
                ? "bg-white/15 text-white/90 border border-white/20"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {THEMES[t].icon} {t}
          </button>
        ))}
      </div>

      {/* 스테이지 선택 */}
      <div className="relative z-10 px-4 py-1 flex gap-1.5 flex-wrap">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setCurrentStage(s)}
            className={`text-[10px] px-2 py-1 rounded font-rpg-sm transition-all ${
              currentStage === s
                ? "rpg-button"
                : "rpg-button-ghost"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 스테이지 인디케이터 */}
      <div className="relative z-10">
        <StageIndicator currentStage={currentStage} primaryColor={theme.colors.primary} />
      </div>

      {/* 컨텐츠 */}
      <main className="relative z-10 px-4 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
        <div className="flex flex-col gap-4 max-w-lg mx-auto">

          {/* 캐릭터 대사 */}
          <CharacterDialogue
            character={theme.character}
            text={theme.labels.enter}
            primaryColor={theme.colors.primary}
            avatarSrc={theme.assets.avatar}
          />

          {/* 사용자 메시지 */}
          <div className="self-end max-w-[80%]">
            <div className="rpg-panel-light rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white/90 font-rpg">
              창업을 계속해야 할지 고민이에요.
            </div>
          </div>

          {/* 타이핑 인디케이터 */}
          <CharacterDialogue
            character={theme.character}
            text=""
            primaryColor={theme.colors.primary}
            avatarSrc={theme.assets.avatar}
            typing
          />

          {/* 로딩 오버레이 — 스테이지별 */}
          {currentStage === "LISTEN" && (
            <div className="flex flex-col gap-4">
              <p className="text-[11px] text-white/40 text-center font-rpg-sm">로딩 4종 미리보기</p>
              <LoadingOverlay stage="research" primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
              <LoadingOverlay stage="analyze" primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
              <LoadingOverlay stage="debate" primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
              <LoadingOverlay stage="conclude" primaryColor={theme.colors.primary} crystalLabel={theme.crystalLabel} character={theme.character} />
            </div>
          )}

          {/* 데이터 카드 */}
          {(currentStage === "RESEARCH" || currentStage === "CRYSTAL_SELECT") && (
            <>
              <CharacterDialogue
                character={theme.character}
                text={theme.character === "현자" ? "세상의 기록을 살펴보았네." : theme.character === "비서" ? "관련 데이터를 조회했습니다." : "이런 이야기들이 있었어요."}
                primaryColor={theme.colors.primary}
                avatarSrc={theme.assets.avatar}
              />
              <DataCardList
                cards={MOCK_DATA_CARDS}
                primaryColor={theme.colors.primary}
                onSelect={() => {}}
              />
            </>
          )}

          {/* 구슬 선택 */}
          {currentStage === "CRYSTAL_SELECT" && (
            <>
              <CharacterDialogue
                character={theme.character}
                text={theme.character === "현자" ? "어떤 눈으로 세상을 보고 싶은가?" : theme.character === "비서" ? "어떤 관점으로 분석할까요?" : "어떤 마음으로 들여다볼까요?"}
                primaryColor={theme.colors.primary}
                avatarSrc={theme.assets.avatar}
              />
              <CrystalSelector
                max={3}
                crystalLabel={theme.crystalLabel}
                crystalShape={theme.crystalShape}
                primaryColor={theme.colors.primary}
                onConfirm={() => {}}
              />
            </>
          )}

          {/* 선택지 버튼 */}
          {currentStage === "RESEARCH" && (
            <SelectionButtons
              options={["좀 더 이야기하고 싶어요", "이 정도면 충분해요", "다른 관점도 보고 싶어요"]}
              onSelect={() => {}}
              primaryColor={theme.colors.primary}
              onCustomInput={() => {}}
            />
          )}

          {/* 구슬 분석 + 불일치 + 결론 */}
          {currentStage === "CONCLUDE" && (
            <>
              <CrystalAnalysisView
                analyses={MOCK_ANALYSES}
                disagreements={MOCK_DISAGREEMENTS}
                primaryColor={theme.colors.primary}
                crystalLabel={theme.crystalLabel}
              />

              <CharacterDialogue
                character={theme.character}
                text={theme.labels.tagline}
                primaryColor={theme.colors.primary}
                avatarSrc={theme.assets.avatar}
              />

              <ConclusionView
                conclusion={MOCK_CONCLUSION}
                tagline={theme.labels.tagline}
                farewell={theme.labels.farewell}
                primaryColor={theme.colors.primary}
                onCommit={() => {}}
              />
            </>
          )}
        </div>
      </main>

      {/* 입력창 */}
      <div className="relative z-10">
        <ChatInput
          onSend={() => {}}
          dark
          placeholder="고민을 이야기해보세요..."
        />
      </div>
    </div>
  );
}
