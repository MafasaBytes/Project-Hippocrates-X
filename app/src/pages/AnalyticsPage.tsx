import {
  Grid,
  Title,
  Stack,
  Card,
  Text,
  Group,
  Badge,
  SimpleGrid,
  ThemeIcon,
  Progress,
  Table,
  Loader,
  Select,
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconStethoscope,
  IconBrain,
  IconAlertTriangle,
  IconCalendarDue,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { analyticsApi } from "../api/analytics";

const CHART_COLORS = [
  "#4c6ef5",
  "#7950f2",
  "#ae3ec9",
  "#e64980",
  "#f76707",
  "#20c997",
  "#339af0",
  "#fcc419",
];

function StatCard({
  title,
  value,
  subtitle,
  color,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {title}
        </Text>
        <ThemeIcon size="sm" variant="light" color={color}>
          <Icon size={14} />
        </ThemeIcon>
      </Group>
      <Text fw={700} size="xl">
        {value}
      </Text>
      {subtitle && (
        <Text size="xs" c="dimmed" mt={4}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

export function AnalyticsPage() {
  useDocumentTitle("Analytics");
  const [days, setDays] = useState("30");

  const { data: consStats, isLoading: loadingCons } = useQuery({
    queryKey: ["analytics", "consultations", days],
    queryFn: () => analyticsApi.consultationStats({ days: parseInt(days) }),
  });

  const { data: modality } = useQuery({
    queryKey: ["analytics", "modalities"],
    queryFn: () => analyticsApi.modalityUsage(),
  });

  const { data: demographics } = useQuery({
    queryKey: ["analytics", "demographics"],
    queryFn: () => analyticsApi.demographics(),
  });

  const { data: aiPerf } = useQuery({
    queryKey: ["analytics", "ai-performance", days],
    queryFn: () => analyticsApi.aiPerformance({ days: parseInt(days) }),
  });

  const { data: riskCohorts } = useQuery({
    queryKey: ["analytics", "risk-cohorts"],
    queryFn: () => analyticsApi.riskCohorts(),
  });

  const { data: fuStats } = useQuery({
    queryKey: ["analytics", "follow-up-stats"],
    queryFn: () => analyticsApi.followUpStats(),
  });

  if (loadingCons) {
    return (
      <Stack gap="md">
        <Title order={1}>Analytics</Title>
        <Card withBorder padding="xl">
          <Group gap="sm" justify="center">
            <Loader size="sm" />
            <Text c="dimmed">Loading analytics...</Text>
          </Group>
        </Card>
      </Stack>
    );
  }

  const dailyData = consStats
    ? Object.entries(consStats.by_day).map(([date, count]) => ({
        date: date.slice(5),
        consultations: count,
      }))
    : [];

  const modalityPieData = modality
    ? Object.entries(modality.counts).map(([name, value]) => ({ name, value }))
    : [];

  const genderPieData = demographics
    ? Object.entries(demographics.gender_distribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Title order={1}>Analytics</Title>
        <Select
          value={days}
          onChange={(v) => v && setDays(v)}
          data={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
            { value: "365", label: "Last year" },
          ]}
          w={160}
          size="sm"
        />
      </Group>

      {/* Top stats row */}
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <StatCard
          title="Total Consultations"
          value={consStats?.total ?? 0}
          subtitle={`${consStats?.completion_rate ?? 0}% completion rate`}
          color="blue"
          icon={IconStethoscope}
        />
        <StatCard
          title="Total Patients"
          value={demographics?.total_patients ?? 0}
          subtitle={`${demographics?.patients_with_chronic_conditions ?? 0} with chronic conditions`}
          color="violet"
          icon={IconUsers}
        />
        <StatCard
          title="AI Analyses"
          value={aiPerf?.total_analyses ?? 0}
          subtitle={`Avg ${aiPerf?.avg_output_tokens ?? 0} output tokens`}
          color="indigo"
          icon={IconBrain}
        />
        <StatCard
          title="Follow-Ups"
          value={fuStats?.total ?? 0}
          subtitle={`${fuStats?.ai_generated ?? 0} AI-generated`}
          color="teal"
          icon={IconCalendarDue}
        />
      </SimpleGrid>

      {/* Charts row */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder padding="md" radius="md">
            <Text fw={600} mb="md">
              Consultation Volume
            </Text>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#868e96", fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#868e96", fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#1a1b1e",
                      border: "1px solid #373a40",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="consultations"
                    fill="#4c6ef5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No consultation data for this period.
              </Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="md" radius="md" h="100%">
            <Text fw={600} mb="md">
              Input Modalities
            </Text>
            {modalityPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modalityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {modalityPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "#1a1b1e",
                      border: "1px solid #373a40",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No modality data yet.
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Demographics + Risk + Follow-up stats */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="md" radius="md">
            <Text fw={600} mb="md">
              Patient Demographics
            </Text>
            {genderPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={genderPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No patients registered yet.
              </Text>
            )}
            {demographics && demographics.total_patients > 0 && (
              <Stack gap="xs" mt="sm">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    With allergies
                  </Text>
                  <Text size="xs" fw={600}>
                    {demographics.patients_with_allergies}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Chronic conditions
                  </Text>
                  <Text size="xs" fw={600}>
                    {demographics.patients_with_chronic_conditions}
                  </Text>
                </Group>
              </Stack>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="md" radius="md">
            <Group gap="xs" mb="md">
              <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
              <Text fw={600}>Risk Cohorts</Text>
            </Group>
            {riskCohorts ? (
              <Stack gap="sm">
                <div>
                  <Group justify="space-between" mb={4}>
                    <Badge color="red" variant="light" size="sm">
                      High Risk
                    </Badge>
                    <Text size="sm" fw={600}>
                      {riskCohorts.high_risk_count}
                    </Text>
                  </Group>
                  <Progress
                    value={
                      riskCohorts.high_risk_count /
                      Math.max(
                        riskCohorts.high_risk_count +
                          riskCohorts.medium_risk_count +
                          riskCohorts.low_risk_count,
                        1
                      ) *
                      100
                    }
                    color="red"
                    size="sm"
                  />
                </div>
                <div>
                  <Group justify="space-between" mb={4}>
                    <Badge color="orange" variant="light" size="sm">
                      Medium Risk
                    </Badge>
                    <Text size="sm" fw={600}>
                      {riskCohorts.medium_risk_count}
                    </Text>
                  </Group>
                  <Progress
                    value={
                      riskCohorts.medium_risk_count /
                      Math.max(
                        riskCohorts.high_risk_count +
                          riskCohorts.medium_risk_count +
                          riskCohorts.low_risk_count,
                        1
                      ) *
                      100
                    }
                    color="orange"
                    size="sm"
                  />
                </div>
                <div>
                  <Group justify="space-between" mb={4}>
                    <Badge color="green" variant="light" size="sm">
                      Low Risk
                    </Badge>
                    <Text size="sm" fw={600}>
                      {riskCohorts.low_risk_count}
                    </Text>
                  </Group>
                  <Progress
                    value={
                      riskCohorts.low_risk_count /
                      Math.max(
                        riskCohorts.high_risk_count +
                          riskCohorts.medium_risk_count +
                          riskCohorts.low_risk_count,
                        1
                      ) *
                      100
                    }
                    color="green"
                    size="sm"
                  />
                </div>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No risk data available.
              </Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="md" radius="md">
            <Group gap="xs" mb="md">
              <IconCalendarDue size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>Follow-Up Overview</Text>
            </Group>
            {fuStats ? (
              <Stack gap="sm">
                {Object.entries(fuStats.by_status).map(([status, count]) => (
                  <Group key={status} justify="space-between">
                    <Badge
                      variant="light"
                      color={
                        status === "pending"
                          ? "blue"
                          : status === "completed"
                            ? "green"
                            : status === "overdue"
                              ? "red"
                              : "gray"
                      }
                      size="sm"
                    >
                      {status}
                    </Badge>
                    <Text size="sm" fw={600}>
                      {count}
                    </Text>
                  </Group>
                ))}
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">
                    AI-generated
                  </Text>
                  <Text size="xs" fw={600}>
                    {fuStats.ai_generated}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Manual
                  </Text>
                  <Text size="xs" fw={600}>
                    {fuStats.manual}
                  </Text>
                </Group>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                No follow-up data.
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* AI Performance */}
      <Card withBorder padding="md" radius="md">
        <Text fw={600} mb="md">
          AI Model Performance
        </Text>
        {aiPerf && aiPerf.total_analyses > 0 ? (
          <SimpleGrid cols={{ base: 2, md: 4 }}>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Total Analyses
              </Text>
              <Text size="lg" fw={700}>
                {aiPerf.total_analyses}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Input Tokens
              </Text>
              <Text size="lg" fw={700}>
                {aiPerf.avg_input_tokens}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Output Tokens
              </Text>
              <Text size="lg" fw={700}>
                {aiPerf.avg_output_tokens}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Models Used
              </Text>
              <Group gap={4} mt={4}>
                {Object.keys(aiPerf.models_used).map((model) => (
                  <Badge key={model} variant="dot" size="sm">
                    {model}
                  </Badge>
                ))}
              </Group>
            </div>
          </SimpleGrid>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No AI analysis data for this period.
          </Text>
        )}
      </Card>
    </Stack>
  );
}
