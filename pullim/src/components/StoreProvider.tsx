"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/session-store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useSessionStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
