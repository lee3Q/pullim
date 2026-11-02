"use client";

import { useEffect, useState } from "react";
import { ACTION_HISTORY_KEY, loadActions, updateAction, deleteAction, type ActionRecord } from "@/lib/session/action-history";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const refresh = () => {
    try { setRecords(loadActions(localStorage)); setError(null); setLoaded(true); }
    catch { setError("기록을 읽지 못했습니다. 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요. 기존 데이터는 바꾸지 않았습니다."); }
  };
  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage &&
          (event.key === ACTION_HISTORY_KEY || event.key === null)) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const change = (operation: () => void) => {
    try { operation(); refresh(); }
    catch { setError("변경을 저장하지 못했습니다. 기존 화면을 유지합니다. 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요."); }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* 배경 — 홈과 동일 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#12101a] via-[#1a1530] to-[#1e1a28]" />
        <div className="absolute inset-0 opacity-50">
          <Image
            src="/assets/home-bg.webp"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 relative z-10">
        <button
          onClick={() => router.back()}
          className="rpg-button-ghost px-3 py-1.5 text-xs font-rpg-sm"
        >
          &larr; 뒤로
        </button>
        <span className="text-sm font-rpg text-white/70">내 기록</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="rpg-panel px-8 py-10 max-w-sm md:max-w-lg lg:max-w-xl w-full text-center">
          <p className="text-white/60 text-xs mb-4">확정한 행동만 이 브라우저에 저장합니다. 고민 원문은 복사하지 않습니다. 브라우저 데이터를 지우면 사라집니다. Ladder 약속은 별도입니다.</p>
          {error && <div role="alert" className="text-red-200 text-sm mb-4"><p>{error}</p><button className="rpg-button-ghost mt-2 px-3 py-2" onClick={refresh}>다시 시도</button></div>}
          {!loaded && !error && <p role="status" className="text-white/65">기록 불러오는 중...</p>}
          {loaded && !error && records.length === 0 && <p className="text-white/65 text-sm font-rpg mb-6">아직 기록이 없습니다.</p>}
          <ul className="space-y-4 text-left mb-6">
            {records.map(record => <li key={record.sessionId} className="rounded-lg border border-white/20 p-4 break-words">
              <p className="text-white/90 text-sm mb-2">{record.action}</p>
              <p className="text-white/65 text-xs mb-2">기한: {record.deadline ?? "선택하지 않음"}</p>
              <p className="text-white/65 text-xs mb-3">상태: {{ pending: "확인 전", completed: "완료", deferred: "보류" }[record.status]}</p>
              <div className="flex flex-wrap gap-2">
                <button className="rpg-button-ghost px-3 py-2 text-xs" onClick={() => change(() => updateAction(localStorage, record.sessionId, "completed"))}>완료</button>
                <button className="rpg-button-ghost px-3 py-2 text-xs" onClick={() => change(() => updateAction(localStorage, record.sessionId, "deferred"))}>보류</button>
                <button className="rpg-button-ghost px-3 py-2 text-xs" onClick={() => { if (window.confirm("이 행동 기록을 삭제할까요? 되돌릴 수 없습니다.")) change(() => deleteAction(localStorage, record.sessionId)); }}>삭제</button>
              </div>
            </li>)}
          </ul>
          <button
            onClick={() => router.push("/")}
            className="rpg-button px-6 py-2.5 text-sm font-rpg"
          >
            새 고민 시작하기
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-white/25 py-4 relative z-10">
        풀림은 전문 상담을 대체하지 않습니다.
      </footer>
    </div>
  );
}
