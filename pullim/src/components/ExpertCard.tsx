"use client";

import { ExpertName } from "@/lib/types-v2";

// 전문가별 아이콘/색상 매핑
const EXPERT_STYLE: Record<
  ExpertName,
  { emoji: string; color: string; bgColor: string; borderColor: string }
> = {
  심리상담가: { emoji: "🧠", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  "마음건강 전문가": { emoji: "💚", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  "경영 컨설턴트": { emoji: "📊", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  변호사: { emoji: "⚖️", color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
  "재무 전문가": { emoji: "💰", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  "진로 코치": { emoji: "🧭", color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200" },
  철학자: { emoji: "🤔", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
  행동경제학자: { emoji: "🎯", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  "관계 상담사": { emoji: "💬", color: "text-pink-700", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
  "생활건강 전문가": { emoji: "🏃", color: "text-lime-700", bgColor: "bg-lime-50", borderColor: "border-lime-200" },
};

// 전문가별 한 줄 설명 (기존 — 분석 카드에서 사용)
const EXPERT_DESCRIPTION: Record<ExpertName, string> = {
  심리상담가: "감정의 깊은 층을 함께 들여다봅니다",
  "마음건강 전문가": "마음과 몸의 연결 관점에서 살펴봅니다",
  "경영 컨설턴트": "상황의 구조와 기회비용을 분석합니다",
  변호사: "권리와 책임의 구조를 따져봅니다",
  "재무 전문가": "숫자와 현금흐름 관점에서 봅니다",
  "진로 코치": "강점과 시장의 교차점을 찾습니다",
  철학자: "당연한 전제를 다시 질문합니다",
  행동경제학자: "왜 알면서도 못 움직이는지 분석합니다",
  "관계 상담사": "관계의 역학과 상대 시점을 봅니다",
  "생활건강 전문가": "몸이 보내는 신호를 읽어냅니다",
};

// 전문가 캐릭터: 성격 한 줄 (선택 화면에서 인격 느낌 전달용)
const EXPERT_CHARACTERS: Record<ExpertName, string> = {
  심리상담가: "감정 뒤에 숨은 패턴을 봐요",
  "마음건강 전문가": "지금 마음이 보내는 신호를 읽어요",
  "경영 컨설턴트": "숫자와 구조로 정리해드려요",
  변호사: "권리와 리스크를 짚어요",
  "재무 전문가": "돈의 흐름으로 판단해요",
  "진로 코치": "3년 뒤 당신의 자리를 같이 그려요",
  철학자: "질문 자체를 뒤집어봐요",
  행동경제학자: "왜 알면서도 못 하는지를 짚어요",
  "관계 상담사": "상대방 입장에서 한번 볼까요",
  "생활건강 전문가": "몸이 보내는 신호부터 체크해요",
};

interface ExpertCardProps {
  expertName: ExpertName;
  analysis?: string;
  question?: string;
  isSelected?: boolean;
  isSelectable?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export default function ExpertCard({
  expertName,
  analysis,
  question,
  isSelected = false,
  isSelectable = false,
  isRecommended = false,
  onSelect,
  compact = false,
}: ExpertCardProps) {
  const style = EXPERT_STYLE[expertName];
  const description = EXPERT_DESCRIPTION[expertName];
  const personality = EXPERT_CHARACTERS[expertName];

  if (compact) {
    // 전문가 선택 카드 (EXPERT_SELECT 단계)
    return (
      <button
        onClick={onSelect}
        disabled={!isSelectable}
        className={`w-full text-left p-4 rounded-2xl border-2 transition-all
          ${
            isSelected
              ? `${style.borderColor} ${style.bgColor} ring-2 ring-violet-300`
              : "border-gray-100 bg-white hover:border-violet-200"
          }
          ${isSelectable ? "cursor-pointer active:scale-[0.98]" : ""}
          disabled:opacity-60 disabled:cursor-default`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{style.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`font-semibold text-sm ${style.color}`}>{expertName}</h4>
              {isRecommended && (
                <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  추천
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 italic">&ldquo;{personality}&rdquo;</p>
          </div>
          {isSelected && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
      </button>
    );
  }

  // 분석 결과 카드 (ANALYZE 단계)
  return (
    <div className={`rounded-2xl border ${style.borderColor} ${style.bgColor} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{style.emoji}</span>
        <h4 className={`font-semibold text-sm ${style.color}`}>{expertName}</h4>
      </div>
      {analysis && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
          {analysis}
        </p>
      )}
      {question && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-sm text-gray-600 italic">&ldquo;{question}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

export { EXPERT_STYLE, EXPERT_DESCRIPTION, EXPERT_CHARACTERS };
