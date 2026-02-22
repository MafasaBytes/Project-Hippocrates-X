import { SimpleGrid, Card, Text, Group } from "@mantine/core";
import {
  IconStethoscope,
  IconUsers,
  IconBrain,
  IconClipboardCheck,
} from "@tabler/icons-react";

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

function StatCard({ label, value, icon: Icon }: StatProps) {
  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.03em" }}>
          {label}
        </Text>
        <Icon size={20} stroke={1.5} color="var(--mantine-color-indigo-5)" />
      </Group>
      <Text fw={700} size="xl" ff="var(--mantine-font-family-monospace)">
        {value}
      </Text>
    </Card>
  );
}

interface StatsGridProps {
  activeConsultations: number;
  patientsSeen: number;
  analysesPerformed: number;
  pendingReviews: number;
}

export function StatsGrid({
  activeConsultations,
  patientsSeen,
  analysesPerformed,
  pendingReviews,
}: StatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 2, md: 4 }}>
      <StatCard label="Active Consultations" value={activeConsultations} icon={IconStethoscope} />
      <StatCard label="Patients Today" value={patientsSeen} icon={IconUsers} />
      <StatCard label="Analyses Performed" value={analysesPerformed} icon={IconBrain} />
      <StatCard label="Pending Reviews" value={pendingReviews} icon={IconClipboardCheck} />
    </SimpleGrid>
  );
}
