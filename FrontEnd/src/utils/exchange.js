// Lightweight exchange rate helper with simple localStorage caching
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function cacheKey(from, to) {
  return `exrate_${from}_${to}`;
}

export function getCachedRate(from = "USD", to = "PKR") {
  try {
    const raw = localStorage.getItem(cacheKey(from, to));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.rate) return null;
    if (Date.now() - (obj.ts || 0) > CACHE_TTL_MS) return null;
    return obj.rate;
  } catch (e) {
    return null;
  }
}

export function setCachedRate(from = "USD", to = "PKR", rate) {
  try {
    const obj = { rate, ts: Date.now() };
    localStorage.setItem(cacheKey(from, to), JSON.stringify(obj));
    try {
      // notify app that a new rate is available
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("exchangeRateUpdated", { detail: { from, to, rate } })
        );
      }
    } catch (e) {
      /* ignore */
    }
  } catch (e) {}
}

export async function fetchRate(from = "USD", to = "PKR") {
  // Try exchangerate.host (no API key required)
  try {
    const res = await fetch(`https://api.exchangerate.host/latest?base=${from}&symbols=${to}`);
    if (!res.ok) throw new Error("rate fetch failed");
    const data = await res.json();
    const rate = data?.rates?.[to];
    if (rate && typeof rate === "number") {
      setCachedRate(from, to, rate);
      return rate;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function convertSync(amount, from = "USD", to = "PKR") {
  const rate = getCachedRate(from, to);
  if (!rate) return amount;
  return amount * rate;
}

export default { getCachedRate, setCachedRate, fetchRate, convertSync };
