// src/utils/theme.js
export function getCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v?.trim() || fallback;
}

export function getChartTheme() {
  return {
    axis: getCssVar("--chart-axis", "#475569"),
    grid: getCssVar("--chart-grid", "#e5e7eb"),
    tooltipBg: getCssVar("--chart-tooltip-bg", "#fff"),
    tooltipFg: getCssVar("--chart-tooltip-fg", "#111827"),
  };
}
