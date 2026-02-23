import { Skeleton, Card, Grid, Stack } from "@mantine/core";

export function LoadingCard() {
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Skeleton height={20} width="80%" />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </Stack>
    </Card>
  );
}

export function LoadingTable() {
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Skeleton height={16} width="50%" />
        <Skeleton height={16} width="70%" />
        <Skeleton height={16} width="60%" />
      </Stack>
    </Card>
  );
}

export function LoadingStatsGrid() {
  return (
    <Grid>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder padding="lg">
          <Skeleton height={12} width="60%" mb="md" />
          <Skeleton height={32} width="80%" />
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder padding="lg">
          <Skeleton height={12} width="60%" mb="md" />
          <Skeleton height={32} width="80%" />
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder padding="lg">
          <Skeleton height={12} width="60%" mb="md" />
          <Skeleton height={32} width="80%" />
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder padding="lg">
          <Skeleton height={12} width="60%" mb="md" />
          <Skeleton height={32} width="80%" />
        </Card>
      </Grid.Col>
    </Grid>
  );
}

export function LoadingConsultationList() {
  return (
    <Card withBorder padding="md">
      <Skeleton height={20} width="50%" mb="md" />
      <Stack gap="xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={40} />
        ))}
      </Stack>
    </Card>
  );
}
