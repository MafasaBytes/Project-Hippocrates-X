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
    <Card withBorder padding="md" h="100%">
      <Text fw={600} mb="sm">
        Anomaly Feed
      </Text>
      <ScrollArea h={360}>
        {anomalies.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No anomalies detected
          </Text>
        )}
        <Stack gap="sm">
          {anomalies.map((a) => (
            <Card key={a.id} withBorder padding="sm" bg="red.0">
              <Group gap="xs" mb={4} wrap="nowrap">
                <ThemeIcon size="sm" variant="light" color="red">
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
