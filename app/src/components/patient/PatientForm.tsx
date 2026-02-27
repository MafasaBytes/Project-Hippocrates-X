import { useState } from "react";
import {
  Modal,
  TextInput,
  Select,
  Textarea,
  TagsInput,
  Button,
  Stack,
  Group,
  Divider,
  Collapse,
  UnstyledButton,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "../../api/patients";
import type { PatientCreate, Gender } from "../../types/api";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const INITIAL: PatientCreate = {
  name: "",
  medical_record_number: undefined,
  date_of_birth: undefined,
  gender: undefined,
  blood_type: undefined,
  phone: undefined,
  email: undefined,
  emergency_contact_name: undefined,
  emergency_contact_phone: undefined,
  address_line: undefined,
  city: undefined,
  province: undefined,
  country: undefined,
  postal_code: undefined,
  allergies: undefined,
  chronic_conditions: undefined,
  notes: undefined,
};

export function PatientForm({ opened, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<PatientCreate>({ ...INITIAL });
  const [showMore, setShowMore] = useState(false);

  const set = <K extends keyof PatientCreate>(key: K, value: PatientCreate[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Partial<PatientCreate> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v !== undefined && v !== null && v !== "") {
          if (Array.isArray(v) && v.length === 0) continue;
          (payload as Record<string, unknown>)[k] = v;
        }
      }
      return patientsApi.create({ name: form.name, ...payload });
    },
    onSuccess: () => {
      notifications.show({
        title: "Patient registered",
        message: form.name,
        color: "green",
      });
      qc.invalidateQueries({ queryKey: ["patients"] });
      onClose();
      setForm({ ...INITIAL });
      setShowMore(false);
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to register patient",
        color: "red",
      });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span id="register-patient-title">Register Patient</span>}
      centered
      size="lg"
      aria-labelledby="register-patient-title"
    >
      <Stack gap="sm">
        <TextInput
          label="Full Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.currentTarget.value)}
        />

        <Group grow>
          <TextInput
            label="Medical Record Number"
            value={form.medical_record_number ?? ""}
            onChange={(e) => set("medical_record_number", e.currentTarget.value || undefined)}
          />
          <TextInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.currentTarget.value || undefined)}
          />
        </Group>

        <Group grow>
          <Select
            label="Gender"
            data={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            clearable
            value={form.gender ?? null}
            onChange={(v) => set("gender", (v as Gender) ?? undefined)}
          />
          <Select
            label="Blood Type"
            data={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            clearable
            value={form.blood_type ?? null}
            onChange={(v) => set("blood_type", v ?? undefined)}
          />
        </Group>

        <Group grow>
          <TextInput
            label="Phone"
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.currentTarget.value || undefined)}
          />
          <TextInput
            label="Email"
            value={form.email ?? ""}
            onChange={(e) => set("email", e.currentTarget.value || undefined)}
          />
        </Group>

        <UnstyledButton onClick={() => setShowMore((v) => !v)}>
          <Group gap={4}>
            {showMore ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            <Text size="sm" fw={500} c="dimmed">
              {showMore ? "Less details" : "More details (address, emergency contact, medical info)"}
            </Text>
          </Group>
        </UnstyledButton>

        <Collapse in={showMore}>
          <Stack gap="sm">
            <Divider label="Address" labelPosition="left" />
            <TextInput
              label="Address"
              value={form.address_line ?? ""}
              onChange={(e) => set("address_line", e.currentTarget.value || undefined)}
            />
            <Group grow>
              <TextInput
                label="City"
                value={form.city ?? ""}
                onChange={(e) => set("city", e.currentTarget.value || undefined)}
              />
              <TextInput
                label="Province"
                value={form.province ?? ""}
                onChange={(e) => set("province", e.currentTarget.value || undefined)}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Country"
                value={form.country ?? ""}
                onChange={(e) => set("country", e.currentTarget.value || undefined)}
              />
              <TextInput
                label="Postal Code"
                value={form.postal_code ?? ""}
                onChange={(e) => set("postal_code", e.currentTarget.value || undefined)}
              />
            </Group>

            <Divider label="Emergency Contact" labelPosition="left" />
            <Group grow>
              <TextInput
                label="Contact Name"
                value={form.emergency_contact_name ?? ""}
                onChange={(e) => set("emergency_contact_name", e.currentTarget.value || undefined)}
              />
              <TextInput
                label="Contact Phone"
                value={form.emergency_contact_phone ?? ""}
                onChange={(e) => set("emergency_contact_phone", e.currentTarget.value || undefined)}
              />
            </Group>

            <Divider label="Medical Info" labelPosition="left" />
            <TagsInput
              label="Allergies"
              placeholder="Type and press Enter"
              value={form.allergies ?? []}
              onChange={(v) => set("allergies", v.length > 0 ? v : undefined)}
            />
            <TagsInput
              label="Chronic Conditions"
              placeholder="Type and press Enter"
              value={form.chronic_conditions ?? []}
              onChange={(v) => set("chronic_conditions", v.length > 0 ? v : undefined)}
            />
            <Textarea
              label="Notes"
              autosize
              minRows={2}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.currentTarget.value || undefined)}
            />
          </Stack>
        </Collapse>

        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!form.name.trim()}
          mt="sm"
        >
          Register
        </Button>
      </Stack>
    </Modal>
  );
}
