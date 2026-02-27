import { useState } from "react";
import {
  Stack,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Textarea,
  Tooltip,
  ThemeIcon,
  Loader,
  Paper,
  Divider,
} from "@mantine/core";
import {
  IconCalendarDue,
  IconCheck,
  IconX,
  IconBrain,
  IconStethoscope,
  IconPill,
  IconFlask,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { followUpsApi, type FollowUp } from "../../api/followUps";
import dayjs from "dayjs";

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  appointment: { label: "Appointment", color: "blue", icon: IconCalendarDue },
  lab_check: { label: "Lab Check", color: "violet", icon: IconFlask },
  medication_review: { label: "Medication Review", color: "orange", icon: IconPill },
  symptom_check: { label: "Symptom Check", color: "teal", icon: IconStethoscope },
  custom: { label: "Custom", color: "gray", icon: IconAlertCircle },
};

const STATUS_COLOR: Record<string, string> = {
  pending: "blue",
  completed: "green",
  overdue: "red",
  cancelled: "gray",
};

function FollowUpCard({ followUp }: { followUp: FollowUp }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () =>
      followUpsApi.update(followUp.id, {
        status: "completed",
        outcome_notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      setShowNotes(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      followUpsApi.update(followUp.id, { status: "cancelled" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
  });

  const config = TYPE_CONFIG[followUp.type] ?? TYPE_CONFIG.custom;
  const isActionable = followUp.status === "pending" || followUp.status === "overdue";
  const isOverdue = followUp.status === "overdue";
  const dueDate = dayjs(followUp.due_date);

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={
        isOverdue
          ? { borderColor: "var(--mantine-color-red-7)", borderWidth: 2 }
          : undefined
      }
    >
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color={config.color}>
            <config.icon size={14} />
          </ThemeIcon>
          <Badge variant="light" color={config.color} size="sm">
            {config.label}
          </Badge>
          <Badge variant="dot" color={STATUS_COLOR[followUp.status]} size="sm">
            {followUp.status}
          </Badge>
          {followUp.ai_generated && (
            <Tooltip label={followUp.ai_reasoning ?? "AI-generated"} multiline w={300}>
              <Badge variant="outline" color="indigo" size="xs" leftSection={<IconBrain size={10} />}>
                AI
              </Badge>
            </Tooltip>
          )}
        </Group>
        <Text size="xs" c={isOverdue ? "red" : "dimmed"} fw={isOverdue ? 600 : 400}>
          Due {dueDate.format("MMM D, YYYY")}
        </Text>
      </Group>

      <Text size="sm" mb="xs">
        {followUp.description}
      </Text>

      {followUp.outcome_notes && (
        <Text size="xs" c="dimmed" mb="xs">
          Outcome: {followUp.outcome_notes}
        </Text>
      )}

      {isActionable && !showNotes && (
        <Group gap="xs" mt="xs">
          <Button
            size="xs"
            variant="light"
            color="green"
            leftSection={<IconCheck size={14} />}
            onClick={() => setShowNotes(true)}
          >
            Complete
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            leftSection={<IconX size={14} />}
            onClick={() => cancelMutation.mutate()}
            loading={cancelMutation.isPending}
          >
            Cancel
          </Button>
        </Group>
      )}

      {showNotes && (
        <Stack gap="xs" mt="xs">
          <Textarea
            placeholder="Outcome notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            minRows={2}
            autosize
            size="xs"
          />
          <Group gap="xs">
            <Button
              size="xs"
              color="green"
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
            >
              Confirm Complete
            </Button>
            <Button size="xs" variant="subtle" onClick={() => setShowNotes(false)}>
              Back
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  );
}

interface FollowUpPanelProps {
  patientId?: string;
  doctorId?: string;
  showTitle?: boolean;
  limit?: number;
}

export function FollowUpPanel({
  patientId,
  doctorId,
  showTitle = true,
  limit = 20,
}: FollowUpPanelProps) {
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ["follow-ups", { patientId, doctorId }],
    queryFn: () =>
      followUpsApi.list({
        patient_id: patientId,
        doctor_id: doctorId,
        limit,
      }),
  });

  const pending = followUps.filter((f) => f.status === "pending" || f.status === "overdue");
  const completed = followUps.filter((f) => f.status === "completed");

  if (isLoading) {
    return (
      <Card withBorder padding="md">
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading follow-ups...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {showTitle && (
        <Group gap="xs">
          <ThemeIcon size="md" variant="light" color="blue">
            <IconCalendarDue size={16} />
          </ThemeIcon>
          <Text fw={600}>Follow-Ups</Text>
          {pending.length > 0 && (
            <Badge color="blue" variant="filled" size="sm">
              {pending.length} pending
            </Badge>
          )}
        </Group>
      )}

      {followUps.length === 0 ? (
        <Card withBorder padding="md">
          <Text size="sm" c="dimmed" ta="center">
            No follow-ups yet.
          </Text>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Stack gap="xs">
              {pending.map((fu) => (
                <FollowUpCard key={fu.id} followUp={fu} />
              ))}
            </Stack>
          )}

          {completed.length > 0 && (
            <>
              <Divider label="Completed" labelPosition="center" />
              <Stack gap="xs">
                {completed.map((fu) => (
                  <FollowUpCard key={fu.id} followUp={fu} />
                ))}
              </Stack>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
