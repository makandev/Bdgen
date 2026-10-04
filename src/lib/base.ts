/** Sub-path the app is served from (e.g. "/Bdgen" on GitHub Pages). */
export const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

/** Where the app itself lives – "/" is the showcase page. */
export const HOME = "/start/";
