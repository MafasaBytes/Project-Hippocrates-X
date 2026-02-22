import { TextInput, Card, Text, Stack, Group, Button, Loader } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { usePatientLookup } from "../../hooks/usePatientLookup";
import type { Patient } from "../../types/api";

interface Props {
  onSelect: (patient: Patient) => void;
}

export function PatientLookup({ onSelect }: Props) {
  const { searchValue, setSearchValue, patients, isLoading } = usePatientLookup();

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search by name or MRN..."
        leftSection={<IconSearch size={16} />}
        rightSection={isLoading ? <Loader size={14} /> : null}
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
      />
      {patients.map((p) => (
        <Card key={p.id} withBorder padding="sm">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                {p.name}
              </Text>
              <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                MRN: {p.medical_record_number ?? "N/A"}
              </Text>
            </div>
            <Button size="xs" variant="light" onClick={() => onSelect(p)}>
              Select
            </Button>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
