const TZ = "Asia/Jakarta";

export const formatDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(iso));

export const formatDateTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
