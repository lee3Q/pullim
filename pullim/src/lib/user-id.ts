// 익명 사용자 식별 — localStorage 기반 랜덤 ID
import { nanoid } from "nanoid";

const STORAGE_KEY = "pullim_user_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = nanoid();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
