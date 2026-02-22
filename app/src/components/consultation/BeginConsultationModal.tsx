import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Stepper,
  TextInput,
  SegmentedControl,
  Textarea,
  Button,
  Group,
  Card,
  Text,
  Stack,
  Alert,
  Loader,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { usePatientLookup } from "../../hooks/usePatientLookup";
import { consultationsApi } from "../../api/consultations";
import { patientsApi } from "../../api/patients";
import type { Patient, ConsultationType } from "../../types/api";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function BeginConsultationModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultType, setConsultType] = useState<ConsultationType>("face_to_face");
  const [notes, setNotes] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientMRN, setNewPatientMRN] = useState("");

  const { searchValue, setSearchValue, patients, isLoading } = usePatientLookup();

  const createPatientMutation = useMutation({
    mutationFn: () =>
      patientsApi.create({
        name: newPatientName,
        medical_record_number: newPatientMRN || undefined,
      }),
    onSuccess: (patient) => {
      setSelectedPatient(patient);
      setStep(1);
    },
  });

  // For the demo, we use a hardcoded doctor_id. In production this comes from auth.
  const startMutation = useMutation({
    mutationFn: () =>
      consultationsApi.create({
        doctor_id: "00000000-0000-0000-0000-000000000001",
        patient_id: selectedPatient!.id,
        consultation_type: consultType,
      }),
    onSuccess: (result) => {
      notifications.show({
        title: "Consultation started",
        message: `Session ${result.consultation_id.slice(0, 8)} is now active`,
        color: "green",
      });
      onClose();
      resetState();
      navigate(`/consultations/${result.consultation_id}`);
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to start consultation",
        color: "red",
      });
    },
  });

  const resetState = () => {
    setStep(0);
    setSelectedPatient(null);
    setConsultType("face_to_face");
    setNotes("");
    setSearchValue("");
    setNewPatientName("");
    setNewPatientMRN("");
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Begin Consultation"
      size="lg"
      centered
    >
      <Stepper active={step} onStepClick={setStep} size="sm" mb="lg">
        <Stepper.Step label="Patient" description="Identify patient">
          <Stack gap="md" mt="md">
            <TextInput
              label="Search by Patient ID or Medical Record Number"
              placeholder="Enter ID or MRN..."
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
              rightSection={isLoading ? <Loader size={16} /> : null}
            />

            {patients.length > 0 && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Matching patients:
                </Text>
                {patients.map((p) => (
                  <Card
                    key={p.id}
                    padding="sm"
                    withBorder
                    onClick={() => {
                      setSelectedPatient(p);
                      setStep(1);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{p.name}</Text>
                        <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                          MRN: {p.medical_record_number ?? "N/A"} | ID: {p.id.slice(0, 8)}
                        </Text>
                      </div>
                      <Button size="xs" variant="light">
                        Select
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}

            {searchValue.length >= 2 && !isLoading && patients.length === 0 && (
              <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
                <Text size="sm" mb="sm">
                  No patient found. Register a new patient?
                </Text>
                <Stack gap="xs">
                  <TextInput
                    label="Full Name"
                    size="sm"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.currentTarget.value)}
                    required
                  />
                  <TextInput
                    label="Medical Record Number"
                    size="sm"
                    value={newPatientMRN}
                    onChange={(e) => setNewPatientMRN(e.currentTarget.value)}
                  />
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => createPatientMutation.mutate()}
                    loading={createPatientMutation.isPending}
                    disabled={!newPatientName.trim()}
                  >
                    Register Patient
                  </Button>
                </Stack>
              </Alert>
            )}

            {selectedPatient && (
              <Card withBorder bg="indigo.0" padding="sm">
                <Text size="sm" fw={600}>
                  Selected: {selectedPatient.name}
                </Text>
                <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                  ID: {selectedPatient.id.slice(0, 8)} | MRN:{" "}
                  {selectedPatient.medical_record_number ?? "N/A"}
                </Text>
              </Card>
            )}
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Setup" description="Consultation type">
          <Stack gap="md" mt="md">
            {selectedPatient && (
              <Card withBorder padding="sm">
                <Text size="sm" fw={500}>
                  Patient: {selectedPatient.name}
                </Text>
              </Card>
            )}

            <div>
              <Text size="sm" fw={500} mb={4}>
                Consultation Type
              </Text>
              <SegmentedControl
                fullWidth
                data={[
                  { label: "Face to Face", value: "face_to_face" },
                  { label: "Phone Call", value: "phone_call" },
                ]}
                value={consultType}
                onChange={(v) => setConsultType(v as ConsultationType)}
              />
            </div>

            <Textarea
              label="Pre-consultation Notes (optional)"
              placeholder="Any preliminary observations..."
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />

            <Button
              fullWidth
              onClick={() => startMutation.mutate()}
              loading={startMutation.isPending}
              disabled={!selectedPatient}
            >
              Start Session
            </Button>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Modal>
  );
}
