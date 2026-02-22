import { Badge, Group, Progress, Text } from "@mantine/core";

interface ConfidenceBadgeProps {
  value: number;
  showBar?: boolean;
}

function getColor(value: number): string {
  if (value >= 90) return "green";
  if (value >= 70) return "blue";
  if (value >= 50) return "yellow";
  return "red";
}

function getLabel(value: number): string {
  if (value >= 90) return "High confidence";
  if (value >= 70) return "Moderate confidence";
  if (value >= 50) return "Low confidence";
  return "Uncertain";
}

export function ConfidenceBadge({ value, showBar = false }: ConfidenceBadgeProps) {
  const color = getColor(value);
  const label = getLabel(value);
  const clamped = Math.max(0, Math.min(100, value));

  if (showBar) {
    return (
      <Group gap="xs" wrap="nowrap">
        <Progress value={clamped} color={color} size="sm" w={80} />
        <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
          {clamped}%
        </Text>
      </Group>
    );
  }

  return (
    <Badge color={color} variant="light" size="sm">
      {label} ({clamped}%)
    </Badge>
  );
}
