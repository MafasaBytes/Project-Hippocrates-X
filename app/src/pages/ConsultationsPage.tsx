import { useNavigate } from "react-router-dom";
import {
  Title,
  Table,
  Badge,
  Text,
  Group,
  Select,
  Card,
  Button,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../api/consultations";
import { EmptyState } from "../components/shared/EmptyState";
import { LoadingConsultationList } from "../components/shared/LoadingSkeleton";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

export function ConsultationsPage() {
  useDocumentTitle("Consultations");
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["consultations", statusFilter],
    queryFn: () =>
      consultationsApi.list({
        status: statusFilter ?? undefined,
        limit: 100,
      }),
  });

  if (isLoading) {
    return (
      <>
        <Group justify="space-between" mb="lg">
          <Title order={1}>Consultations</Title>
          <Select
            aria-label="Filter consultations by status"
            placeholder="Filter by status"
            data={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            w={180}
            size="sm"
          />
        </Group>
        <LoadingConsultationList />
      </>
    );
  }

  if (consultations.length === 0) {
    return (
      <>
        <Group justify="space-between" mb="lg">
          <Title order={1}>Consultations</Title>
          <Select
            aria-label="Filter consultations by status"
            placeholder="Filter by status"
            data={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            w={180}
            size="sm"
          />
        </Group>
        <EmptyState
          title="No consultations found"
          description={
            statusFilter
              ? "Try changing the status filter or start a new consultation."
              : "Start a consultation from the sidebar to get started."
          }
          icon="database"
          action={
            <Button component={Link} to="/" variant="light">
              Go to Dashboard
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={1}>Consultations</Title>
        <Select
          aria-label="Filter consultations by status"
          placeholder="Filter by status"
          data={[
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={180}
          size="sm"
        />
      </Group>

      <Card withBorder padding={0}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Started</Table.Th>
              <Table.Th>Ended</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consultations.map((c) => (
              <Table.Tr
                key={c.id}
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/consultations/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/consultations/${c.id}`);
                  }
                }}
                style={{ cursor: "pointer" }}
                aria-label={`View consultation ${c.id.slice(0, 8)}, ${c.status}`}
              >
                <Table.Td>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {c.id.slice(0, 8)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {c.consultation_type === "face_to_face"
                      ? "Face to Face"
                      : "Phone Call"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={STATUS_COLOR[c.status] ?? "gray"}
                    variant="light"
                    size="sm"
                  >
                    {c.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {dayjs(c.started_at).format("MMM D, HH:mm")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {c.ended_at
                      ? dayjs(c.ended_at).format("MMM D, HH:mm")
                      : "—"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </>
  );
}
