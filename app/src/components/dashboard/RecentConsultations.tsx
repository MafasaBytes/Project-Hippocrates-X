import { useNavigate } from "react-router-dom";
import { Card, Table, Badge, Text } from "@mantine/core";
import dayjs from "dayjs";
import type { ConsultationDetail } from "../../types/api";

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

interface Props {
  consultations: ConsultationDetail[];
}

export function RecentConsultations({ consultations }: Props) {
  const navigate = useNavigate();

  return (
    <Card withBorder padding="md">
      <Text fw={600} mb="sm">
        Recent Consultations
      </Text>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Started</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {consultations.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No consultations yet
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
                <Text size="sm">{c.consultation_type === "face_to_face" ? "Face to Face" : "Phone Call"}</Text>
              </Table.Td>
              <Table.Td>
                <Badge color={STATUS_COLOR[c.status] ?? "gray"} variant="light" size="sm">
                  {c.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" ff="var(--mantine-font-family-monospace)">
                  {dayjs(c.started_at).format("MMM D, HH:mm")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
