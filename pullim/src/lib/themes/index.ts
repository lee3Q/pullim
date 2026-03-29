import { ThemeName, CharacterName, StageName } from "@/lib/types-ultimate";

export interface GameUIStyle {
  dialogueStyle: "letter" | "parchment" | "card" | "default";
  choiceStyle: "petal" | "signpost" | "card" | "default";
  progressStyle: "garden" | "journey" | "analysis" | "default";
  inputLabel: string;
}

export interface SceneConfig {
  gradient: string;
  particle: "stars" | "firefly" | "petal" | "glow" | "none";
  bgImage?: string;
}

export interface Theme {
  name: ThemeName;
  character: CharacterName;
  title: string;
  subtitle: string;
  icon: string;

  colors: {
    bg: string;
    primary: string;
    primaryLight: string;
    card: string;
    cardHover: string;
    cardSelected: string;
    text: string;
    muted: string;
  };

  assets: {
    bg: string;       // 배경 이미지 경로
    avatar: string;   // 캐릭터 아바타 경로
    bgmTracks: { src: string; label: string }[];
  };

  crystalLabel: string; // "수정구슬" | "분석 렌즈" | "꽃봉오리"
  crystalShape: "orb" | "lens" | "bud" | "star";

  labels: {
    enter: string;       // "모험가여," | "어서 오십시오." | "어서 오세요."
    askConcern: string;  // "무슨 바람이 불어 찾아왔는가?" | "안건은?" | "어떤 마음을 가져오셨어요?"
    farewell: string;    // "기다리고 있겠네." | "다음 브리핑에서." | "정원에서 기다릴게요."
    tagline: string;     // "자네는 이미 답을 알고 있지 않은가?"
  };

  route: string; // "/adventure" | "/strategy" | "/garden"
  useCases: string; // 적합 상황 태그

  gameUI?: GameUIStyle;
  scenes?: Partial<Record<StageName, SceneConfig>>;
}

export const CHARACTER_ICONS: Record<CharacterName, string> = {
  현자: "\uD83E\uDD89",
  비서: "\uD83D\uDC31",
  코치: "\uD83D\uDD25",
  친구: "\uD83D\uDC30",
  별지기: "\u2B50",
  동행자: "\u2604\uFE0F",
};

