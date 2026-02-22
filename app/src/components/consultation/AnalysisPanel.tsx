import { useState } from "react";
import {
  Card,
  Text,
  Textarea,
  Button,
  Stack,
  Accordion,
  Badge,
  Group,
  Divider,
} from "@mantine/core";
import { IconBrain } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { analysisApi } from "../../api/analysis";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { AnalysisOut } from "../../types/api";

interface Props {
  consultationId: string;
}

function parseConfidence(text: string): number | null {
  const match = text.match(/confidence[:\s]*(\d{1,3})%/i);
  return match ? parseInt(match[1], 10) : null;
}

export function AnalysisPanel({ consultationId }: Props) {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<AnalysisOut[]>([]);

  const mutation = useMutation({
    mutationFn: (p: string) =>
      analysisApi.analyzeInConsultation(consultationId, { prompt: p }),
    onSuccess: (result) => {
      setHistory((prev) => [result, ...prev]);
      setPrompt("");
    },
  });

  return (
    <Card withBorder padding="md" h="100%">
      <Text fw={600} mb="sm">
        Analysis
      </Text>
      <Stack gap="sm">
        <Textarea
          placeholder="Ask about this consultation..."
          minRows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
        />
        <Button
          leftSection={<IconBrain size={16} />}
          onClick={() => prompt.trim() && mutation.mutate(prompt.trim())}
          loading={mutation.isPending}
          disabled={!prompt.trim()}
        >
          Analyze
        </Button>

        {mutation.isPending && (
          <Text size="sm" c="dimmed">
            Processing multi-modal analysis...
          </Text>
        )}

        {history.length > 0 && (
          <>
            <Divider />
            <Accordion variant="separated">
              {history.map((r, i) => {
                const confidence = parseConfidence(r.response);
                return (
                  <Accordion.Item key={`${r.analysis_id}-${i}`} value={`${i}`}>
                    <Accordion.Control>
                      <Group gap="xs">
                        <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                          {history.length - i}. Analysis
                        </Text>
                        {r.modalities_used.map((m) => (
                          <Badge key={m} size="xs" variant="dot">
                            {m}
                          </Badge>
                        ))}
                        {confidence !== null && (
                          <ConfidenceBadge value={confidence} />
                        )}
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Text
                        size="sm"
                        style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                      >
                        {r.response}
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        mt="xs"
                        ff="var(--mantine-font-family-monospace)"
                      >
                        Model: {r.model}
                      </Text>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </>
        )}
      </Stack>
    </Card>
  );
}
