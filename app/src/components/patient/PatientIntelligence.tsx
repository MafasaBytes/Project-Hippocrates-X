import { useState } from "react";
import {
  Stack,
  Card,
  Text,
  Button,
  Textarea,
  Group,
  Badge,
  Divider,
  TagsInput,
  Tabs,
  Loader,
  Alert,
  Paper,
  ScrollArea,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconBrain,
  IconMessageQuestion,
  IconStethoscope,
  IconPill,
  IconAlertCircle,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import {
  patientIntelligenceApi,
  type IntelligenceResponse,
} from "../../api/patientIntelligence";

interface Props {
  patientId: string;
}

function ResponseCard({
  result,
  label,
}: {
  result: IntelligenceResponse;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <Badge variant="light" color="indigo" size="sm">
            {label}
          </Badge>
          <Badge variant="dot" color="gray" size="xs">
            {result.model}
          </Badge>
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {new Date(result.generated_at).toLocaleString()}
          </Text>
          <Tooltip label={copied ? "Copied" : "Copy response"}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleCopy}
              color={copied ? "green" : "gray"}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <ScrollArea.Autosize mah={500}>
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {result.response}
        </Text>
      </ScrollArea.Autosize>
    </Paper>
  );
}

export function PatientIntelligence({ patientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { label: string; data: IntelligenceResponse }[]
  >([]);

  // Ask tab state
  const [question, setQuestion] = useState("");

  // Differential tab state
  const [symptoms, setSymptoms] = useState<string[]>([]);

  // Treatment tab state
  const [treatments, setTreatments] = useState<string[]>([]);

  const runAction = async (
    label: string,
    action: () => Promise<IntelligenceResponse>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await action();
      if (data.error) {
        setError(data.error);
      } else {
        setResults((prev) => [{ label, data }, ...prev]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Card withBorder padding="md">
        <Group gap="xs" mb="md">
          <ThemeIcon size="md" variant="light" color="indigo">
            <IconBrain size={16} />
          </ThemeIcon>
          <Text fw={600}>AI Patient Intelligence</Text>
          <Text size="xs" c="dimmed">
            Deep-dive analysis outside consultations
          </Text>
        </Group>

        <Tabs defaultValue="deep-dive">
          <Tabs.List>
            <Tabs.Tab
              value="deep-dive"
              leftSection={<IconBrain size={14} />}
            >
              Deep Dive
            </Tabs.Tab>
            <Tabs.Tab
              value="ask"
              leftSection={<IconMessageQuestion size={14} />}
            >
              Ask AI
            </Tabs.Tab>
            <Tabs.Tab
              value="differential"
              leftSection={<IconStethoscope size={14} />}
            >
              Differential Dx
            </Tabs.Tab>
            <Tabs.Tab
              value="treatments"
              leftSection={<IconPill size={14} />}
            >
              Compare Treatments
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="deep-dive" pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Run a comprehensive AI analysis of this patient's entire clinical
                history — patterns, risks, trends, and recommendations.
              </Text>
              <Button
                leftSection={<IconBrain size={16} />}
                onClick={() =>
                  runAction("Deep Dive", () =>
                    patientIntelligenceApi.deepDive(patientId)
                  )
                }
                loading={loading}
                variant="gradient"
                gradient={{ from: "indigo.7", to: "violet.7", deg: 135 }}
              >
                Run Deep Dive Analysis
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="ask" pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Ask any clinical question about this patient. The AI has access
                to their full history, records, and past analysis results.
              </Text>
              <Textarea
                placeholder="e.g. Is this patient at risk for cardiac events given their recent labs?"
                value={question}
                onChange={(e) => setQuestion(e.currentTarget.value)}
                minRows={3}
                autosize
              />
              <Button
                leftSection={<IconMessageQuestion size={16} />}
                onClick={() => {
                  if (!question.trim()) return;
                  runAction("AI Answer", () =>
                    patientIntelligenceApi.ask(patientId, question.trim())
                  );
                }}
                loading={loading}
                disabled={!question.trim()}
              >
                Ask Question
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="differential" pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Enter new symptoms to generate a differential diagnosis ranked
                by the patient's full clinical history.
              </Text>
              <TagsInput
                placeholder="Type a symptom and press Enter"
                value={symptoms}
                onChange={setSymptoms}
                clearable
              />
              <Button
                leftSection={<IconStethoscope size={16} />}
                onClick={() => {
                  if (symptoms.length === 0) return;
                  runAction("Differential Dx", () =>
                    patientIntelligenceApi.differential(patientId, symptoms)
                  );
                }}
                loading={loading}
                disabled={symptoms.length === 0}
              >
                Generate Differential
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="treatments" pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Enter treatment options to compare them against the patient's
                allergies, conditions, medications, and history.
              </Text>
              <TagsInput
                placeholder="Type a treatment option and press Enter"
                value={treatments}
                onChange={setTreatments}
                clearable
              />
              <Button
                leftSection={<IconPill size={16} />}
                onClick={() => {
                  if (treatments.length < 2) return;
                  runAction("Treatment Comparison", () =>
                    patientIntelligenceApi.compareTreatments(
                      patientId,
                      treatments
                    )
                  );
                }}
                loading={loading}
                disabled={treatments.length < 2}
              >
                Compare Treatments
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>

      {loading && (
        <Card withBorder padding="md">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Analyzing patient data... this may take a moment.
            </Text>
          </Group>
        </Card>
      )}

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Analysis Error"
          color="red"
          variant="light"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <>
          <Divider label="Results" labelPosition="center" />
          <Stack gap="md">
            {results.map((r, i) => (
              <ResponseCard key={i} result={r.data} label={r.label} />
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
