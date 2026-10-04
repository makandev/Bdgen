"use client";

import { useEffect } from "react";
import { BASE } from "@/lib/base";

/** /start/ was the app's address for a short time – old bookmarks and home-screen icons land on the overview. */
export default function OldStart() {
  useEffect(() => {
    window.location.replace(`${BASE}/`);
  }, []);
  return null;
}
