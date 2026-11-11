import isElectron from "is-electron";

/**
 * Fetch DuckDuckGo autocomplete suggestions via main process
 * (avoids renderer CORS / CSP connect-src limits).
 */
export async function fetchSearchSuggestions(
  query: string
): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  if (isElectron()) {
    try {
      // @ts-expect-error electronAPI injected at runtime
      const result = await window.electronAPI?.invoke?.(
        "fetch-search-suggestions",
        q
      );
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    if (
      data.length >= 2 &&
      typeof data[0] === "string" &&
      Array.isArray(data[1])
    ) {
      return data[1]
        .filter((item: unknown) => typeof item === "string")
        .slice(0, 8);
    }
    return data
      .map((item: any) =>
        typeof item === "string"
          ? item
          : typeof item?.phrase === "string"
            ? item.phrase
            : null
      )
      .filter((item: string | null): item is string => !!item)
      .slice(0, 8);
  } catch {
    return [];
  }
}
