/** Client-side visitor ID management using localStorage */

const STORAGE_KEY = "visitor_id";

/** Get or create a persistent visitor ID stored in localStorage */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/** Return headers object with x-visitor-id set */
export function visitorHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const id = getOrCreateVisitorId();
  return { ...(id ? { "x-visitor-id": id } : {}), ...extra };
}
