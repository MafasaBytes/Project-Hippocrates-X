import { Badge, type MantineColor } from "@mantine/core";

type Status = "active" | "completed" | "pending" | "critical" | "processing" | "idle";

const STATUS_MAP: Record<Status, { color: MantineColor; label: string }> = {
  active: { color: "clinical", label: "Active" },
  completed: { color: "success", label: "Completed" },
  pending: { color: "warning", label: "Pending Review" },
  critical: { color: "alert", label: "Critical" },
  processing: { color: "indigo", label: "Processing" },
  idle: { color: "slate", label: "Idle" },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.idle;
  return (
    <Badge
      color={config.color}
      variant="light"
      size={size}
      aria-label={`Status: ${label ?? config.label}`}
    >
      {label ?? config.label}
    </Badge>
  );
}
