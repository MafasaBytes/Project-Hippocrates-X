import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Stepper,
  TextInput,
  Select,
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePatientLookup } from "../../hooks/usePatientLookup";
import { consultationsApi } from "../../api/consultations";
import { patientsApi } from "../../api/patients";
import { doctorsApi } from "../../api/doctors";
import type { Patient, ConsultationType } from "../../types/api";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function BeginConsultationModal({ opened, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [consultType, setConsultType] = useState<ConsultationType>("face_to_face");
  const [notes, setNotes] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientMRN, setNewPatientMRN] = useState("");

  const { searchValue, setSearchValue, patients, isLoading } = usePatientLookup();

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsApi.list(),
    enabled: opened,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (opened && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [opened]);

  useEffect(() => {
    if (opened) {
      const activeStep = step === 0 ? firstInputRef : null;
      if (activeStep && activeStep.current) {
        setTimeout(() => activeStep.current?.focus(), 100);
      }
    }
  }, [step, opened]);

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

  const startMutation = useMutation({
    mutationFn: () =>
      consultationsApi.create({
        doctor_id: selectedDoctorId!,
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
    onError: (error: { message?: string }) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to start consultation",
        color: "red",
      });
    },
  });

  const resetState = () => {
    setStep(0);
    setSelectedPatient(null);
    setSelectedDoctorId(null);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && opened) {
      e.preventDefault();
      handleClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Begin Consultation"
      size="lg"
      centered
      aria-labelledby="begin-consultation-title"
    >
      <div ref={modalRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <Stepper active={step} onStepClick={setStep} size="sm" mb="lg">
          <Stepper.Step label="Patient" description="Identify patient">
            <Stack gap="md" mt="md">
              <TextInput
                ref={firstInputRef}
                label="Search by Patient ID or Medical Record Number"
                placeholder="Enter ID or MRN..."
                leftSection={<IconSearch size={16} />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                rightSection={isLoading ? <Loader size={16} /> : null}
                aria-describedby="patient-search-description"
              />
              <Text id="patient-search-description" size="xs" c="dimmed" hidden>
                Enter at least 2 characters to search for patients
              </Text>

              {patients.length > 0 && (
                <Stack gap="xs" role="list" aria-label="Matching patients list">
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
                      tabIndex={0}
                      role="listitem"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPatient(p);
                          setStep(1);
                        }
                      }}
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{p.name}</Text>
                          <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                            MRN: {p.medical_record_number ?? "N/A"} | ID: {p.id.slice(0, 8)}
                          </Text>
                        </div>
                        <Button size="xs" variant="light" aria-label={`Select patient ${p.name}`}>
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
                      aria-label="New patient full name"
                    />
                    <TextInput
                      label="Medical Record Number"
                      size="sm"
                      value={newPatientMRN}
                      onChange={(e) => setNewPatientMRN(e.currentTarget.value)}
                      aria-label="New patient medical record number"
                    />
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => createPatientMutation.mutate()}
                      loading={createPatientMutation.isPending}
                      disabled={!newPatientName.trim()}
                      aria-label="Register new patient"
                    >
                      Register Patient
                    </Button>
                  </Stack>
                </Alert>
              )}

              {selectedPatient && (
                <Card withBorder bg="indigo.0" padding="sm" role="alert">
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

          <Stepper.Step label="Setup" description="Doctor & type">
            <Stack gap="md" mt="md">
              {selectedPatient && (
                <Card withBorder padding="sm">
                  <Text size="sm" fw={500}>
                    Patient: {selectedPatient.name}
                  </Text>
                </Card>
              )}

              <Select
                label="Attending Doctor"
                placeholder="Select a doctor…"
                data={
                  doctors?.map((d) => ({
                    value: d.id,
                    label: d.specialization
                      ? `${d.name} — ${d.specialization}`
                      : d.name,
                  })) ?? []
                }
                value={selectedDoctorId}
                onChange={setSelectedDoctorId}
                searchable
                required
                nothingFoundMessage="No doctors registered — go to Doctors page first"
                aria-label="Select attending doctor"
              />

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
                  aria-label="Select consultation type"
                />
              </div>

              <Textarea
                label="Pre-consultation Notes (optional)"
                placeholder="Any preliminary observations..."
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                aria-label="Pre-consultation notes"
              />

              <Button
                fullWidth
                onClick={() => startMutation.mutate()}
                loading={startMutation.isPending}
                disabled={!selectedPatient || !selectedDoctorId}
                aria-label="Start consultation session"
              >
                Start Session
              </Button>
            </Stack>
          </Stepper.Step>
        </Stepper>
      </div>
    </Modal>
  );
}
