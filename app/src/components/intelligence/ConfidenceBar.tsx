import { Group, Progress, Text, Stack, type MantineColor } from "@mantine/core";

function getColor(value: number): MantineColor {
  if (value >= 90) return "success";
  if (value >= 70) return "clinical";
  if (value >= 50) return "warning";
  return "alert";
}

function getLabel(value: number): string {
  if (value >= 90) return "High";
  if (value >= 70) return "Moderate";
  if (value >= 50) return "Low";
  return "Uncertain";
}

interface ConfidenceBarProps {
  value: number;
  label?: string;
  showLabel?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function ConfidenceBar({
  value,
  label,
  showLabel = true,
  size = "sm",
}: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getColor(clamped);
  const confidenceLabel = label ?? getLabel(clamped);

  return (
    <Stack gap={4} aria-label={`AI Confidence: ${clamped}%, ${confidenceLabel}`}>
      {showLabel && (
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed" fw={500}>
            {confidenceLabel}
          </Text>
          <Text size="xs" ff="var(--mantine-font-family-monospace)" fw={600} c={`${color}.4`}>
            {clamped}%
          </Text>
        </Group>
      )}
      <Progress
        value={clamped}
        color={color}
        size={size}
        radius="xl"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </Stack>
  );
}
