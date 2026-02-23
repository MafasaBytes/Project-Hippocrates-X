import { useParams, Link } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Breadcrumbs,
  Anchor,
  Button,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../api/consultations";
import { ConsultationWorkspace } from "../components/consultation/ConsultationWorkspace";
import { EmptyState } from "../components/shared/EmptyState";
import { LoadingConsultationList } from "../components/shared/LoadingSkeleton";
import dayjs from "dayjs";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function ConsultationActivePage() {
  const { id } = useParams<{ id: string }>();

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", id],
    queryFn: () => consultationsApi.get(id!),
    enabled: !!id,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  useDocumentTitle(
    consultation
      ? consultation.status === "active"
        ? "Active consultation"
        : "Consultation detail"
      : "Consultation"
  );

  if (isLoading) {
    return (
      <>
        <LoadingConsultationList />
      </>
    );
  }

  if (!consultation) {
    return (
      <EmptyState
        title="Consultation not found"
        description="This consultation may have been removed or the link is invalid."
        icon="error"
        action={
          <Button component={Link} to="/consultations" variant="light">
            Back to Consultations
          </Button>
        }
      />
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
          <Title order={1} mb="lg">
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
