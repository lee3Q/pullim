import type { Metadata } from "next";
import { getPersonalityTypeById } from "@/lib/personalization/personality-type";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import ResultClient from "./ResultClient";

const THEME_LABELS: Record<ThemeType, string> = {
  adventure: "모험가의 숲",
  garden: "달빛정원",
  strategy: "전략실",
  stargazer: "천문대",
};

const BASE_URL = "https://pullim.vercel.app";

interface Props {
  searchParams: Promise<{ theme?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const theme = (params.theme || "adventure") as ThemeType;
  const typeId = params.type || "";
  const pt = getPersonalityTypeById(typeId);

  if (!pt) {
    return {
      title: "풀림 — 3분이면 나를 알 수 있어요",
      description: "AI가 당신의 선택을 읽고, 당신도 몰랐던 유형을 알려줍니다",
    };
  }

  const displayName = pt.themedName[theme];
  const themeLabel = THEME_LABELS[theme];
  const title = `나는 "${displayName}" 유형이래! — 풀림`;
  const description = `${themeLabel}에서 발견한 나: ${displayName}. ${pt.description}`;

  const ogImage = `/images/og/og_${theme}_${typeId}.png`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const theme = (params.theme || "adventure") as ThemeType;
  const typeId = params.type || "";

  return <ResultClient theme={theme} typeId={typeId} />;
}
