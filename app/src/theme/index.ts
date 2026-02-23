import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, monospace",
  headings: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontWeight: "600",
  },
  primaryColor: "indigo",
  defaultRadius: "sm",
  cursorType: "pointer",
  colors: {
    indigo: [
      "#eef2ff",
      "#e0e7ff",
      "#c7d2fe",
      "#a5b4fc",
      "#818cf8",
      "#6366f1",
      "#4f46e5",
      "#4338ca",
      "#3730a3",
      "#312e81",
    ],
    // High contrast clinical colors for accessibility
    clinical: [
      "#f0f9ff", // 0 - info light
      "#e0f2fe", // 1 - info
      "#bae6fd", // 2 - info medium
      "#7dd3fc", // 3 - info
      "#38bdf8", // 4 - info
      "#0ea5e9", // 5 - info
      "#0284c7", // 6 - info dark
      "#0369a1", // 7 - info darker
      "#075985", // 8 - info darkest
      "#0c4a6e", // 9 - info deepest
    ],
    alert: [
      "#fef2f2", // 0 - error light
      "#fee2e2", // 1 - error
      "#fecaca", // 2 - error medium
      "#fca5a5", // 3 - error
      "#f87171", // 4 - error
      "#ef4444", // 5 - error
      "#dc2626", // 6 - error dark
      "#b91c1c", // 7 - error darker
      "#991b1b", // 8 - error darkest
      "#7f1d1d", // 9 - error deepest
    ],
    warning: [
      "#fffbeb", // 0 - warning light
      "#fef3c7", // 1 - warning
      "#fde68a", // 2 - warning medium
      "#fcd34d", // 3 - warning
      "#fbbf24", // 4 - warning
      "#f59e0b", // 5 - warning
      "#d97706", // 6 - warning dark
      "#b45309", // 7 - warning darker
      "#92400e", // 8 - warning darkest
      "#78350f", // 9 - warning deepest
    ],
    success: [
      "#f0fdf4", // 0 - success light
      "#dcfce7", // 1 - success
      "#bbf7d0", // 2 - success medium
      "#86efac", // 3 - success
      "#4ade80", // 4 - success
      "#22c55e", // 5 - success
      "#16a34a", // 6 - success dark
      "#15803d", // 7 - success darker
      "#166534", // 8 - success darkest
      "#14532d", // 9 - success deepest
    ],
  },
  other: {
    fontFamilySecondary: "JetBrains Mono, monospace",
    // Focus ring styles for accessibility
    focusRing: "2px solid #6366f1",
    focusRingWidth: 2,
  },
  // Override Mantine defaults for better accessibility
  focusRing: "always",
});
