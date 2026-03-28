"use client";

import { useEffect } from "react";
import { initNative } from "@/lib/native/capacitor";

export default function NativeInit() {
  useEffect(() => {
    initNative();
  }, []);
  return null;
}
