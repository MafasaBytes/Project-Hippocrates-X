import { useState } from "react";
import { Modal, TextInput, Button, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "../../api/doctors";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function DoctorForm({ opened, onClose }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      doctorsApi.create({
        name,
        specialization: specialization || undefined,
      }),
    onSuccess: () => {
      notifications.show({ title: "Doctor registered", message: name, color: "green" });
      qc.invalidateQueries({ queryKey: ["doctors"] });
      onClose();
      setName("");
      setSpecialization("");
    },
    onError: () => {
      notifications.show({ title: "Error", message: "Failed to register doctor", color: "red" });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span id="register-doctor-title">Register Doctor</span>}
      centered
      aria-labelledby="register-doctor-title"
    >
      <Stack gap="sm">
        <TextInput
          id="doctor-name"
          label="Full Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          aria-required="true"
        />
        <TextInput
          id="doctor-specialization"
          label="Specialization"
          placeholder="e.g. Cardiology, Radiology, General Practice"
          value={specialization}
          onChange={(e) => setSpecialization(e.currentTarget.value)}
        />
        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!name.trim()}
          aria-label="Register new doctor"
        >
          Register
        </Button>
      </Stack>
    </Modal>
  );
}
