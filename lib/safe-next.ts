/** Hanya izinkan path relatif internal untuk redirect setelah login. */
export function safeNext(next: string | null | undefined, fallback = "/projects"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
