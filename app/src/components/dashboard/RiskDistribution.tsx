import { Card, Text, Group, Stack, Progress, SimpleGrid } from "@mantine/core";
import { ConfidenceBar } from "../intelligence/ConfidenceBar";

interface RiskDistributionProps {
  low?: number;
  moderate?: number;
  high?: number;
  critical?: number;
}

export function RiskDistribution({
  low = 72,
  moderate = 18,
  high = 8,
  critical = 2,
}: RiskDistributionProps) {
  const total = low + moderate + high + critical || 1;
  const segments = [
    { label: "Low", value: Math.round((low / total) * 100), color: "success" },
    { label: "Moderate", value: Math.round((moderate / total) * 100), color: "warning" },
    { label: "High", value: Math.round((high / total) * 100), color: "orange" },
    { label: "Critical", value: Math.round((critical / total) * 100), color: "alert" },
  ];

  return (
    <Card
      padding="md"
      radius="md"
      bg="dark.7"
      style={{ border: "1px solid var(--mantine-color-dark-5)" }}
    >
      <Text fw={600} size="sm" mb="md">
        Risk Distribution
      </Text>
      <Progress.Root size="lg" radius="xl" mb="md">
        {segments.map((s) => (
          <Progress.Section key={s.label} value={s.value} color={s.color}>
            {s.value >= 10 && (
              <Progress.Label>{s.value}%</Progress.Label>
            )}
          </Progress.Section>
        ))}
      </Progress.Root>
      <Group gap="lg" justify="center">
        {segments.map((s) => (
          <Group gap={6} key={s.label}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: `var(--mantine-color-${s.color}-5)`,
              }}
            />
            <Text size="xs" c="dimmed">
              {s.label} ({s.value}%)
            </Text>
          </Group>
        ))}
      </Group>
    </Card>
  );
}

interface ModelConfidenceProps {
  nlp?: number;
  vision?: number;
  audio?: number;
  reasoning?: number;
}

export function ModelConfidenceSnapshot({
  nlp = 91,
  vision = 84,
  audio = 88,
  reasoning = 87,
}: ModelConfidenceProps) {
  const models = [
    { name: "NLP", value: nlp },
    { name: "Vision", value: vision },
    { name: "Audio", value: audio },
    { name: "Reasoning", value: reasoning },
  ];

  return (
    <Card
      padding="md"
      radius="md"
      bg="dark.7"
      style={{ border: "1px solid var(--mantine-color-dark-5)" }}
    >
      <Text fw={600} size="sm" mb="md">
        Model Confidence
      </Text>
      <Stack gap="sm">
        {models.map((m) => (
          <div key={m.name}>
            <Text size="xs" fw={500} mb={4}>
              {m.name}
            </Text>
            <ConfidenceBar value={m.value} showLabel={false} size="sm" />
            <Text size="xs" c="dimmed" ta="right" mt={2} ff="var(--mantine-font-family-monospace)">
              {m.value}%
            </Text>
          </div>
        ))}
      </Stack>
    </Card>
  );
}
