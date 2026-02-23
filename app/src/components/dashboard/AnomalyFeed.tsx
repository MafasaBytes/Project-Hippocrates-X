import { Card, Text, Stack, ScrollArea, Group, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { ConfidenceBadge } from "../consultation/ConfidenceBadge";

export interface Anomaly {
  id: string;
  consultationId: string;
  patientName: string;
  description: string;
  confidence: number;
  timestamp: string;
}

interface Props {
  anomalies: Anomaly[];
}

export function AnomalyFeed({ anomalies }: Props) {
  return (
    <Card
      padding="md"
      radius="md"
      bg="dark.7"
      h="100%"
      style={{ border: "1px solid var(--mantine-color-dark-5)" }}
    >
      <Text fw={600} size="sm" mb="sm">
        Anomaly Feed
      </Text>
      <ScrollArea h={360} type="hover">
        {anomalies.length === 0 && (
          <Text size="xs" c="dimmed" ta="center" py="xl">
            No anomalies detected
          </Text>
        )}
        <Stack gap="sm">
          {anomalies.map((a) => (
            <Card key={a.id} padding="sm" bg="dark.6" radius="sm">
              <Group gap="xs" mb={4} wrap="nowrap">
                <ThemeIcon size="sm" variant="light" color="alert">
                  <IconAlertTriangle size={14} />
                </ThemeIcon>
                <Text size="sm" fw={600} lineClamp={1}>
                  {a.patientName}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb={6}>
                {a.description}
              </Text>
              <ConfidenceBadge value={a.confidence} showBar />
            </Card>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
