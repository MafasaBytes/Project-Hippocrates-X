import { Badge, type MantineColor } from "@mantine/core";

type Severity = "low" | "moderate" | "high" | "critical";

const SEVERITY_MAP: Record<Severity, { color: MantineColor; label: string }> = {
  low: { color: "success", label: "Low Risk" },
  moderate: { color: "warning", label: "Moderate" },
  high: { color: "orange", label: "High Risk" },
  critical: { color: "alert", label: "Critical" },
};

interface RiskTagProps {
  severity: Severity;
  label?: string;
  size?: "xs" | "sm" | "md";
}

export function RiskTag({ severity, label, size = "xs" }: RiskTagProps) {
  const config = SEVERITY_MAP[severity] ?? SEVERITY_MAP.low;
  return (
    <Badge
      color={config.color}
      variant="filled"
      size={size}
      radius="sm"
      aria-label={`Risk: ${label ?? config.label}`}
    >
      {label ?? config.label}
    </Badge>
  );
}
