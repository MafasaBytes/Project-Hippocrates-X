import { Badge, Group, Text } from "@mantine/core";
import { IconCpu } from "@tabler/icons-react";

interface ModelVersionBadgeProps {
  model?: string;
  version?: string;
}

export function ModelVersionBadge({
  model = "Hippocrates",
  version = "v1.0",
}: ModelVersionBadgeProps) {
  return (
    <Badge
      variant="outline"
      color="slate"
      size="sm"
      radius="sm"
      leftSection={<IconCpu size={12} />}
      aria-label={`AI Model: ${model} ${version}`}
    >
      {model} {version}
    </Badge>
  );
}
