import { useNavigate } from "react-router-dom";
import {
  Card,
  Text,
  Stack,
  Group,
  Badge,
  ScrollArea,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconCheck,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ConsultationDetail } from "../../types/api";

dayjs.extend(relativeTime);

interface Props {
  consultations: ConsultationDetail[];
}

function PipelineStage({
  title,
  icon,
  color,
  items,
  onItemClick,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  items: ConsultationDetail[];
  onItemClick: (id: string) => void;
}) {
  const Icon = icon;
  return (
    <div>
      <Group gap="xs" mb="xs">
        <ThemeIcon size="xs" variant="light" color={color} radius="xl">
          <Icon size={10} />
        </ThemeIcon>
        <Text size="xs" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }} c="dimmed">
          {title}
        </Text>
        <Badge size="xs" variant="filled" color={color} circle>
          {items.length}
        </Badge>
      </Group>
      {items.length === 0 ? (
        <Text size="xs" c="dimmed" pl="md" mb="sm">
          None
        </Text>
      ) : (
        <Stack gap={6} mb="sm">
          {items.map((c) => (
            <Card
              key={c.id}
              padding="xs"
              radius="sm"
              bg="dark.6"
              tabIndex={0}
              role="button"
              style={{ cursor: "pointer", transition: "background 0.15s" }}
              onClick={() => onItemClick(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onItemClick(c.id);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--mantine-color-dark-5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--mantine-color-dark-6)";
              }}
              aria-label={`Consultation ${c.id.slice(0, 8)}, ${c.status}`}
            >
              <Group justify="space-between" gap="xs" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                  <Text size="xs" ff="var(--mantine-font-family-monospace)" fw={500} truncate>
                    {c.id.slice(0, 8)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {c.consultation_type === "face_to_face" ? "F2F" : "Phone"}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)" style={{ whiteSpace: "nowrap" }}>
                  {dayjs(c.started_at).fromNow(true)}
                </Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </div>
  );
}

export function ConsultationPipeline({ consultations }: Props) {
  const navigate = useNavigate();
  const active = consultations.filter((c) => c.status === "active");
  const completed = consultations.filter((c) => c.status === "completed");

  return (
    <Card
      padding="md"
      radius="md"
      bg="dark.7"
      h="100%"
      style={{ border: "1px solid var(--mantine-color-dark-5)" }}
    >
      <Text fw={600} size="sm" mb="md">
        Consultation Pipeline
      </Text>
      <ScrollArea h={360} type="hover">
        <PipelineStage
          title="Active"
          icon={IconPlayerPlay}
          color="clinical"
          items={active}
          onItemClick={(id) => navigate(`/consultations/${id}`)}
        />
        <PipelineStage
          title="Completed"
          icon={IconCheck}
          color="success"
          items={completed.slice(0, 10)}
          onItemClick={(id) => navigate(`/consultations/${id}`)}
        />
      </ScrollArea>
    </Card>
  );
}
