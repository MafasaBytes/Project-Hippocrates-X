import { useNavigate } from "react-router-dom";
import {
  Title,
  Table,
  Badge,
  Text,
  Group,
  Select,
  Card,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../api/consultations";
import dayjs from "dayjs";
import { useState } from "react";

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

export function ConsultationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations", statusFilter],
    queryFn: () =>
      consultationsApi.list({
        status: statusFilter ?? undefined,
        limit: 100,
      }),
  });

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Consultations</Title>
        <Select
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
            {consultations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No consultations found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {consultations.map((c) => (
              <Table.Tr
                key={c.id}
                onClick={() => navigate(`/consultations/${c.id}`)}
                style={{ cursor: "pointer" }}
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
