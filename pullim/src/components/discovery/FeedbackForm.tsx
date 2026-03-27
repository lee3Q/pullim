"use client";

import { useState } from "react";
import { getSupabase, isSupabaseAvailable } from "@/lib/supabase/client";

interface Props {
  personalityType: string;
}

export default function FeedbackForm({ personalityType }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const available = isSupabaseAvailable();

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("feedback").insert({
          personality_type: personalityType,
          rating,
          message,
          user_agent: navigator.userAgent,
        });
      }
      setSubmitted(true);
    } catch {
      // 에러 시 조용히 처리
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl px-5 py-5 text-center space-y-1 animate-in fade-in duration-500"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p className="text-xl">✨</p>
        <p className="text-sm font-rpg" style={{ color: "var(--fantasy-text)" }}>
          감사합니다!
        </p>
        <p className="text-xs font-rpg" style={{ color: "rgba(192,167,136,0.5)" }}>
          소중한 피드백이 풀림을 만드는 데 쓰입니다
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl px-5 py-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p className="text-xs font-rpg-sm text-center" style={{ color: "rgba(192,167,136,0.6)" }}>
        맘에 드시나요? 솔직한 피드백 부탁드려요
      </p>

      {/* 별점 */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform active:scale-90"
            style={{
              opacity: star <= (hovered || rating) ? 1 : 0.8,
              color: star <= (hovered || rating) ? "#f5c542" : "rgba(192,167,136,0.9)",
              filter:
                star <= (hovered || rating)
                  ? "drop-shadow(0 0 6px rgba(168,130,88,0.7))"
                  : "none",
            }}
          >
            ★
          </button>
        ))}
      </div>

      {/* 텍스트 */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="UI, 결과, 경험 뭐든 자유롭게..."
        rows={3}
        className="w-full resize-none rounded-xl px-4 py-3 text-sm font-rpg outline-none transition-colors placeholder:opacity-30"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "var(--fantasy-text)",
        }}
      />

      {/* 버튼 */}
      {available ? (
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="w-full py-3 rounded-xl text-sm font-rpg transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background:
              rating > 0
                ? "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.15))"
                : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "rgba(192,167,136,0.8)",
          }}
        >
          {loading ? "전송 중..." : "익명으로 보내기"}
        </button>
      ) : (
        <p
          className="text-center text-xs font-rpg py-2"
          style={{ color: "rgba(192,167,136,0.35)" }}
        >
          피드백 준비 중
        </p>
      )}
    </div>
  );
}
