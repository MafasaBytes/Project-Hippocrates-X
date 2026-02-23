import { Card, Text, Stack, Group, Center, ThemeIcon, Button } from "@mantine/core";
import {
  IconAlertTriangle,
  IconDatabaseOff,
  IconSearchOff,
  IconMoodSad,
} from "@tabler/icons-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "search" | "database" | "empty" | "error";
  action?: React.ReactNode;
  mt?: string;
}

export function EmptyState({
  title,
  description,
  icon = "search",
  action,
  mt = "xl",
}: EmptyStateProps) {
  const iconMap = {
    search: IconSearchOff,
    database: IconDatabaseOff,
    empty: IconMoodSad,
    error: IconAlertTriangle,
  };

  const Icon = iconMap[icon];

  return (
    <Card withBorder padding="lg" bg="gray.0">
      <Center py="xl">
        <Stack gap="md" align="center">
          <ThemeIcon size="xl" variant="light" color="gray">
            <Icon size={32} stroke={1.5} />
          </ThemeIcon>
          <Text fw={600}>{title}</Text>
          {description && <Text size="sm" c="dimmed">{description}</Text>}
          {action && <Group>{action}</Group>}
        </Stack>
      </Center>
    </Card>
  );
}

EmptyState.displayName = "EmptyState";
