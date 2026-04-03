"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, isSupabaseReady } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해줘.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해.");
      return;
    }

    setLoading(true);
    const fn = tab === "login" ? signIn : signUp;
    const result = await fn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    /* 백드롭 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rpg-panel w-full max-w-xs rounded-2xl px-6 py-7 relative animate-in fade-in slide-in-from-bottom-3 duration-200"
        style={{
          background: "linear-gradient(160deg, #1a1530ee, #12101aee)",
          border: "1px solid rgba(192,163,116,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors text-lg"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 제목 */}
        <h2
          className="text-base font-bold font-rpg text-center mb-5"
          style={{ color: "var(--fantasy-gold-bright)" }}
        >
          풀림에 로그인
        </h2>

        {/* Supabase 미설정 */}
        {!isSupabaseReady ? (
          <p
            className="text-center text-sm font-rpg-sm py-4"
            style={{ color: "rgba(232,213,181,0.55)" }}
          >
            현재 로그인을 사용할 수 없습니다.
          </p>
        ) : (
          <>
            {/* 탭 */}
            <div className="flex mb-5 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null); }}
                  className="flex-1 py-2 text-xs font-rpg transition-colors"
                  style={{
                    background: tab === t ? "rgba(167,139,250,0.18)" : "transparent",
                    color: tab === t ? "#a78bfa" : "rgba(232,213,181,0.45)",
                  }}
                >
                  {t === "login" ? "로그인" : "회원가입"}
                </button>
              ))}
            </div>

            {/* 입력 */}
            <div className="space-y-3">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 rounded-xl text-sm font-rpg-sm outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--fantasy-text)",
                }}
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 rounded-xl text-sm font-rpg-sm outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--fantasy-text)",
                }}
              />
            </div>

            {/* 에러 */}
            {error && (
              <p className="mt-3 text-xs font-rpg-sm text-center" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}

            {/* 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-5 w-full py-3 rounded-xl text-sm font-rpg transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "linear-gradient(145deg, var(--fantasy-leather), var(--fantasy-leather-deep))",
                border: "1px solid var(--fantasy-gold-dark)",
                color: "var(--fantasy-button-text)",
                boxShadow: "0 2px 0 var(--fantasy-leather-darkest), 0 3px 8px rgba(0,0,0,0.6)",
                textShadow: "0 1px 0 var(--fantasy-leather-darkest)",
              }}
            >
              {loading ? "..." : tab === "login" ? "로그인" : "회원가입"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
