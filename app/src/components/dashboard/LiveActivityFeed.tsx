import { Card, Text, Stack, ScrollArea } from "@mantine/core";
import {
  ActivityFeedItem,
  type ActivityItem,
} from "../intelligence/ActivityFeedItem";
import type { ConsultationDetail } from "../../types/api";

interface Props {
  consultations: ConsultationDetail[];
}

function buildActivityItems(consultations: ConsultationDetail[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const c of consultations) {
    if (c.status === "active") {
      items.push({
        id: `${c.id}-active`,
        type: "analysis",
        title: `Session ${c.id.slice(0, 8)} reasoning`,
        detail: `${c.consultation_type === "face_to_face" ? "Face-to-face" : "Phone"} consultation active`,
        timestamp: c.started_at,
      });
    } else if (c.status === "completed") {
      items.push({
        id: `${c.id}-complete`,
        type: "complete",
        title: `Session ${c.id.slice(0, 8)} completed`,
        detail: c.summary?.slice(0, 60) ?? "Consultation completed",
        timestamp: c.ended_at ?? c.started_at,
      });
    }
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 20);
}

export function LiveActivityFeed({ consultations }: Props) {
  const items = buildActivityItems(consultations);

  return (
    <Card
      padding="md"
      radius="md"
      bg="dark.7"
      h="100%"
      style={{ border: "1px solid var(--mantine-color-dark-5)" }}
    >
      <Text fw={600} size="sm" mb="md">
        Live AI Activity
      </Text>
      <ScrollArea h={360} type="hover">
        {items.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="xl">
            No recent activity. Start a consultation to see live reasoning events.
          </Text>
        ) : (
          <Stack gap={6} role="list" aria-label="Live AI activity feed">
            {items.map((item) => (
              <ActivityFeedItem key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Card>
  );
}
