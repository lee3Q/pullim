// 로컬 데이터 내보내기/불러오기 — 기기 교체 시 감정 데이터 증발 방지.
//
// 근거: 시장성 에이전트 2026-04-23 평가 Top Risk #2
// "LocalStorage 락인 — 기기 바꾸면 전당·약속·편지 증발.
//  감정 데이터 축적이 핵심 가치인데 휘발."
//
// 전략: JSON 단일 파일 내보내기/불러오기.
// 서버 의존 0, 프라이버시 안전. PMF 이전에도 무료 가능.

export interface PullimExport {
  version: 1;
  exportedAt: number;
  data: Record<string, unknown>;
}

const EXPORT_KEYS = [
  "pullim_user_profile",
  "pullim_promises",
  "pullim_insight_archive",
  "pullim_behind_feedback",
  "pullim_session_trail",
  "pullim_letter_state",
  "pullim_settings",
  "pullim_fatigue_dismissed_at",
  "pullim_discovery",
  "pullim_onboarding_done",
  "pullim_user_id",
];

export function exportAll(): PullimExport {
  const data: Record<string, unknown> = {};
  if (typeof window === "undefined") {
    return { version: 1, exportedAt: Date.now(), data };
  }
  for (const key of EXPORT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        // JSON 파싱 가능하면 구조화, 아니면 문자열 그대로
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    } catch {
      // 키 접근 실패 무시
    }
  }
  return { version: 1, exportedAt: Date.now(), data };
}

export function exportAsJsonBlob(): Blob {
  const snapshot = exportAll();
  return new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
}

export function downloadExport(filename?: string): void {
  if (typeof window === "undefined") return;
  const blob = exportAsJsonBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename ?? `pullim-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  importedKeys?: string[];
}

/**
 * JSON 파일 불러오기. 기존 localStorage에 **덮어쓰기** (사용자가 주체이므로 merge 하지 않음).
 * 안전: version 체크 + key allowlist 체크 (알 수 없는 키는 무시).
 */
export function importFromJson(json: unknown): ImportResult {
  if (typeof window === "undefined") return { ok: false, error: "브라우저에서만 가능해" };

  if (!json || typeof json !== "object") {
    return { ok: false, error: "JSON 형식이 맞지 않아" };
  }
  const obj = json as Record<string, unknown>;
  if (obj.version !== 1) {
    return { ok: false, error: `지원하지 않는 버전이야 (version: ${String(obj.version)})` };
  }
  if (!obj.data || typeof obj.data !== "object") {
    return { ok: false, error: "data 필드가 없어" };
  }

  const importedKeys: string[] = [];
  const data = obj.data as Record<string, unknown>;
  for (const key of EXPORT_KEYS) {
    if (!(key in data)) continue;
    const value = data[key];
    try {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      importedKeys.push(key);
    } catch {
      // quota exceeded 등 무시
    }
  }

  return { ok: true, importedKeys };
}

export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    return importFromJson(json);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "파일을 읽을 수 없어",
    };
  }
}
