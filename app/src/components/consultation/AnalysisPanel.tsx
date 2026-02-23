import { useState, useRef, useEffect } from "react";
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
  Transition,
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
  const analysisResultsRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (p: string) =>
      analysisApi.analyzeInConsultation(consultationId, { prompt: p }),
    onSuccess: (result) => {
      setHistory((prev) => [result, ...prev]);
      setPrompt("");
      isProcessingRef.current = false;
    },
    onError: (error: { message?: string }) => {
      isProcessingRef.current = false;
      // Error handling will be improved in Phase 1 error handling
    },
  });

  // Announce new analysis results to screen readers
  useEffect(() => {
    if (history.length > 0 && analysisResultsRef.current) {
      analysisResultsRef.current.setAttribute("aria-live", "polite");
      analysisResultsRef.current.setAttribute("aria-atomic", "true");
      analysisResultsRef.current.setAttribute("aria-relevant", "additions text");
    }
  }, [history]);

  const handleAnalyze = () => {
    if (prompt.trim()) {
      isProcessingRef.current = true;
      mutation.mutate(prompt.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <Card withBorder padding="md" h="100%" role="region" aria-label="AI analysis tools and results">
      <Text fw={600} mb="sm" id="analysis-title">
        Analysis
      </Text>
      <Stack gap="sm">
        <Textarea
          placeholder="Ask about this consultation..."
          minRows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          aria-label="Analysis prompt input"
          onKeyDown={handleKeyPress}
          description="Enter questions or analysis requests about this consultation"
        />
        <Button
          leftSection={<IconBrain size={16} />}
          onClick={handleAnalyze}
          loading={mutation.isPending}
          disabled={!prompt.trim() || mutation.isPending}
          aria-label="Run AI analysis"
          aria-busy={mutation.isPending}
        >
          Analyze
        </Button>

        <Transition transition="fade" mounted={mutation.isPending}>
          {(styles) => (
            <Text size="sm" c="dimmed" style={styles} role="status" aria-live="polite">
              Processing multi-modal analysis...
            </Text>
          )}
        </Transition>

        {history.length > 0 && (
          <>
            <Divider />
            <div ref={analysisResultsRef} aria-label="Analysis results">
              <Accordion variant="separated">
                {history.map((r, i) => {
                  const confidence = parseConfidence(r.response);
                  return (
                    <Accordion.Item
                      key={`${r.analysis_id}-${i}`}
                      value={`${i}`}
                      aria-label={`Analysis result ${history.length - i}`}
                    >
                      <Accordion.Control id={`analysis-control-${i}`}>
                        <Group gap="xs">
                          <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                            {history.length - i}. Analysis
                          </Text>
                          {r.modalities_used.map((m) => (
                            <Badge key={m} size="xs" variant="dot" aria-label={`${m} modality used`}>
                              {m}
                            </Badge>
                          ))}
                          {confidence !== null && (
                            <ConfidenceBadge value={confidence} aria-hidden={true} />
                          )}
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text
                          size="sm"
                          style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                          aria-label="Analysis response text"
                        >
                          {r.response}
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          mt="xs"
                          ff="var(--mantine-font-family-monospace)"
                          aria-label={`Model used: ${r.model}`}
                        >
                          Model: {r.model}
                        </Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </div>
          </>
        )}
      </Stack>
    </Card>
  );
}
