import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Grid,
  Group,
  Button,
  Text,
  Switch,
  Divider,
  Card,
  Badge,
  Modal,
  Stack,
  Anchor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlayerStop, IconUser } from "@tabler/icons-react";
import { consultationsApi } from "../../api/consultations";
import { patientsApi } from "../../api/patients";
import { InputPanel } from "./InputPanel";
import { AnalysisPanel } from "./AnalysisPanel";
import { TranscriptionPanel } from "./TranscriptionPanel";
import type { ConsultationDetail } from "../../types/api";
import dayjs from "dayjs";

interface Props {
  consultation: ConsultationDetail;
}

export function ConsultationWorkspace({ consultation }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [generateSummary, setGenerateSummary] = useState(true);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
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

  const { data: patient } = useQuery({
    queryKey: ["patient", consultation.patient_id],
    queryFn: () => patientsApi.get(consultation.patient_id),
    enabled: !!consultation.patient_id,
  });

  const isPhone = consultation.consultation_type === "phone_call";

  return (
    <>
      {patient && (
        <Card withBorder padding="sm" mb="md" bg="gray.0" role="region" aria-label="Patient context">
          <Group gap="md" wrap="wrap">
            <Group gap="xs">
              <IconUser size={18} aria-hidden />
              <Text size="sm" fw={600}>
                {patient.name}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
              MRN: {patient.medical_record_number ?? "—"}
            </Text>
            {patient.date_of_birth && (
              <Text size="xs" c="dimmed">
                DOB: {dayjs(patient.date_of_birth).format("MMM D, YYYY")}
              </Text>
            )}
            <Anchor component={Link} to={`/patients/${patient.id}`} size="xs">
              View patient
            </Anchor>
          </Group>
        </Card>
      )}

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
            onClick={() => setEndConfirmOpen(true)}
            loading={endMutation.isPending}
            aria-label="End consultation and optionally generate summary"
          >
            End Consultation
          </Button>
        </Group>
      </Card>

      <Modal
        opened={endConfirmOpen}
        onClose={() => setEndConfirmOpen(false)}
        title="End consultation?"
        centered
        aria-labelledby="end-consultation-title"
      >
        <Stack gap="md">
          <Text id="end-consultation-title" size="sm" c="dimmed">
            This will end the current session. A summary will be generated if
            &quot;Auto-generate summary&quot; is enabled.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setEndConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconPlayerStop size={16} />}
              onClick={() => {
                setEndConfirmOpen(false);
                endMutation.mutate();
              }}
              loading={endMutation.isPending}
            >
              End session
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
