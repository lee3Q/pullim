"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/session-store";
import { useV2SessionStore } from "@/lib/store/v2-session-store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useSessionStore.persist.rehydrate();
    useV2SessionStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
