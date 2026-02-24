import { useEffect } from "react";
import {
  Drawer,
  TextInput,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  TagsInput,
  Divider,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "../../api/patients";
import type { Patient, PatientUpdate } from "../../types/api";

interface Props {
  patient: Patient;
  opened: boolean;
  onClose: () => void;
}

export function PatientEditDrawer({ patient, opened, onClose }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<PatientUpdate>({
    initialValues: {
      name: patient.name,
      gender: patient.gender,
      blood_type: patient.blood_type,
      phone: patient.phone,
      email: patient.email,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      address_line: patient.address_line,
      city: patient.city,
      province: patient.province,
      country: patient.country,
      postal_code: patient.postal_code,
      allergies: patient.allergies,
      chronic_conditions: patient.chronic_conditions,
      notes: patient.notes,
    },
  });

  useEffect(() => {
    form.setValues({
      name: patient.name,
      gender: patient.gender,
      blood_type: patient.blood_type,
      phone: patient.phone,
      email: patient.email,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      address_line: patient.address_line,
      city: patient.city,
      province: patient.province,
      country: patient.country,
      postal_code: patient.postal_code,
      allergies: patient.allergies,
      chronic_conditions: patient.chronic_conditions,
      notes: patient.notes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const mutation = useMutation({
    mutationFn: (data: PatientUpdate) => patientsApi.update(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      onClose();
    },
  });

  const handleSubmit = form.onSubmit((values: typeof form.values) => {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== null && v !== "") {
        cleaned[k] = v;
      }
    }
    mutation.mutate(cleaned as PatientUpdate);
  });

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Edit Patient Profile"
      position="right"
      size="md"
      padding="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput label="Full Name" {...form.getInputProps("name")} />

          <Group grow>
            <Select
              label="Gender"
              data={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              clearable
              {...form.getInputProps("gender")}
            />
            <Select
              label="Blood Type"
              data={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              clearable
              {...form.getInputProps("blood_type")}
            />
          </Group>

          <Divider label="Contact" labelPosition="left" />

          <Group grow>
            <TextInput label="Phone" {...form.getInputProps("phone")} />
            <TextInput label="Email" {...form.getInputProps("email")} />
          </Group>

          <Group grow>
            <TextInput
              label="Emergency Contact"
              {...form.getInputProps("emergency_contact_name")}
            />
            <TextInput
              label="Emergency Phone"
              {...form.getInputProps("emergency_contact_phone")}
            />
          </Group>

          <Divider label="Address" labelPosition="left" />

          <TextInput
            label="Address"
            {...form.getInputProps("address_line")}
          />
          <Group grow>
            <TextInput label="City" {...form.getInputProps("city")} />
            <TextInput label="Province" {...form.getInputProps("province")} />
          </Group>
          <Group grow>
            <TextInput label="Country" {...form.getInputProps("country")} />
            <TextInput
              label="Postal Code"
              {...form.getInputProps("postal_code")}
            />
          </Group>

          <Divider label="Medical Info" labelPosition="left" />

          <TagsInput
            label="Allergies"
            placeholder="Type and press Enter"
            {...form.getInputProps("allergies")}
          />

          <TagsInput
            label="Chronic Conditions"
            placeholder="Type and press Enter"
            {...form.getInputProps("chronic_conditions")}
          />

          <Textarea
            label="Notes"
            autosize
            minRows={2}
            maxRows={5}
            {...form.getInputProps("notes")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save Changes
            </Button>
          </Group>

          {mutation.isError && (
            <Text size="sm" c="red">
              Failed to update patient. Please try again.
            </Text>
          )}
        </Stack>
      </form>
    </Drawer>
  );
}
