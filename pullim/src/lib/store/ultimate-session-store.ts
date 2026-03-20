import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  UltimateSession,
  UltimateMessage,
  ThemeName,
  CharacterName,
  StageName,
  CrystalName,
  CrystalAnalysis,
  Disagreement,
  DebateRound,
  ResearchOutput,
  ConclusionData,
  ActionCommitment,
  ConcernType,
  RoutingScores,
  ModelProvider,
  CrystalBalance,
} from "../types-ultimate";

function createSession(theme: ThemeName, character: CharacterName): UltimateSession {
  return {
    id: nanoid(12),
    userId: null,
    character,
    theme,
    currentStage: "ENTER",
    concernType: null,
    routingScores: null,
    recommendedCrystals: [],
    selectedCrystals: [],
    crystalModelMap: {},
    research: null,
    crystalAnalyses: [],
    disagreements: [],
    debateRounds: [],
    conclusion: null,
    actionCommitment: null,
    crisisLevel: "GREEN",
    listenSummary: null,
    userName: null,
    crystalsUsed: 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

function getWeekResetDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.toISOString();
}

function createDefaultBalance(isPaid: boolean): CrystalBalance {
  return {
    weeklyLimit: isPaid ? 50 : 10,
    weeklyUsed: 0,
    weekResetAt: getWeekResetDate(),
    sessionUsed: 0,
  };
}

interface UltimateSessionStore {
  sessions: Record<string, UltimateSession>;
  messages: Record<string, UltimateMessage[]>;
  crystalBalance: CrystalBalance;

  // 세션 생성/조회
  createSession(theme: ThemeName, character: CharacterName): string;
  getSession(id: string): UltimateSession | undefined;
  getSessionCount(): number;

  // 단계 진행
  setStage(id: string, stage: StageName): void;
  setUserName(id: string, name: string): void;

  // 라우팅
  setRouting(
    id: string,
    concernType: ConcernType,
    scores: RoutingScores,
    recommendedCrystals: CrystalName[]
  ): void;

  // 듣기
  setListenSummary(id: string, summary: string): void;

  // 리서치
  setResearch(id: string, data: ResearchOutput): void;

  // 구슬
  setSelectedCrystals(id: string, crystals: CrystalName[]): void;
  setCrystalModelMap(id: string, map: Partial<Record<CrystalName, ModelProvider>>): void;
  setCrystalAnalyses(id: string, analyses: CrystalAnalysis[]): void;
  setDisagreements(id: string, points: Disagreement[]): void;

  // 토론
  setDebateRounds(id: string, rounds: DebateRound[]): void;

  // 결론
  setConclusion(id: string, data: ConclusionData): void;
  setActionCommitment(id: string, commitment: ActionCommitment): void;

  // 위기
  setCrisisLevel(id: string, level: "GREEN" | "YELLOW" | "RED"): void;

  // 메시지
  addMessage(id: string, msg: UltimateMessage): void;

  // 구슬 잔액
  spendCrystals(id: string, amount: number): boolean;
  addCrystals(amount: number): void;
  getCrystalBalance(): CrystalBalance;

  // 완료
  completeSession(id: string): void;
}

export const useUltimateSessionStore = create<UltimateSessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      messages: {},
      crystalBalance: createDefaultBalance(false),

      createSession(theme, character) {
        const session = createSession(theme, character);
        set((s) => ({
          sessions: { ...s.sessions, [session.id]: session },
          messages: { ...s.messages, [session.id]: [] },
        }));
        return session.id;
      },

      getSession(id) {
        return get().sessions[id];
      },

      getSessionCount() {
        return Object.keys(get().sessions).length;
      },

      setStage(id, stage) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], currentStage: stage },
          },
        }));
      },

      setUserName(id, name) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], userName: name },
          },
        }));
      },

      setRouting(id, concernType, scores, recommendedCrystals) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: {
              ...s.sessions[id],
              concernType,
              routingScores: scores,
              recommendedCrystals,
            },
          },
        }));
      },

      setListenSummary(id, summary) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], listenSummary: summary },
          },
        }));
      },

      setResearch(id, data) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], research: data },
          },
        }));
      },

      setSelectedCrystals(id, crystals) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], selectedCrystals: crystals },
          },
        }));
      },

      setCrystalModelMap(id, map) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], crystalModelMap: map },
          },
        }));
      },

      setCrystalAnalyses(id, analyses) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], crystalAnalyses: analyses },
          },
        }));
      },

      setDisagreements(id, points) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], disagreements: points },
          },
        }));
      },

      setDebateRounds(id, rounds) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], debateRounds: rounds },
          },
        }));
      },

      setConclusion(id, data) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], conclusion: data },
          },
        }));
      },

      setActionCommitment(id, commitment) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], actionCommitment: commitment },
          },
        }));
      },

      setCrisisLevel(id, level) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: { ...s.sessions[id], crisisLevel: level },
          },
        }));
      },

      addMessage(id, msg) {
        set((s) => ({
          messages: {
            ...s.messages,
            [id]: [...(s.messages[id] || []), msg],
          },
        }));
      },

      spendCrystals(id, amount) {
        const balance = get().crystalBalance;
        // 주간 리셋 체크
        if (new Date() >= new Date(balance.weekResetAt)) {
          set({ crystalBalance: createDefaultBalance(balance.weeklyLimit === 50) });
          return get().crystalBalance.weeklyUsed + amount <= get().crystalBalance.weeklyLimit;
        }
        if (balance.weeklyUsed + amount > balance.weeklyLimit) return false;
        set((s) => ({
          crystalBalance: {
            ...s.crystalBalance,
            weeklyUsed: s.crystalBalance.weeklyUsed + amount,
          },
          sessions: {
            ...s.sessions,
            [id]: {
              ...s.sessions[id],
              crystalsUsed: (s.sessions[id]?.crystalsUsed ?? 0) + amount,
            },
          },
        }));
        return true;
      },

      addCrystals(amount) {
        set((s) => ({
          crystalBalance: {
            ...s.crystalBalance,
            weeklyUsed: Math.max(0, s.crystalBalance.weeklyUsed - amount),
          },
        }));
      },

      getCrystalBalance() {
        const balance = get().crystalBalance;
        if (new Date() >= new Date(balance.weekResetAt)) {
          const newBalance = createDefaultBalance(balance.weeklyLimit === 50);
          set({ crystalBalance: newBalance });
          return newBalance;
        }
        return balance;
      },

      completeSession(id) {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [id]: {
              ...s.sessions[id],
              currentStage: "COMPLETE" as StageName,
              completedAt: new Date().toISOString(),
            },
          },
        }));
      },
    }),
    {
      name: "pullim-ultimate-sessions",
    }
  )
);
