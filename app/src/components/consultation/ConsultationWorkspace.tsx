import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Group,
  Button,
  Text,
  Switch,
  Divider,
  Card,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlayerStop } from "@tabler/icons-react";
import { consultationsApi } from "../../api/consultations";
import { InputPanel } from "./InputPanel";
import { AnalysisPanel } from "./AnalysisPanel";
import { TranscriptionPanel } from "./TranscriptionPanel";
import type { ConsultationDetail } from "../../types/api";

interface Props {
  consultation: ConsultationDetail;
}

export function ConsultationWorkspace({ consultation }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [generateSummary, setGenerateSummary] = useState(true);
  const [elapsed, setElapsed] = useState("00:00:00");
  const startRef = useRef(new Date(consultation.started_at));

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - startRef.current.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const endMutation = useMutation({
    mutationFn: () =>
      consultationsApi.end(consultation.id, { generate_summary: generateSummary }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultation", consultation.id] });
      qc.invalidateQueries({ queryKey: ["consultations"] });
      notifications.show({
        title: "Consultation ended",
        message: "Session summary has been generated",
        color: "green",
      });
      navigate("/consultations");
    },
  });

  const isPhone = consultation.consultation_type === "phone_call";

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Badge variant="light" color="blue" size="lg">
            {consultation.consultation_type === "face_to_face"
              ? "Face to Face"
              : "Phone Call"}
          </Badge>
          <Text size="sm" ff="var(--mantine-font-family-monospace)" c="dimmed">
            ID: {consultation.id.slice(0, 8)}
          </Text>
        </Group>
        <Text fw={600} ff="var(--mantine-font-family-monospace)" size="lg">
          {elapsed}
        </Text>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: isPhone ? 4 : 5 }}>
          <InputPanel consultationId={consultation.id} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: isPhone ? 5 : 7 }}>
          <AnalysisPanel consultationId={consultation.id} />
        </Grid.Col>
        {isPhone && (
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TranscriptionPanel />
          </Grid.Col>
        )}
      </Grid>

      <Divider my="lg" />

      <Card withBorder padding="sm">
        <Group justify="space-between">
          <Group gap="md">
            <Switch
              label="Auto-generate summary"
              checked={generateSummary}
              onChange={(e) => setGenerateSummary(e.currentTarget.checked)}
              size="sm"
            />
          </Group>
          <Button
            color="red"
            variant="light"
            leftSection={<IconPlayerStop size={16} />}
            onClick={() => endMutation.mutate()}
            loading={endMutation.isPending}
          >
            End Consultation
          </Button>
        </Group>
      </Card>
    </>
  );
}
