import { Skeleton, Card, Grid, Stack, SimpleGrid } from "@mantine/core";

export function LoadingCard() {
  return (
    <Card padding="md" radius="md" bg="dark.7" style={{ border: "1px solid var(--mantine-color-dark-5)" }}>
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
    <Card padding="md" radius="md" bg="dark.7" style={{ border: "1px solid var(--mantine-color-dark-5)" }}>
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
    <SimpleGrid cols={{ base: 2, md: 4 }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding="lg" radius="md" bg="dark.7" style={{ border: "1px solid var(--mantine-color-dark-5)" }}>
          <Skeleton height={12} width="60%" mb="md" />
          <Skeleton height={32} width="80%" />
        </Card>
      ))}
    </SimpleGrid>
  );
}

export function LoadingConsultationList() {
  return (
    <Card padding="md" radius="md" bg="dark.7" style={{ border: "1px solid var(--mantine-color-dark-5)" }}>
      <Skeleton height={20} width="50%" mb="md" />
      <Stack gap="xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={40} />
        ))}
      </Stack>
    </Card>
  );
}
