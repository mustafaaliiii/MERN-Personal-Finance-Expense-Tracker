export const DEFAULT_CURRENCY = "PKR";

export function getCurrency() {
  return localStorage.getItem("currency") || DEFAULT_CURRENCY;
}

export function setCurrency(code) {
  localStorage.setItem("currency", code);
  
  // Dispatch a custom event to notify all listeners about currency change
  if (typeof window !== "undefined" && window.dispatchEvent) {
    try {
      window.dispatchEvent(
        new CustomEvent("currencyChanged", { 
          detail: { currency: code } 
        })
      );
    } catch (e) {
      console.debug("Currency event ignored:", e);
    }
  }
}

export function getCurrencySymbol(code) {
  // Prefer "Rs" for PKR (more readable than ₨ in many fonts)
  if (code === "PKR") return "Rs";
  if (code === "USD") return "$";
  return code;
}

import { convertSync, getCachedRate, fetchRate } from "./exchange";

export function formatMoney(amount, code = getCurrency(), fromCurrency = "PKR") {
  const n = Number(amount) || 0;

  // If target currency differs from source, try to convert using cached rate synchronously
  // If we don't have a cached rate, trigger a background fetch so the app
  // will update shortly (DashboardLayout listens for the cache event).
  if (fromCurrency !== code) {
    const cached = getCachedRate(fromCurrency, code);
    if (!cached) {
      // fire-and-forget fetch - UI will re-render when rate is saved
      fetchRate(fromCurrency, code).catch(() => {});
    }
  }

  const valueToFormat = fromCurrency === code ? n : convertSync(n, fromCurrency, code);
  // Prefer a consistent symbol-first format (avoid `US$` label from some locales)
  try {
    const formattedNumber = valueToFormat.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const sym = getCurrencySymbol(code) || code;
    // No space for USD ($123) but include a space for Rs and other symbols (Rs 123)
    if (code === "USD") return `${sym}${formattedNumber}`;
    return `${sym} ${formattedNumber}`;
  } catch {
    return `${getCurrencySymbol(code)} ${valueToFormat.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
