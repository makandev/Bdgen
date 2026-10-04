"use client";

import { useEffect } from "react";
import { BASE, HOME } from "@/lib/base";

/** Installed app (or an older home-screen icon pointing at "/") always opens the app, not the showcase. */
export function StandaloneToApp() {
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) window.location.replace(`${BASE}${HOME}`);
  }, []);
  return null;
}
