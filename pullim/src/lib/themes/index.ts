import { ThemeName, CharacterName } from "@/lib/types-ultimate";

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
  crystalShape: "orb" | "lens" | "bud";

  labels: {
    enter: string;       // "모험가여," | "어서 오십시오." | "어서 오세요."
    askConcern: string;  // "무슨 바람이 불어 찾아왔는가?" | "안건은?" | "어떤 마음을 가져오셨어요?"
    farewell: string;    // "기다리고 있겠네." | "다음 브리핑에서." | "정원에서 기다릴게요."
    tagline: string;     // "자네는 이미 답을 알고 있지 않은가?"
  };

  route: string; // "/adventure" | "/strategy" | "/garden"
  useCases: string; // 적합 상황 태그
}

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
  },
};

export function getTheme(name: ThemeName): Theme {
  return THEMES[name];
}
