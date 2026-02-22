import { Grid, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../api/consultations";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { RecentConsultations } from "../components/dashboard/RecentConsultations";
import { AnomalyFeed } from "../components/dashboard/AnomalyFeed";
import type { Anomaly } from "../components/dashboard/AnomalyFeed";

export function DashboardPage() {
  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => consultationsApi.list({ limit: 20 }),
  });

  const active = consultations.filter((c) => c.status === "active").length;
  const completed = consultations.filter((c) => c.status === "completed").length;

  // Anomalies would come from analysis results tagged as anomaly-type.
  // For now, this renders from the data when available.
  const anomalies: Anomaly[] = [];

  return (
    <>
      <Title order={2} mb="lg">
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
