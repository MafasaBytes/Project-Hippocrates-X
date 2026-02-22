import { useState } from "react";
import { Modal, TextInput, Button, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "../../api/patients";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function PatientForm({ opened, onClose }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState("");
  const [dob, setDob] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      patientsApi.create({
        name,
        medical_record_number: mrn || undefined,
        date_of_birth: dob || undefined,
      }),
    onSuccess: () => {
      notifications.show({ title: "Patient registered", message: name, color: "green" });
      qc.invalidateQueries({ queryKey: ["patients"] });
      onClose();
      setName("");
      setMrn("");
      setDob("");
    },
    onError: () => {
      notifications.show({ title: "Error", message: "Failed to register patient", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Register Patient" centered>
      <Stack gap="sm">
        <TextInput
          label="Full Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Medical Record Number"
          value={mrn}
          onChange={(e) => setMrn(e.currentTarget.value)}
        />
        <TextInput
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          value={dob}
          onChange={(e) => setDob(e.currentTarget.value)}
        />
        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!name.trim()}
        >
          Register
        </Button>
      </Stack>
    </Modal>
  );
}
