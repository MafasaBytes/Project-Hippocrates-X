import { useParams, Link } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Accordion,
  Loader,
  Center,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../api/consultations";
import { ConsultationWorkspace } from "../components/consultation/ConsultationWorkspace";
import dayjs from "dayjs";

export function ConsultationActivePage() {
  const { id } = useParams<{ id: string }>();

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", id],
    queryFn: () => consultationsApi.get(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!consultation) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Consultation not found
      </Text>
    );
  }

  const isActive = consultation.status === "active";

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} to="/consultations" size="sm">
          Consultations
        </Anchor>
        <Text size="sm">{consultation.id.slice(0, 8)}</Text>
      </Breadcrumbs>

      {isActive ? (
        <ConsultationWorkspace consultation={consultation} />
      ) : (
        <>
          <Title order={2} mb="lg">
            Consultation Detail
          </Title>

          <Stack gap="md">
            <Card withBorder padding="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">
                    Type
                  </Text>
                  <Text fw={500}>
                    {consultation.consultation_type === "face_to_face"
                      ? "Face to Face"
                      : "Phone Call"}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Status
                  </Text>
                  <Badge
                    color={
                      consultation.status === "completed" ? "green" : "gray"
                    }
                    variant="light"
                  >
                    {consultation.status}
                  </Badge>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Started
                  </Text>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {dayjs(consultation.started_at).format(
                      "MMM D, YYYY HH:mm",
                    )}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Ended
                  </Text>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {consultation.ended_at
                      ? dayjs(consultation.ended_at).format(
                          "MMM D, YYYY HH:mm",
                        )
                      : "—"}
                  </Text>
                </div>
              </Group>
            </Card>

            {consultation.summary && (
              <Card withBorder padding="md">
                <Text fw={600} mb="xs">
                  Summary
                </Text>
                <Text
                  size="sm"
                  style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                >
                  {consultation.summary}
                </Text>
              </Card>
            )}
          </Stack>
        </>
      )}
    </>
  );
}
