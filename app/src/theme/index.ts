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
  },
  other: {
    fontFamilySecondary: "JetBrains Mono, monospace",
  },
});
