import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  V2Session,
  V2StageName,
  ExpertName,
  ExpertAnalysis,
  DebateRound,
  CrisisLevel,
  ConcernType,
  RoutingScoresV2,
} from "../types-v2";

// Listen 단계 메시지
export interface V2Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  options?: string[]; // 선택지 버튼용
}

// V2 세션에 리포트 데이터 포함
export interface V2Report {
  concern: string;
  situation: string;
  real_question: string;
  expert_summaries: { name: string; summary: string; question: string }[];
  debate_synthesis: string;
  new_discovery: string;
  options: { direction: string; expected_outcome: string }[];
  chosen_action: string;
  emotional_checkin: string;
}

function createV2Session(): V2Session {
  return {
    id: nanoid(12),
    user_id: null,
    mode: null,
    current_stage: "ROUTING",
    concern_type: null,
    routing_scores: null,
    recommended_experts: [],
    selected_experts: [],
    expert_analyses: [],
    debate_rounds: [],
    crisis_level: "GREEN",
    tone_setting: "해요체",
    listen_summary: null,
    debate_user_context: null,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

interface V2SessionStore {
  v2Sessions: Record<string, V2Session>;
  v2ActiveSessionId: string | null;
  v2Messages: Record<string, V2Message[]>; // sessionId -> messages
  v2Reports: Record<string, V2Report>; // sessionId -> report
  v2DebateSynthesis: Record<string, string>; // sessionId -> synthesis text

  // Actions
  createV2Session: () => string;
  getActiveV2Session: () => V2Session | null;
  setActiveV2Session: (id: string | null) => void;

  // Routing
  setV2Routing: (
    sessionId: string,
    concernType: ConcernType,
    scores: RoutingScoresV2,
    recommendedExperts: ExpertName[]
  ) => void;

  // Stage management
  setV2Stage: (sessionId: string, stage: V2StageName | "ROUTING" | "COMPLETE") => void;

  // Listen
  addV2Message: (sessionId: string, message: V2Message) => void;
  setListenSummary: (sessionId: string, summary: string) => void;

  // Expert select
  setSelectedExperts: (sessionId: string, experts: ExpertName[]) => void;

  // Analyze
  setExpertAnalyses: (sessionId: string, analyses: ExpertAnalysis[]) => void;

  // Debate
  setDebateRounds: (sessionId: string, rounds: DebateRound[]) => void;
  setDebateSynthesis: (sessionId: string, synthesis: string) => void;

  // Crisis
  setCrisisLevel: (sessionId: string, level: CrisisLevel) => void;

  // Debate user context
  setDebateUserContext: (sessionId: string, context: string | null) => void;

  // Land
  setV2Report: (sessionId: string, report: V2Report) => void;

  // Complete
  completeV2Session: (sessionId: string) => void;

  // Back navigation: clear data from a given stage onwards
  resetFromStage: (sessionId: string, stage: V2StageName) => void;

  // Count
  getV2SessionCount: () => number;
}

export const useV2SessionStore = create<V2SessionStore>()(
  persist(
    (set, get) => ({
      v2Sessions: {},
      v2ActiveSessionId: null,
      v2Messages: {},
      v2Reports: {},
      v2DebateSynthesis: {},

      createV2Session: () => {
        const session = createV2Session();
        set((state) => ({
          v2Sessions: { ...state.v2Sessions, [session.id]: session },
          v2ActiveSessionId: session.id,
          v2Messages: { ...state.v2Messages, [session.id]: [] },
        }));
        return session.id;
      },

      getActiveV2Session: () => {
        const { v2Sessions, v2ActiveSessionId } = get();
        if (!v2ActiveSessionId) return null;
        return v2Sessions[v2ActiveSessionId] || null;
      },

      setActiveV2Session: (id) => {
        set({ v2ActiveSessionId: id });
      },

      setV2Routing: (sessionId, concernType, scores, recommendedExperts) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: {
                ...session,
                concern_type: concernType,
                routing_scores: scores,
                recommended_experts: recommendedExperts,
                selected_experts: recommendedExperts,
                current_stage: "LISTEN" as V2StageName,
              },
            },
          };
        });
      },

      setV2Stage: (sessionId, stage) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, current_stage: stage },
            },
          };
        });
      },

      addV2Message: (sessionId, message) => {
        set((state) => ({
          v2Messages: {
            ...state.v2Messages,
            [sessionId]: [...(state.v2Messages[sessionId] || []), message],
          },
        }));
      },

      setListenSummary: (sessionId, summary) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, listen_summary: summary },
            },
          };
        });
      },

      setSelectedExperts: (sessionId, experts) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, selected_experts: experts },
            },
          };
        });
      },

      setExpertAnalyses: (sessionId, analyses) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, expert_analyses: analyses },
            },
          };
        });
      },

      setDebateRounds: (sessionId, rounds) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, debate_rounds: rounds },
            },
          };
        });
      },

      setDebateSynthesis: (sessionId, synthesis) => {
        set((state) => ({
          v2DebateSynthesis: {
            ...state.v2DebateSynthesis,
            [sessionId]: synthesis,
          },
        }));
      },

      setCrisisLevel: (sessionId, level) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, crisis_level: level },
            },
          };
        });
      },

      setV2Report: (sessionId, report) => {
        set((state) => ({
          v2Reports: {
            ...state.v2Reports,
            [sessionId]: report,
          },
        }));
      },

      setDebateUserContext: (sessionId, context) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, debate_user_context: context },
            },
          };
        });
      },

      resetFromStage: (sessionId, stage) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;

          // Stage ordering for clearing downstream data
          const stageOrder: (V2StageName | "ROUTING" | "COMPLETE")[] = [
            "ROUTING", "LISTEN", "EXPERT_SELECT", "ANALYZE", "DEBATE", "LAND", "COMPLETE",
          ];
          const stageIdx = stageOrder.indexOf(stage);

          const updates: Partial<V2Session> = {
            current_stage: stage,
          };

          // Clear data from that stage onwards
          if (stageIdx <= stageOrder.indexOf("EXPERT_SELECT")) {
            updates.selected_experts = session.recommended_experts;
            updates.expert_analyses = [];
            updates.debate_rounds = [];
            updates.debate_user_context = null;
          }
          if (stageIdx <= stageOrder.indexOf("ANALYZE")) {
            updates.expert_analyses = [];
            updates.debate_rounds = [];
            updates.debate_user_context = null;
          }
          if (stageIdx <= stageOrder.indexOf("DEBATE")) {
            updates.debate_rounds = [];
          }

          // Also clear debate synthesis if going back past DEBATE
          const newDebateSynthesis = { ...state.v2DebateSynthesis };
          if (stageIdx <= stageOrder.indexOf("DEBATE")) {
            delete newDebateSynthesis[sessionId];
          }

          // Clear report if going back past LAND
          const newReports = { ...state.v2Reports };
          if (stageIdx <= stageOrder.indexOf("LAND")) {
            delete newReports[sessionId];
          }

          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: { ...session, ...updates },
            },
            v2DebateSynthesis: newDebateSynthesis,
            v2Reports: newReports,
          };
        });
      },

      completeV2Session: (sessionId) => {
        set((state) => {
          const session = state.v2Sessions[sessionId];
          if (!session) return state;
          return {
            v2Sessions: {
              ...state.v2Sessions,
              [sessionId]: {
                ...session,
                current_stage: "COMPLETE",
                completed_at: new Date().toISOString(),
              },
            },
          };
        });
      },

      getV2SessionCount: () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return Object.values(get().v2Sessions).filter(
          (s) => new Date(s.created_at) >= monthStart
        ).length;
      },
    }),
    {
      name: "pullim-v2-sessions",
      skipHydration: true,
    }
  )
);
