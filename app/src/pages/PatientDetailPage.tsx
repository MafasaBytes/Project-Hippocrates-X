import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  Card,
  Group,
  Tabs,
  Table,
  Badge,
  Breadcrumbs,
  Anchor,
  Stack,
  Button,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import {
  IconEdit,
  IconTimeline,
  IconFiles,
  IconStethoscope,
  IconPhone,
  IconMail,
  IconMapPin,
  IconDroplet,
  IconAlertTriangle,
  IconHeart,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { patientsApi } from "../api/patients";
import { consultationsApi } from "../api/consultations";
import { medicalRecordsApi } from "../api/medicalRecords";
import { EmptyState } from "../components/shared/EmptyState";
import { LoadingCard } from "../components/shared/LoadingSkeleton";
import { PatientEditDrawer } from "../components/patient/PatientEditDrawer";
import { PatientTimeline } from "../components/patient/PatientTimeline";
import { MedicalRecordUpload } from "../components/patient/MedicalRecordUpload";
import dayjs from "dayjs";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const STATUS_COLOR: Record<string, string> = {
  active: "blue",
  completed: "green",
  cancelled: "gray",
};

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  });

  useDocumentTitle(patient?.name ?? "Patient");

  const { data: consultations = [] } = useQuery({
    queryKey: ["consultations", "patient", id],
    queryFn: () => consultationsApi.list({ patient_id: id }),
    enabled: !!id,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ["timeline", id],
    queryFn: () => medicalRecordsApi.timeline(id!),
    enabled: !!id,
  });

  if (loadingPatient) {
    return <LoadingCard />;
  }

  if (!patient) {
    return (
      <EmptyState
        title="Patient not found"
        description="This patient may have been removed or the link is invalid."
        icon="error"
        action={
          <Button component={Link} to="/patients" variant="light">
            Back to Patients
          </Button>
        }
      />
    );
  }

  const hasAddress = patient.city || patient.province || patient.country;
  const addressParts = [patient.address_line, patient.city, patient.province, patient.postal_code, patient.country].filter(Boolean);

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} to="/patients" size="sm">
          Patients
        </Anchor>
        <Text size="sm">{patient.name}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start" mb="lg">
        <Title order={1}>{patient.name}</Title>
        <Button
          variant="light"
          leftSection={<IconEdit size={16} />}
          onClick={openDrawer}
        >
          Edit Profile
        </Button>
      </Group>

      {/* Identity & Demographics */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Card withBorder padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
            Identity
          </Text>
          <Group gap="xl" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">MRN</Text>
              <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
                {patient.medical_record_number ?? "N/A"}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">Date of Birth</Text>
              <Text size="sm" fw={500}>
                {patient.date_of_birth
                  ? dayjs(patient.date_of_birth).format("MMM D, YYYY")
                  : "N/A"}
              </Text>
            </div>
            <InfoItem label="Gender" value={patient.gender} />
            {patient.blood_type && (
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">Blood Type</Text>
                <Group gap={4}>
                  <IconDroplet size={14} color="var(--mantine-color-red-6)" />
                  <Text size="sm" fw={600}>{patient.blood_type}</Text>
                </Group>
              </div>
            )}
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">Patient ID</Text>
              <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
                {patient.id.slice(0, 12)}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">Registered</Text>
              <Text size="sm" fw={500}>
                {dayjs(patient.created_at).format("MMM D, YYYY")}
              </Text>
            </div>
          </Group>
        </Card>

        <Card withBorder padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">
            Contact & Address
          </Text>
          <Stack gap="xs">
            {patient.phone && (
              <Group gap="xs">
                <IconPhone size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm">{patient.phone}</Text>
              </Group>
            )}
            {patient.email && (
              <Group gap="xs">
                <IconMail size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm">{patient.email}</Text>
              </Group>
            )}
            {hasAddress && (
              <Group gap="xs" align="flex-start">
                <IconMapPin size={14} color="var(--mantine-color-dimmed)" style={{ marginTop: 3 }} />
                <Text size="sm">{addressParts.join(", ")}</Text>
              </Group>
            )}
            {patient.emergency_contact_name && (
              <>
                <Divider my={4} />
                <Text size="xs" c="dimmed" tt="uppercase">Emergency Contact</Text>
                <Text size="sm">
                  {patient.emergency_contact_name}
                  {patient.emergency_contact_phone && ` — ${patient.emergency_contact_phone}`}
                </Text>
              </>
            )}
            {!patient.phone && !patient.email && !hasAddress && !patient.emergency_contact_name && (
              <Text size="sm" c="dimmed">No contact information on file</Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Medical Metadata */}
      {(patient.allergies?.length || patient.chronic_conditions?.length || patient.notes) && (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
          {patient.allergies && patient.allergies.length > 0 && (
            <Card withBorder padding="md">
              <Group gap="xs" mb="xs">
                <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Allergies</Text>
              </Group>
              <Group gap="xs">
                {patient.allergies.map((a) => (
                  <Badge key={a} variant="light" color="red" size="sm">{a}</Badge>
                ))}
              </Group>
            </Card>
          )}
          {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
            <Card withBorder padding="md">
              <Group gap="xs" mb="xs">
                <IconHeart size={16} color="var(--mantine-color-orange-6)" />
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Chronic Conditions</Text>
              </Group>
              <Group gap="xs">
                {patient.chronic_conditions.map((c) => (
                  <Badge key={c} variant="light" color="orange" size="sm">{c}</Badge>
                ))}
              </Group>
            </Card>
          )}
          {patient.notes && (
            <Card withBorder padding="md">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">Notes</Text>
              <Text size="sm">{patient.notes}</Text>
            </Card>
          )}
        </SimpleGrid>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <Tabs.List>
          <Tabs.Tab value="timeline" leftSection={<IconTimeline size={16} />}>
            Timeline
          </Tabs.Tab>
          <Tabs.Tab value="records" leftSection={<IconFiles size={16} />}>
            Medical Records
          </Tabs.Tab>
          <Tabs.Tab value="consultations" leftSection={<IconStethoscope size={16} />}>
            Consultations ({consultations.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="timeline" pt="md">
          <PatientTimeline entries={timeline} />
        </Tabs.Panel>

        <Tabs.Panel value="records" pt="md">
          <MedicalRecordUpload patientId={patient.id} />
        </Tabs.Panel>

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
                        {dayjs(c.started_at).format("MMM D, YYYY")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <PatientEditDrawer
        patient={patient}
        opened={drawerOpened}
        onClose={closeDrawer}
      />
    </>
  );
}
