import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Group,
  Tabs,
  Table,
  Badge,
  Loader,
  Center,
  Breadcrumbs,
  Anchor,
  Stack,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "../api/patients";
import { consultationsApi } from "../api/consultations";
import dayjs from "dayjs";

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations", "patient", id],
    queryFn: () => consultationsApi.list({ patient_id: id }),
    enabled: !!id,
  });

  if (loadingPatient) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!patient) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Patient not found
      </Text>
    );
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} to="/patients" size="sm">
          Patients
        </Anchor>
        <Text size="sm">{patient.name}</Text>
      </Breadcrumbs>

      <Title order={2} mb="lg">
        {patient.name}
      </Title>

      <Card withBorder padding="md" mb="lg">
        <Group gap="xl">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              MRN
            </Text>
            <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
              {patient.medical_record_number ?? "N/A"}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Date of Birth
            </Text>
            <Text size="sm" fw={500}>
              {patient.date_of_birth
                ? dayjs(patient.date_of_birth).format("MMM D, YYYY")
                : "N/A"}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Patient ID
            </Text>
            <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
              {patient.id.slice(0, 12)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase">
              Registered
            </Text>
            <Text size="sm" fw={500}>
              {dayjs(patient.created_at).format("MMM D, YYYY")}
            </Text>
          </div>
        </Group>
      </Card>

      <Tabs defaultValue="consultations">
        <Tabs.List>
          <Tabs.Tab value="consultations">
            Consultation History ({consultations.length})
          </Tabs.Tab>
          <Tabs.Tab value="anomalies">Anomalies</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="consultations" pt="md">
          <Card withBorder padding={0}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {consultations.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
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
                      <Text
                        size="sm"
                        ff="var(--mantine-font-family-monospace)"
                      >
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
                      <Text
                        size="sm"
                        ff="var(--mantine-font-family-monospace)"
                      >
                        {dayjs(c.started_at).format("MMM D, YYYY")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="anomalies" pt="md">
          <Card withBorder padding="lg">
            <Text size="sm" c="dimmed" ta="center">
              Anomaly detection results will appear here when consultations are
              analyzed
            </Text>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
