"use client";

interface Props {
  message: string;
  hotline: string;
  onClose: () => void;
}

/**
 * 위기 감지 시 표시. 기존 모달이 "차단"으로 느껴진다는 UX 감사 반영하여 재설계.
 *
 * 핵심 원칙:
 * - 첫 메시지: "여기 있을게" (거부가 아님)
 * - 사용자에게 강요하지 않음 (전화 의무 X)
 * - 선택지 4개: 계속 얘기 / 문자상담 / 전화 / 그냥 있기
 * - 모달이지만 "쫓아내는" 감각 제거 — 톤으로 해결
 *
 * 안전 규칙은 그대로 (.state/project-config.md):
 * - LLM 세션은 이 감지 시점에서 중단됨 (상위 레이어 책임)
 * - 정보 제공은 하되 강요는 안 함
 */
export default function CrisisAlert({ message, hotline, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(10,8,20,0.75)" }}
    >
      <div
        className="rpg-panel max-w-md md:max-w-xl w-full p-6 rounded-2xl space-y-5"
        style={{ border: "1px solid rgba(192,163,116,0.30)" }}
      >
        {/* 선행 메시지 — "여기 있을게" */}
        <div className="text-center space-y-3">
          <p className="text-3xl">🫂</p>
          <p
            className="text-lg font-rpg leading-relaxed"
            style={{ color: "var(--fantasy-gold-bright, rgba(232,213,181,0.95))" }}
          >
            여기 있을게.
          </p>
          <p
            className="text-sm font-rpg leading-relaxed"
            style={{ color: "rgba(232,213,181,0.85)" }}
          >
            지금 이 순간, 혼자 두지 않을게.
          </p>
          {message && (
            <p
              className="text-xs font-rpg-sm pt-2 italic"
              style={{ color: "rgba(232,213,181,0.60)" }}
            >
              {message}
            </p>
          )}
        </div>

        {/* 사용자 자율 옵션 — 강요 없음 */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-rpg-sm text-center pb-1"
            style={{ color: "rgba(232,213,181,0.50)" }}
          >
            지금 뭐가 필요해? (고르지 않아도 돼)
          </p>

          <button
            onClick={onClose}
            className="rpg-button w-full py-3 text-sm font-rpg-sm"
            aria-label="풀림에서 계속 이야기"
          >
            🕯️ 여기서 조금 더 얘기할래
          </button>

          <a
            href="tel:109"
            className="block rpg-button-ghost w-full py-3 text-sm font-rpg-sm text-center"
            aria-label="자살예방상담전화 109에 전화 걸기"
          >
            📞 목소리 듣고 싶어 · 109
          </a>

          <a
            href="sms:1393"
            className="block rpg-button-ghost w-full py-3 text-sm font-rpg-sm text-center"
            aria-label="자살예방상담 문자 1393 시작"
          >
            💬 글로 얘기할래 · 1393 문자
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-rpg-sm transition-opacity hover:opacity-80"
            style={{ color: "rgba(232,213,181,0.45)" }}
          >
            그냥 혼자 있을래
          </button>
        </div>

        {/* 핫라인 참고 정보 — 조용히 */}
        {hotline && hotline !== "자살예방상담전화: 109" && (
          <p
            className="text-[10px] font-rpg-sm text-center pt-2"
            style={{
              color: "rgba(232,213,181,0.35)",
              borderTop: "1px dashed rgba(232,213,181,0.15)",
            }}
          >
            {hotline}
          </p>
        )}
      </div>
    </div>
  );
}
