import { useState } from "react";
import {
  Title,
  Table,
  Text,
  Card,
  Group,
  Button,
  Badge,
} from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../api/doctors";
import { DoctorForm } from "../components/doctor/DoctorForm";
import { EmptyState } from "../components/shared/EmptyState";
import { LoadingConsultationList } from "../components/shared/LoadingSkeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import dayjs from "dayjs";

export function DoctorsPage() {
  useDocumentTitle("Doctors");
  const [formOpen, setFormOpen] = useState(false);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsApi.list(),
  });

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={1}>Doctors</Title>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setFormOpen(true)}
        >
          Register Doctor
        </Button>
      </Group>

      {isLoading && <LoadingConsultationList />}

      {!isLoading && (!doctors || doctors.length === 0) && (
        <EmptyState
          title="No doctors registered"
          description="Register a doctor to start creating consultations."
          icon="search"
          action={
            <Button leftSection={<IconUserPlus size={16} />} onClick={() => setFormOpen(true)}>
              Register Doctor
            </Button>
          }
        />
      )}

      {!isLoading && doctors && doctors.length > 0 && (
        <Card withBorder padding={0}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Specialization</Table.Th>
                <Table.Th>Registered</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {doctors.map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {d.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {d.specialization ? (
                      <Badge variant="light" size="sm">
                        {d.specialization}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="var(--mantine-font-family-monospace)">
                      {dayjs(d.created_at).format("MMM D, YYYY")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <DoctorForm opened={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
