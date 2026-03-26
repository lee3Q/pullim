// 양방향 사다리 세션 Zustand 스토어

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  LadderLevel,
  EntryMode,
  LadderMessage,
  LadderOption,
  BehindEvent,
  LadderSessionState,
} from "./ladder-types";

interface LadderActions {
  // 세션 초기화
  initSession: (params: {
    theme: LadderSessionState["theme"];
    entryMode: EntryMode;
    startLevel: LadderLevel;
  }) => void;

  // 메시지 추가
  addMessage: (msg: Omit<LadderMessage, "id" | "timestamp">) => void;

  // 레벨 변경
  setLevel: (level: LadderLevel) => void;

  // 이면 이벤트 기록
  recordEvent: (event: Omit<BehindEvent, "timestamp">) => void;

  // 턴 증가
  incrementTurn: () => void;

  // 세션 종료
  endSession: (summary: string) => void;

  // 리셋
  reset: () => void;
}

const initialState: LadderSessionState = {
  sessionId: "",
  theme: "모험가",
  entryMode: "concern",
  currentLevel: 4,
  messages: [],
  turnCount: 0,
  behindEvents: [],
  isEnded: false,
  summary: null,
};

export const useLadderStore = create<LadderSessionState & LadderActions>(
  (set, get) => ({
    ...initialState,

    initSession: ({ theme, entryMode, startLevel }) => {
      set({
        ...initialState,
        sessionId: nanoid(12),
        theme,
        entryMode,
        currentLevel: startLevel,
      });
    },

    addMessage: (msg) => {
      set((s) => ({
        messages: [
          ...s.messages,
          { ...msg, id: nanoid(8), timestamp: Date.now() },
        ],
      }));
    },

    setLevel: (level) => {
      const prev = get().currentLevel;
      if (prev !== level) {
        set((s) => ({
          currentLevel: level,
          behindEvents: [
            ...s.behindEvents,
            {
              type: "level_change",
              level,
              timestamp: Date.now(),
              detail: `${prev} → ${level}`,
            },
          ],
        }));
      }
    },

    recordEvent: (event) => {
      set((s) => ({
        behindEvents: [
          ...s.behindEvents,
          { ...event, timestamp: Date.now() },
        ],
      }));
    },

    incrementTurn: () => {
      set((s) => ({ turnCount: s.turnCount + 1 }));
    },

    endSession: (summary) => {
      set({ isEnded: true, summary });
    },

    reset: () => {
      set(initialState);
    },
  })
);
