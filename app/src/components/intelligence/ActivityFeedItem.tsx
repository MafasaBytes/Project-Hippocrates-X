import { Group, Text, ThemeIcon, Card, type MantineColor } from "@mantine/core";
import {
  IconBrain,
  IconAlertTriangle,
  IconCheck,
  IconUpload,
  IconMicrophone,
  IconEye,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type ActivityType = "analysis" | "anomaly" | "complete" | "upload" | "transcription" | "review";

const TYPE_CONFIG: Record<ActivityType, { icon: React.ElementType; color: MantineColor }> = {
  analysis: { icon: IconBrain, color: "indigo" },
  anomaly: { icon: IconAlertTriangle, color: "alert" },
  complete: { icon: IconCheck, color: "success" },
  upload: { icon: IconUpload, color: "clinical" },
  transcription: { icon: IconMicrophone, color: "clinical" },
  review: { icon: IconEye, color: "warning" },
};

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  timestamp: string;
}

interface ActivityFeedItemProps {
  item: ActivityItem;
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.analysis;
  const Icon = config.icon;

  return (
    <Card padding="xs" radius="md" bg="dark.6" role="listitem">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size="sm" variant="light" color={config.color} radius="xl" mt={2}>
          <Icon size={12} />
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" fw={500} lineClamp={1}>
            {item.title}
          </Text>
          {item.detail && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {item.detail}
            </Text>
          )}
        </div>
        <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)" style={{ whiteSpace: "nowrap" }}>
          {dayjs(item.timestamp).fromNow(true)}
        </Text>
      </Group>
    </Card>
  );
}
