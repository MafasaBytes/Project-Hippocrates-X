import {
  SimpleGrid,
  Card,
  Text,
  Group,
  Stack,
  Progress,
  ThemeIcon,
  Box,
  type MantineColor,
} from "@mantine/core";
import {
  IconBrain,
  IconAlertOctagon,
  IconChartBar,
  IconClipboardCheck,
} from "@tabler/icons-react";

interface IntelligenceCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: MantineColor;
  progress?: number;
  pulse?: boolean;
}

function IntelligenceCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  progress,
  pulse,
}: IntelligenceCardProps) {
  return (
    <Card
      padding="lg"
      radius="md"
      bg="dark.7"
      style={{
        border: "1px solid var(--mantine-color-dark-5)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `var(--mantine-color-${color}-7)`;
        e.currentTarget.style.boxShadow = `0 0 20px var(--mantine-color-${color}-9)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--mantine-color-dark-5)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Group justify="space-between" mb="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>
          {label}
        </Text>
        <Box pos="relative">
          <ThemeIcon size="md" variant="light" color={color} radius="xl">
            <Icon size={16} />
          </ThemeIcon>
          {pulse && (
            <Box
              pos="absolute"
              top={-2}
              right={-2}
              w={8}
              h={8}
              style={{
                borderRadius: "50%",
                backgroundColor: `var(--mantine-color-${color}-5)`,
                animation: "pulse-ring 1.5s ease-in-out infinite",
              }}
            />
          )}
        </Box>
      </Group>
      <Stack gap={4}>
        <Text fw={700} size="1.75rem" ff="var(--mantine-font-family-monospace)" lh={1.1}>
          {value}
        </Text>
        {subtitle && (
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        )}
        {progress !== undefined && (
          <Progress value={progress} color={color} size="xs" radius="xl" mt={4} />
        )}
      </Stack>
    </Card>
  );
}

interface StatsGridProps {
  activeConsultations: number;
  highRiskPatients?: number;
  aiConfidence?: number;
  pendingReviews: number;
}

export function StatsGrid({
  activeConsultations,
  highRiskPatients = 0,
  aiConfidence = 87,
  pendingReviews,
}: StatsGridProps) {
  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <IntelligenceCard
          label="Active Reasoning"
          value={activeConsultations}
          subtitle="Live AI sessions"
          icon={IconBrain}
          color="clinical"
          pulse={activeConsultations > 0}
        />
        <IntelligenceCard
          label="High-Risk Patients"
          value={highRiskPatients}
          subtitle="Flagged for review"
          icon={IconAlertOctagon}
          color={highRiskPatients > 0 ? "alert" : "slate"}
        />
        <IntelligenceCard
          label="AI Confidence Avg"
          value={`${aiConfidence}%`}
          subtitle="Across all models"
          icon={IconChartBar}
          color={aiConfidence >= 80 ? "success" : aiConfidence >= 60 ? "warning" : "alert"}
          progress={aiConfidence}
        />
        <IntelligenceCard
          label="Pending Reviews"
          value={pendingReviews}
          subtitle="Awaiting clinician"
          icon={IconClipboardCheck}
          color={pendingReviews > 0 ? "warning" : "success"}
        />
      </SimpleGrid>
    </>
  );
}
