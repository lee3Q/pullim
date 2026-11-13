import type { Metadata } from "next";
import { getPersonalityTypeById } from "@/lib/personalization/personality-type";
import type { ThemeType } from "@/lib/personalization/story-scenes";
import ResultClient from "./ResultClient";

const THEME_LABELS: Record<ThemeType, string> = {
  adventure: "모험가의 숲",
  garden: "달빛정원",
  strategy: "전략실",
  stargazer: "천문대",
  apocalypse: "종말",
};

// Query strings are untrusted input, not a ThemeType cast.
function resultTheme(value: string | undefined): ThemeType {
  return value && Object.prototype.hasOwnProperty.call(THEME_LABELS, value)
    ? value as ThemeType : "adventure";
}

const BASE_URL = "https://pullim.vercel.app";

interface Props {
  searchParams: Promise<{ theme?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const theme = resultTheme(params.theme);
  const typeId = params.type || "";
  const pt = getPersonalityTypeById(typeId);

  const fallbackOgImage = "/images/og/og_main.png";

  if (!pt) {
    return {
      title: "풀림 - 고민 정리와 작은 행동",
      description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
      metadataBase: new URL(BASE_URL),
      openGraph: {
        title: "풀림 - 고민 정리와 작은 행동",
        description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
        images: [{ url: fallbackOgImage, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "풀림 - 고민 정리와 작은 행동",
        description: "고민의 사실과 가정을 나누고, 선택지를 살펴본 뒤 작은 행동을 직접 고르는 실험 도구입니다. 진단이나 행동 예측을 제공하지 않습니다.",
        images: [fallbackOgImage],
      },
    };
  }

  const displayName = pt.themedName[theme] ?? pt.themedName.adventure;
  const themeLabel = THEME_LABELS[theme] ?? THEME_LABELS.adventure;
  const title = `풀림 - ${displayName} 실험적 유형 요약`;
  const description = `${themeLabel}의 선택 기록을 돌아보기 위한 실험적 유형 요약입니다. 진단이나 검증된 성격 평가, 행동 예측을 제공하지 않습니다.`;

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
  const theme = resultTheme(params.theme);
  const typeId = params.type || "";

  return <ResultClient theme={theme} typeId={typeId} />;
}
