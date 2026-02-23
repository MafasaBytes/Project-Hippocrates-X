import { Group, Text, Badge, Card, ThemeIcon } from "@mantine/core";
import {
  IconHeartbeat,
  IconBrain,
  IconClock,
} from "@tabler/icons-react";
import { ModelVersionBadge } from "../intelligence/ModelVersionBadge";

interface SystemStatusBarProps {
  modelsOnline?: number;
  totalModels?: number;
  uptime?: string;
}

export function SystemStatusBar({
  modelsOnline = 4,
  totalModels = 4,
  uptime = "99.9%",
}: SystemStatusBarProps) {
  const allHealthy = modelsOnline === totalModels;

  return (
    <Card
      padding="sm"
      radius="md"
      bg="dark.8"
      style={{ border: "1px solid var(--mantine-color-dark-6)" }}
      role="status"
      aria-label="AI system status"
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="md" wrap="wrap">
          <Group gap="xs">
            <ThemeIcon
              size="xs"
              variant="filled"
              color={allHealthy ? "success" : "warning"}
              radius="xl"
            >
              <IconHeartbeat size={10} />
            </ThemeIcon>
            <Text size="xs" fw={500}>
              System {allHealthy ? "Operational" : "Degraded"}
            </Text>
          </Group>

          <Group gap={4}>
            <IconBrain size={14} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              Models:{" "}
              <Text span fw={600} c={allHealthy ? "success.4" : "warning.4"}>
                {modelsOnline}/{totalModels}
              </Text>{" "}
              online
            </Text>
          </Group>

          <Group gap={4}>
            <IconClock size={14} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              Uptime:{" "}
              <Text span fw={600} c="success.4">
                {uptime}
              </Text>
            </Text>
          </Group>
        </Group>

        <ModelVersionBadge />
      </Group>
    </Card>
  );
}
