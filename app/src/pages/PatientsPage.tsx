import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  TextInput,
  Table,
  Text,
  Card,
  Group,
  Button,
} from "@mantine/core";
import { IconSearch, IconUserPlus } from "@tabler/icons-react";
import { usePatientLookup } from "../hooks/usePatientLookup";
import { PatientForm } from "../components/patient/PatientForm";
import dayjs from "dayjs";

export function PatientsPage() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const { searchValue, setSearchValue, patients, isLoading } =
    usePatientLookup();

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Patients</Title>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setFormOpen(true)}
        >
          Register Patient
        </Button>
      </Group>

      <TextInput
        placeholder="Search patients by name or MRN..."
        leftSection={<IconSearch size={16} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        mb="md"
        size="md"
      />

      <Card withBorder padding={0}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>MRN</Table.Th>
              <Table.Th>Date of Birth</Table.Th>
              <Table.Th>Registered</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {!isLoading && patients.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    {searchValue.length >= 2
                      ? "No patients found"
                      : "Type at least 2 characters to search"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {patients.map((p) => (
              <Table.Tr
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {p.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {p.medical_record_number ?? "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {p.date_of_birth
                      ? dayjs(p.date_of_birth).format("MMM D, YYYY")
                      : "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="var(--mantine-font-family-monospace)">
                    {dayjs(p.created_at).format("MMM D, YYYY")}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <PatientForm opened={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
