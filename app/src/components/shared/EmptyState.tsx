import { Card, Text, Stack, Group, Center, ThemeIcon, Button } from "@mantine/core";
import {
  IconAlertTriangle,
  IconDatabaseOff,
  IconSearchOff,
  IconMoodSad,
  IconBrain,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "search" | "database" | "empty" | "error" | "intelligence";
  action?: React.ReactNode;
  showConsultationCTA?: boolean;
  onBeginConsultation?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = "search",
  action,
  showConsultationCTA = false,
  onBeginConsultation,
}: EmptyStateProps) {
  const iconMap = {
    search: IconSearchOff,
    database: IconDatabaseOff,
    empty: IconMoodSad,
    error: IconAlertTriangle,
    intelligence: IconBrain,
  };

  const Icon = iconMap[icon];

  return (
    <Card padding="xl" radius="md" bg="dark.7" style={{ border: "1px solid var(--mantine-color-dark-5)" }}>
      <Center py="xl">
        <Stack gap="lg" align="center" maw={420}>
          <ThemeIcon size={56} variant="light" color={icon === "intelligence" ? "indigo" : "slate"} radius="xl">
            <Icon size={28} stroke={1.5} />
          </ThemeIcon>
          <Stack gap={4} align="center">
            <Text fw={600} size="lg" ta="center">
              {title}
            </Text>
            {description && (
              <Text size="sm" c="dimmed" ta="center" lh={1.6}>
                {description}
              </Text>
            )}
          </Stack>

          {showConsultationCTA && onBeginConsultation && (
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed" ta="center">
                Hippocrates X processes doctor's notes, images, audio, and video
                to deliver multimodal clinical reasoning in real-time.
              </Text>
              <Button
                size="md"
                leftSection={<IconPlayerPlay size={18} />}
                variant="gradient"
                gradient={{ from: "indigo.7", to: "clinical.7", deg: 135 }}
                radius="md"
                onClick={onBeginConsultation}
                aria-label="Begin AI-assisted consultation"
                mt="xs"
                styles={{
                  root: {
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  },
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 20px var(--mantine-color-indigo-9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Begin AI-Assisted Consultation
              </Button>
            </Stack>
          )}

          {action && !showConsultationCTA && <Group>{action}</Group>}
        </Stack>
      </Center>
    </Card>
  );
}
