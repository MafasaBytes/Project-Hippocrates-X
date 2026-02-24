import {
  Timeline,
  Text,
  Badge,
  Group,
  Card,
} from "@mantine/core";
import {
  IconStethoscope,
  IconFileText,
  IconPhoto,
  IconPill,
  IconArrowRight,
  IconNotes,
  IconDots,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import type { TimelineEntry } from "../../types/api";

const RECORD_TYPE_ICONS: Record<string, React.ReactNode> = {
  lab_result: <IconFileText size={16} />,
  imaging: <IconPhoto size={16} />,
  prescription: <IconPill size={16} />,
  referral: <IconArrowRight size={16} />,
  clinical_note: <IconNotes size={16} />,
  other: <IconDots size={16} />,
};

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

interface Props {
  entries: TimelineEntry[];
}

export function PatientTimeline({ entries }: Props) {
  const navigate = useNavigate();

  if (entries.length === 0) {
    return (
      <Card withBorder padding="lg">
        <Text size="sm" c="dimmed" ta="center">
          No timeline entries yet. Start a consultation or upload medical records
          to build this patient's history.
        </Text>
      </Card>
    );
  }

  return (
    <Timeline active={0} bulletSize={28} lineWidth={2}>
      {entries.map((entry) => (
        <Timeline.Item
          key={`${entry.entry_type}-${entry.id}`}
          bullet={
            entry.entry_type === "consultation" ? (
              <IconStethoscope size={14} />
            ) : (
              RECORD_TYPE_ICONS[entry.record_type ?? "other"] ?? (
                <IconDots size={14} />
              )
            )
          }
          title={
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {entry.title}
              </Text>
              {entry.entry_type === "consultation" && entry.status && (
                <Badge
                  size="xs"
                  variant="light"
                  color={STATUS_COLOR[entry.status] ?? "gray"}
                >
                  {entry.status}
                </Badge>
              )}
              {entry.entry_type === "medical_record" && entry.record_type && (
                <Badge size="xs" variant="light" color="indigo">
                  {entry.record_type.replace(/_/g, " ")}
                </Badge>
              )}
            </Group>
          }
        >
          <Text size="xs" c="dimmed" mt={4}>
            {dayjs(entry.date).format("MMM D, YYYY [at] h:mm A")}
          </Text>
          {entry.entry_type === "consultation" && entry.summary && (
            <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
              {entry.summary}
            </Text>
          )}
          {entry.entry_type === "medical_record" && entry.description && (
            <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
              {entry.description}
            </Text>
          )}
          {entry.entry_type === "consultation" && (
            <Text
              size="xs"
              c="indigo"
              mt={4}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/consultations/${entry.id}`)}
            >
              View consultation
            </Text>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