export const THEMES: Record<ThemeName, Theme> = {
  모험가: {
    name: "모험가",
    character: "현자",
    title: "현자의 오두막",
    subtitle: "모닥불 앞에서 갈림길을 들여다보다",
    icon: "🧙",
    colors: {
      bg: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
      primary: "#ff9f1c",
      primaryLight: "rgba(255, 159, 28, 0.15)",
      card: "rgba(255, 255, 255, 0.05)",
      cardHover: "rgba(255, 182, 72, 0.08)",
      cardSelected: "rgba(255, 159, 28, 0.12)",
      text: "#e0e0e0",
      muted: "#888",
    },
    assets: {
      bg: "/assets/campfire-bg.webp",
      avatar: "/assets/sage.webp",
      bgmTracks: [
        { src: "/assets/campfire-bgm.mp3", label: "모닥불 1" },
        { src: "/assets/campfire-bgm-2.mp3", label: "모닥불 2" },
      ],
    },
    crystalLabel: "수정구슬",
    crystalShape: "orb",
    labels: {
      enter: "모험가여, 이곳은 갈림길에 선 자들이 찾아오는 곳일세.",
      askConcern: "오늘은 무슨 바람이 불어 이 모닥불 앞까지 왔는가?",
      farewell: "기다리고 있겠네.",
      tagline: "자네는 이미, 답을 알고 있지 않은가?",
    },
    route: "/adventure",
    useCases: "막막한 갈림길 \u00B7 직관적 결정",

    gameUI: {
      dialogueStyle: "parchment",
      choiceStyle: "signpost",
      progressStyle: "journey",
      inputLabel: "직접 말하기",
    },
    scenes: {
      ENTER: {
        gradient: "from-[#0d1a0d] via-[#1a2e1a] to-[#1a1510]",
        particle: "firefly",
      },
      LISTEN: {
        gradient: "from-[#1a1510] via-[#2a1f15] to-[#1a1510]",
        particle: "stars",
      },
      RESEARCH: {
        gradient: "from-[#141430] via-[#1e1d45] to-[#141430]",
        particle: "glow",
      },
      VERIFY: {
        gradient: "from-[#141430] via-[#1e1d45] to-[#141430]",
        particle: "glow",
      },
      DISCUSS_1: {
        gradient: "from-[#141430] via-[#1e1d45] to-[#141430]",
        particle: "glow",
      },
      CRYSTAL_SELECT: {
        gradient: "from-[#0d1530] via-[#1a1d45] to-[#0d1530]",
        particle: "stars",
      },
      CRYSTAL_ANALYZE: {
        gradient: "from-[#0d1530] via-[#1a1d45] to-[#0d1530]",
        particle: "stars",
      },
      DISCUSS_2: {
        gradient: "from-[#0d1530] via-[#1a1d45] to-[#0d1530]",
        particle: "stars",
      },
      DEBATE: {
        gradient: "from-[#0d1a0d] via-[#1a2e1a] to-[#1a1510]",
        particle: "petal",
      },
      DISCUSS_3: {
        gradient: "from-[#0d1a0d] via-[#1a2e1a] to-[#1a1510]",
        particle: "petal",
      },
      JUDGE: {
        gradient: "from-[#0d1a0d] via-[#1a2e1a] to-[#1a1510]",
        particle: "petal",
      },
      CONCLUDE: {
        gradient: "from-[#2a1525] via-[#2e1a20] to-[#2a1f15]",
        particle: "glow",
      },
      COMPLETE: {
        gradient: "from-[#2a1525] via-[#2e1a20] to-[#2a1f15]",
        particle: "glow",
      },
    },
  },

  전략실: {
    name: "전략실",
    character: "비서",
    title: "전략실",
    subtitle: "데이터로 의사결정을 브리핑하다",
    icon: "🏙️",
    colors: {
      bg: "from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]",
      primary: "#60a5fa",
      primaryLight: "rgba(96, 165, 250, 0.15)",
      card: "rgba(255, 255, 255, 0.03)",
      cardHover: "rgba(96, 165, 250, 0.08)",
      cardSelected: "rgba(96, 165, 250, 0.12)",
      text: "#d0d0d0",
      muted: "#666",
    },
    assets: {
      bg: "/assets/strategy-bg.webp",
      avatar: "/assets/strategy-avatar.webp",
      bgmTracks: [
        { src: "/assets/strategy-bgm.mp3", label: "전략실 1" },
        { src: "/assets/strategy-bgm-2.mp3", label: "전략실 2" },
      ],
    },
    crystalLabel: "전문가 관점",
    crystalShape: "lens",
    labels: {
      enter: "안녕하세요. 의사결정 브리핑을 시작하겠습니다.",
      askConcern: "오늘 다뤄야 할 안건을 말씀해주세요.",
      farewell: "추가 브리핑이 필요하시면 다시 방문해주세요.",
      tagline: "판단은 당신의 몫입니다. 근거는 제가 드렸습니다.",
    },
    route: "/strategy",
    useCases: "데이터 \u00B7 논리 \u00B7 전문가 시각",

    gameUI: {
      dialogueStyle: "card",
      choiceStyle: "card",
      progressStyle: "analysis",
      inputLabel: "메모 추가",
    },
    scenes: {
      ENTER: {
        gradient: "from-[#0a0f1e] via-[#111827] to-[#0a0f1e]",
        particle: "glow",
      },
      LISTEN: {
        gradient: "from-[#0c1225] via-[#15203a] to-[#0c1225]",
        particle: "glow",
      },
      RESEARCH: {
        gradient: "from-[#0a1028] via-[#141e40] to-[#0a1028]",
        particle: "glow",
      },
      VERIFY: {
        gradient: "from-[#0a1028] via-[#141e40] to-[#0a1028]",
        particle: "glow",
      },
      DISCUSS_1: {
        gradient: "from-[#0a1028] via-[#141e40] to-[#0a1028]",
        particle: "glow",
      },
      CRYSTAL_SELECT: {
        gradient: "from-[#0d1030] via-[#181d48] to-[#0d1030]",
        particle: "stars",
      },
      CRYSTAL_ANALYZE: {
        gradient: "from-[#0d1030] via-[#181d48] to-[#0d1030]",
        particle: "stars",
      },
      DISCUSS_2: {
        gradient: "from-[#0d1030] via-[#181d48] to-[#0d1030]",
        particle: "stars",
      },
      DEBATE: {
        gradient: "from-[#0e1225] via-[#1a1e35] to-[#0e1225]",
        particle: "glow",
      },
      DISCUSS_3: {
        gradient: "from-[#0e1225] via-[#1a1e35] to-[#0e1225]",
        particle: "glow",
      },
      JUDGE: {
        gradient: "from-[#0e1225] via-[#1a1e35] to-[#0e1225]",
        particle: "glow",
      },
      CONCLUDE: {
        gradient: "from-[#0c1530] via-[#152040] to-[#10182e]",
        particle: "glow",
      },
      COMPLETE: {
        gradient: "from-[#0c1530] via-[#152040] to-[#10182e]",
        particle: "glow",
      },
    },
  },

  달빛정원: {
    name: "달빛정원",
    character: "친구",
    title: "달빛정원",
    subtitle: "꽃봉오리가 마음을 비추다",
    icon: "🌿",
    colors: {
      bg: "from-[#0f1729] via-[#1a2744] to-[#0f1729]",
      primary: "#a78bfa",
      primaryLight: "rgba(167, 139, 250, 0.15)",
      card: "rgba(167, 139, 250, 0.04)",
      cardHover: "rgba(167, 139, 250, 0.08)",
      cardSelected: "rgba(167, 139, 250, 0.12)",
      text: "#d4d4e0",
      muted: "#777",
    },
    assets: {
      bg: "/assets/garden-bg.webp",
      avatar: "/assets/garden-avatar.webp",
      bgmTracks: [
        { src: "/assets/garden-bgm.mp3", label: "달빛정원 1" },
        { src: "/assets/garden-bgm-2.mp3", label: "달빛정원 2" },
      ],
    },
    crystalLabel: "꽃봉오리",
    crystalShape: "bud",
    labels: {
      enter: "여기는 마음의 정원이에요.",
      askConcern: "오늘은 어떤 마음을 가지고 오셨어요?",
      farewell: "정원에서 기다리고 있을게요.",
      tagline: "이 정원에 심은 씨앗은, 당신만 키울 수 있어요.",
    },
    route: "/garden",
    useCases: "감정 정리 \u00B7 마음 돌봄",

    gameUI: {
      dialogueStyle: "letter",
      choiceStyle: "petal",
      progressStyle: "garden",
      inputLabel: "마음 적기",
    },
    scenes: {
      ENTER: {
        gradient: "from-[#0d0d2b] via-[#151540] to-[#0d0d2b]",
        particle: "stars",
      },
      LISTEN: {
        gradient: "from-[#141433] via-[#1e2550] to-[#141433]",
        particle: "firefly",
      },
      RESEARCH: {
        gradient: "from-[#1a1440] via-[#251d55] to-[#1a1440]",
        particle: "petal",
      },
      VERIFY: {
        gradient: "from-[#1a1440] via-[#251d55] to-[#1a1440]",
        particle: "petal",
      },
      DISCUSS_1: {
        gradient: "from-[#1a1440] via-[#251d55] to-[#1a1440]",
        particle: "petal",
      },
      CRYSTAL_SELECT: {
        gradient: "from-[#1e1545] via-[#2a1d50] to-[#1e1545]",
        particle: "glow",
      },
      CRYSTAL_ANALYZE: {
        gradient: "from-[#1e1545] via-[#2a1d50] to-[#1e1545]",
        particle: "glow",
      },
      DISCUSS_2: {
        gradient: "from-[#1e1545] via-[#2a1d50] to-[#1e1545]",
        particle: "glow",
      },
      DEBATE: {
        gradient: "from-[#1a0f3a] via-[#2d1850] to-[#1a0f3a]",
        particle: "firefly",
      },
      DISCUSS_3: {
        gradient: "from-[#1a0f3a] via-[#2d1850] to-[#1a0f3a]",
        particle: "firefly",
      },
      JUDGE: {
        gradient: "from-[#1a0f3a] via-[#2d1850] to-[#1a0f3a]",
        particle: "firefly",
      },
      CONCLUDE: {
        gradient: "from-[#1e1540] via-[#2a1f4a] to-[#2a1a3a]",
        particle: "glow",
      },
      COMPLETE: {
        gradient: "from-[#1e1540] via-[#2a1f4a] to-[#2a1a3a]",
        particle: "glow",
      },
    },
  },

  천문대: {
    name: "천문대",
    character: "별지기",
    title: "천문대",
    subtitle: "밤하늘 아래 방향을 찾는 시간",
    icon: "🔭",
    colors: {
      bg: "from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]",
      primary: "#fbbf24",
      primaryLight: "rgba(251, 191, 36, 0.15)",
      card: "rgba(251, 191, 36, 0.04)",
      cardHover: "rgba(251, 191, 36, 0.08)",
      cardSelected: "rgba(251, 191, 36, 0.12)",
      text: "#e0e0f0",
      muted: "#7c7c99",
    },
    assets: {
      bg: "/assets/stargazer-enter-bg.png",
      avatar: "/assets/stargazer-avatar.png",
      bgmTracks: [
        { src: "/assets/stargazer-bgm.mp3", label: "천문대 1" },
        { src: "/assets/stargazer-bgm-2.mp3", label: "천문대 2" },
      ],
    },
    crystalLabel: "별의 조각",
    crystalShape: "star",
    labels: {
      enter: "어서 오세요. 별이 잘 보이는 밤이에요.",
      askConcern: "오늘 밤, 어떤 방향을 찾고 싶으세요?",
      farewell: "밤하늘은 늘 여기 있을게요.",
      tagline: "어디로 가야 할지 모르겠어도, 별은 항상 있어요.",
    },
    route: "/stargazer",
    useCases: "방향 \u00B7 꿈 \u00B7 가능성 탐색",

    gameUI: {
      dialogueStyle: "letter",
      choiceStyle: "petal",
      progressStyle: "journey",
      inputLabel: "별에게 말하기",
    },
    scenes: {
      ENTER: {
        gradient: "from-[#0d0d2e] via-[#1e1b4b] to-[#0d0d2e]",
        particle: "stars",
      },
      LISTEN: {
        gradient: "from-[#1a1840] via-[#252260] to-[#1a1840]",
        particle: "stars",
      },
      RESEARCH: {
        gradient: "from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]",
        particle: "glow",
      },
      VERIFY: {
        gradient: "from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]",
        particle: "glow",
      },
      DISCUSS_1: {
        gradient: "from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]",
        particle: "glow",
      },
      CRYSTAL_SELECT: {
        gradient: "from-[#1a1840] via-[#2e2b70] to-[#1a1840]",
        particle: "stars",
      },
      CRYSTAL_ANALYZE: {
        gradient: "from-[#1a1840] via-[#2e2b70] to-[#1a1840]",
        particle: "stars",
      },
      DISCUSS_2: {
        gradient: "from-[#1a1840] via-[#2e2b70] to-[#1a1840]",
        particle: "stars",
      },
      DEBATE: {
        gradient: "from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]",
        particle: "glow",
      },
      DISCUSS_3: {
        gradient: "from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]",
        particle: "glow",
      },
      JUDGE: {
        gradient: "from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]",
        particle: "glow",
      },
      CONCLUDE: {
        gradient: "from-[#1a1535] via-[#28224a] to-[#1a1a35]",
        particle: "stars",
      },
      COMPLETE: {
        gradient: "from-[#1a1535] via-[#28224a] to-[#1a1a35]",
        particle: "stars",
      },
    },
  },
  종말: {
    name: "종말",
    character: "동행자",
    title: "종말",
    subtitle: "세상이 끝난 뒤, 남은 것들을 마주하다",
    icon: "☄️",
    colors: {
      bg: "from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a]",
      primary: "#f97316",
      primaryLight: "rgba(249, 115, 22, 0.15)",
      card: "rgba(249, 115, 22, 0.04)",
      cardHover: "rgba(249, 115, 22, 0.08)",
      cardSelected: "rgba(249, 115, 22, 0.12)",
      text: "#e8d8d0",
      muted: "#8a7068",
    },
    assets: {
      bg: "/assets/apocalypse-enter-bg.png",
      avatar: "/assets/apocalypse-avatar.png",
      bgmTracks: [
        { src: "/assets/apocalypse-bgm.mp3", label: "종말 1" },
      ],
    },
    crystalLabel: "잿빛 조각",
    crystalShape: "orb",
    labels: {
      enter: "여기까지 왔구나. 같이 걷자.",
      askConcern: "이 세상에서 뭘 찾고 싶어?",
      farewell: "내일 해가 뜨면 다시 만나자.",
      tagline: "끝이라고 생각했는데, 옆에 사람이 있었어.",
    },
    route: "/apocalypse",
    useCases: "극한 속 감성 · 관계 · 의미",

    gameUI: {
      dialogueStyle: "parchment",
      choiceStyle: "signpost",
      progressStyle: "journey",
      inputLabel: "마음 남기기",
    },
    scenes: {
      ENTER: {
        gradient: "from-[#1a0a05] via-[#2d1510] to-[#1a0a05]",
        particle: "firefly",
        bgImage: "/assets/apocalypse-session-enter-bg.png",
      },
      LISTEN: {
        gradient: "from-[#1e1008] via-[#2e1a10] to-[#1e1008]",
        particle: "firefly",
        bgImage: "/assets/apocalypse-listen-bg.png",
      },
      RESEARCH: {
        gradient: "from-[#1a0f0a] via-[#2a1a12] to-[#1a0f0a]",
        particle: "glow",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      VERIFY: {
        gradient: "from-[#1a0f0a] via-[#2a1a12] to-[#1a0f0a]",
        particle: "glow",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      DISCUSS_1: {
        gradient: "from-[#1a0f0a] via-[#2a1a12] to-[#1a0f0a]",
        particle: "glow",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      CRYSTAL_SELECT: {
        gradient: "from-[#1e0d08] via-[#301810] to-[#1e0d08]",
        particle: "stars",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      CRYSTAL_ANALYZE: {
        gradient: "from-[#1e0d08] via-[#301810] to-[#1e0d08]",
        particle: "stars",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      DISCUSS_2: {
        gradient: "from-[#1e0d08] via-[#301810] to-[#1e0d08]",
        particle: "stars",
        bgImage: "/assets/apocalypse-research-bg.png",
      },
      DEBATE: {
        gradient: "from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a]",
        particle: "firefly",
        bgImage: "/assets/apocalypse-conclude-bg.png",
      },
      DISCUSS_3: {
        gradient: "from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a]",
        particle: "firefly",
        bgImage: "/assets/apocalypse-conclude-bg.png",
      },
      JUDGE: {
        gradient: "from-[#1a0a0a] via-[#2d1515] to-[#1a0a0a]",
        particle: "firefly",
        bgImage: "/assets/apocalypse-conclude-bg.png",
      },
      CONCLUDE: {
        gradient: "from-[#1e1008] via-[#2a1812] to-[#1a1008]",
        particle: "glow",
        bgImage: "/assets/apocalypse-conclude-bg.png",
      },
      COMPLETE: {
        gradient: "from-[#1e1008] via-[#2a1812] to-[#1a1008]",
        particle: "glow",
        bgImage: "/assets/apocalypse-complete-bg.png",
      },
    },
  },
};

export function getTheme(name: ThemeName): Theme {
  return THEMES[name];
}
