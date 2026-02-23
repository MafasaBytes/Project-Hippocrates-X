import { Grid, Title, Stack, Skeleton, Card } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { consultationsApi } from "../api/consultations";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { SystemStatusBar } from "../components/dashboard/SystemStatusBar";
import { ConsultationPipeline } from "../components/dashboard/ConsultationPipeline";
import { LiveActivityFeed } from "../components/dashboard/LiveActivityFeed";
import {
  RiskDistribution,
  ModelConfidenceSnapshot,
} from "../components/dashboard/RiskDistribution";

function DashboardSkeleton() {
  return (
    <Stack gap="md">
      <Card padding="sm" radius="md" bg="dark.8">
        <Skeleton height={24} />
      </Card>
      <Grid>
        {[1, 2, 3, 4].map((i) => (
          <Grid.Col key={i} span={{ base: 6, md: 3 }}>
            <Card padding="lg" radius="md" bg="dark.7">
              <Skeleton height={12} width="60%" mb="md" />
              <Skeleton height={36} width="50%" />
            </Card>
          </Grid.Col>
        ))}
      </Grid>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card padding="md" radius="md" bg="dark.7">
            <Skeleton height={16} width="40%" mb="md" />
            <Stack gap="xs">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={32} />
              ))}
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card padding="md" radius="md" bg="dark.7">
            <Skeleton height={16} width="40%" mb="md" />
            <Stack gap="xs">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={32} />
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export function DashboardPage() {
  useDocumentTitle("Command Center");
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => consultationsApi.list({ limit: 20 }),
  });

  const active = consultations.filter((c) => c.status === "active").length;
  const pending = consultations.filter((c) => c.status === "active").length;

  if (isLoading) {
    return (
      <>
        <Title order={1} mb="md">
          Command Center
        </Title>
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <Stack gap="md">
      <Title order={1}>Command Center</Title>

      <SystemStatusBar />

      <StatsGrid
        activeConsultations={active}
        pendingReviews={pending}
      />

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <ConsultationPipeline consultations={consultations} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <LiveActivityFeed consultations={consultations} />
        </Grid.Col>
      </Grid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <RiskDistribution />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <ModelConfidenceSnapshot />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
