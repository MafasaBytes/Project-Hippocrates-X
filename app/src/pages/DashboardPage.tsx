import { Grid, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { consultationsApi } from "../api/consultations";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { RecentConsultations } from "../components/dashboard/RecentConsultations";
import { AnomalyFeed } from "../components/dashboard/AnomalyFeed";
import {
  LoadingStatsGrid,
  LoadingConsultationList,
  LoadingCard,
} from "../components/shared/LoadingSkeleton";
import type { Anomaly } from "../components/dashboard/AnomalyFeed";

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => consultationsApi.list({ limit: 20 }),
  });

  const active = consultations.filter((c) => c.status === "active").length;
  const completed = consultations.filter((c) => c.status === "completed").length;

  // Anomalies would come from analysis results tagged as anomaly-type.
  const anomalies: Anomaly[] = [];

  if (isLoading) {
    return (
      <>
        <Title order={1} mb="lg">
          Dashboard
        </Title>
        <LoadingStatsGrid />
        <Grid mt="lg" gutter="md">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <LoadingConsultationList />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <LoadingCard />
          </Grid.Col>
        </Grid>
      </>
    );
  }

  return (
    <>
      <Title order={1} mb="lg">
        Dashboard
      </Title>

      <StatsGrid
        activeConsultations={active}
        patientsSeen={completed}
        analysesPerformed={0}
        pendingReviews={0}
      />

      <Grid mt="lg" gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <RecentConsultations consultations={consultations} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <AnomalyFeed anomalies={anomalies} />
        </Grid.Col>
      </Grid>
    </>
  );
}
