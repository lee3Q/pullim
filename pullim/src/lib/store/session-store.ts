import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  Session,
  Stage,
  StageName,
  STAGE_ORDER,
  Message,
  ModelType,
  RoutingScores,
  DecisionRecord,
} from "../types";

function createEmptyStages(): Stage[] {
  return STAGE_ORDER.map((name) => ({
    name,
    status: "pending",
    messages: [],
    output: null,
  }));
}

function createSession(inputText: string): Session {
  return {
    id: nanoid(12),
    user_id: "anonymous",
    input_text: inputText,
    model_type: null,
    routing_scores: null,
    routing_explanation: "",
    current_stage: "ROUTING",
    stages: createEmptyStages(),
    decision_record: null,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

interface SessionStore {
  sessions: Record<string, Session>;
  activeSessionId: string | null;

  // Actions
  createSession: (inputText: string) => string;
  getActiveSession: () => Session | null;
  setRouting: (
    sessionId: string,
    modelType: ModelType,
    scores: RoutingScores,
    explanation: string
  ) => void;
  advanceStage: (sessionId: string) => void;
  addMessage: (sessionId: string, stage: StageName, message: Message) => void;
  setDecisionRecord: (sessionId: string, record: DecisionRecord) => void;
  completeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  getSessionCount: () => number;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,

      createSession: (inputText: string) => {
        const session = createSession(inputText);
        set((state) => ({
          sessions: { ...state.sessions, [session.id]: session },
          activeSessionId: session.id,
        }));
        return session.id;
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return null;
        return sessions[activeSessionId] || null;
      },

      setRouting: (sessionId, modelType, scores, explanation) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                model_type: modelType,
                routing_scores: scores,
                routing_explanation: explanation,
                current_stage: "CLARIFY" as StageName,
                stages: session.stages.map((s, i) =>
                  i === 0 ? { ...s, status: "active" as const } : s
                ),
              },
            },
          };
        });
      },

      advanceStage: (sessionId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          const currentIdx = STAGE_ORDER.indexOf(
            session.current_stage as StageName
          );
          if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) {
            return {
              sessions: {
                ...state.sessions,
                [sessionId]: { ...session, current_stage: "COMPLETE" },
              },
            };
          }
          const nextStage = STAGE_ORDER[currentIdx + 1];
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                current_stage: nextStage,
                stages: session.stages.map((s) => {
                  if (s.name === session.current_stage)
                    return { ...s, status: "completed" as const };
                  if (s.name === nextStage)
                    return { ...s, status: "active" as const };
                  return s;
                }),
              },
            },
          };
        });
      },

      addMessage: (sessionId, stage, message) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                stages: session.stages.map((s) =>
                  s.name === stage
                    ? { ...s, messages: [...s.messages, message] }
                    : s
                ),
              },
            },
          };
        });
      },

      setDecisionRecord: (sessionId, record) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...session, decision_record: record },
            },
          };
        });
      },

      completeSession: (sessionId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                current_stage: "COMPLETE",
                completed_at: new Date().toISOString(),
                stages: session.stages.map((s) => ({
                  ...s,
                  status:
                    s.status === "active"
                      ? ("completed" as const)
                      : s.status,
                })),
              },
            },
          };
        });
      },

      setActiveSession: (sessionId) => {
        set({ activeSessionId: sessionId });
      },

      getSessionCount: () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return Object.values(get().sessions).filter(
          (s) => new Date(s.created_at) >= monthStart
        ).length;
      },
    }),
    {
      name: "pullim-sessions",
      skipHydration: true,
    }
  )
);
