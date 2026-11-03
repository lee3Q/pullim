"use client";

import { useEffect, useState } from "react";
import { ACTION_HISTORY_KEY, loadActions, updateAction, deleteAction, type ActionRecord } from "@/lib/session/action-history";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPromiseHistory } from "@/lib/session/promise-store";
import type { PullimPromise } from "@/lib/session/ladder-types";

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [promises, setPromises] = useState<PullimPromise[]>([]);
  const [promiseError, setPromiseError] = useState<string | null>(null);
  const [promisesLoaded, setPromisesLoaded] = useState(false);
  const refreshPromises = () => {
    try { setPromises(getPromiseHistory()); setPromiseError(null); setPromisesLoaded(true); }
    catch { setPromiseError("약속 기록을 읽지 못했습니다. 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요. 기존 데이터는 바꾸지 않았습니다."); }
  };
  const refresh = () => {
    try { setRecords(loadActions(localStorage)); setError(null); setLoaded(true); }
    catch { setError("기록을 읽지 못했습니다. 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요. 기존 데이터는 바꾸지 않았습니다."); }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { refresh(); refreshPromises(); }, 0);
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage &&
          (event.key === ACTION_HISTORY_KEY || event.key === "pullim_promises" || event.key === null)) {
        refresh();
        refreshPromises();
      }
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
          <p className="text-white/60 text-xs mb-4">이 브라우저에 저장한 확정 행동과 Ladder 약속을 따로 보여줍니다. 다른 기기와 동기화되지 않으며, 브라우저 데이터를 지우면 사라집니다.</p>
          <section aria-label="확정 행동">
          <h2 className="text-white/90 text-base mb-3">확정 행동</h2>
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
          </section>
          <section aria-label="Ladder 약속" className="mt-8 mb-6">
            <h2 className="text-white/90 text-base mb-3">Ladder 약속</h2>
            <p className="text-white/60 text-xs mb-4">대화 정리에서 선택한 작은 실험입니다. 여기서는 저장된 기록을 읽기만 합니다. 진행 중인 약속 확인은 새 대화에서 할 수 있습니다.</p>
            {promiseError && <div role="alert" className="text-red-200 text-sm mb-4"><p>{promiseError}</p><button className="rpg-button-ghost mt-2 px-3 py-2" onClick={refreshPromises}>약속 다시 읽기</button></div>}
            {!promisesLoaded && !promiseError && <p role="status" className="text-white/65">약속 불러오는 중...</p>}
            {promisesLoaded && !promiseError && promises.length === 0 && <p className="text-white/65 text-sm">저장한 Ladder 약속이 없습니다.</p>}
            {!promiseError && <ul className="space-y-4 text-left">
              {promises.map(promise => <li key={promise.id} className="rounded-lg border border-white/20 p-4 break-words">
                <p className="text-white/65 text-xs mb-2">만약: {promise.trigger}</p>
                <p className="text-white/90 text-sm mb-2">{promise.action}</p>
                <p className="text-white/65 text-xs mb-2">테마: {promise.sessionTheme}</p>
                <p className="text-white/65 text-xs">약속 상태: {{ active: "진행 중", completed: "완료", failed: "하지 못함", skipped: "나중에" }[promise.status]}</p>
                {promise.reflection && <p className="text-white/75 text-sm mt-3 whitespace-pre-wrap">후기: {promise.reflection}</p>}
              </li>)}
            </ul>}
          </section>
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
