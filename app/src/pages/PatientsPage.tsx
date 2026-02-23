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
import { EmptyState } from "../components/shared/EmptyState";
import { LoadingConsultationList } from "../components/shared/LoadingSkeleton";
import dayjs from "dayjs";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function PatientsPage() {
  useDocumentTitle("Patients");
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const { searchValue, setSearchValue, patients, isLoading } =
    usePatientLookup();

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={1}>Patients</Title>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setFormOpen(true)}
        >
          Register Patient
        </Button>
      </Group>

      <TextInput
        aria-label="Search patients by name or MRN"
        placeholder="Search patients by name or MRN..."
        leftSection={<IconSearch size={16} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        mb="md"
        size="md"
      />

      {isLoading && <LoadingConsultationList />}

      {!isLoading && searchValue.length >= 2 && patients.length === 0 && (
        <EmptyState
          title="No patients found"
          description="Try a different search or register a new patient."
          icon="search"
          action={
            <Button leftSection={<IconUserPlus size={16} />} onClick={() => setFormOpen(true)}>
              Register Patient
            </Button>
          }
        />
      )}

      {!isLoading && (patients.length > 0 || searchValue.length < 2) && (
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
            {patients.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    Type at least 2 characters to search
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
            patients.map((p) => (
              <Table.Tr
                key={p.id}
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/patients/${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/patients/${p.id}`);
                  }
                }}
                style={{ cursor: "pointer" }}
                aria-label={`View patient ${p.name}`}
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
            ))
            )}
          </Table.Tbody>
        </Table>
      </Card>
      )}

      <PatientForm opened={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
