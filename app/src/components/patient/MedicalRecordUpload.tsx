import { useState } from "react";
import {
  Card,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  Table,
  Badge,
  Text,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
  IconUpload,
  IconFile,
  IconX,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import type { MedicalRecordCreate, RecordType } from "../../types/api";
import dayjs from "dayjs";
import { useDisclosure } from "@mantine/hooks";

const RECORD_TYPES: { value: RecordType; label: string }[] = [
  { value: "lab_result", label: "Lab Result" },
  { value: "imaging", label: "Imaging (MRI, CT, X-Ray)" },
  { value: "prescription", label: "Prescription" },
  { value: "referral", label: "Referral" },
  { value: "clinical_note", label: "Clinical Note" },
  { value: "other", label: "Other" },
];

const TYPE_COLOR: Record<string, string> = {
  lab_result: "teal",
  imaging: "violet",
  prescription: "orange",
  referral: "cyan",
  clinical_note: "indigo",
  other: "gray",
};

interface Props {
  patientId: string;
}

export function MedicalRecordUpload({ patientId }: Props) {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const [recordType, setRecordType] = useState<RecordType>("lab_result");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordDate, setRecordDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: () => medicalRecordsApi.list(patientId),
  });

  const createMutation = useMutation({
    mutationFn: (data: MedicalRecordCreate) =>
      medicalRecordsApi.create(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", patientId] });
      resetForm();
      close();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (params: {
      file: File;
      metadata: { record_type: RecordType; title: string; record_date: string; description?: string };
    }) => medicalRecordsApi.upload(patientId, params.file, params.metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", patientId] });
      resetForm();
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) =>
      medicalRecordsApi.delete(patientId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", patientId] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setRawText("");
    setFile(null);
    setRecordDate(dayjs().format("YYYY-MM-DD"));
    setRecordType("lab_result");
  };

  const handleSubmit = () => {
    if (!title || !recordDate) return;

    const dateStr = new Date(recordDate).toISOString();

    if (file) {
      uploadMutation.mutate({
        file,
        metadata: {
          record_type: recordType,
          title,
          record_date: dateStr,
          description: description || undefined,
        },
      });
    } else {
      createMutation.mutate({
        record_type: recordType,
        title,
        description: description || undefined,
        raw_text: rawText || undefined,
        record_date: dateStr,
      });
    }
  };

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  return (
    <>
      <Group justify="flex-end" mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Record
        </Button>
      </Group>

      {records.length === 0 ? (
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed" ta="center">
            No medical records uploaded yet. Add lab results, imaging studies,
            prescriptions, and other medical documents.
          </Text>
        </Card>
      ) : (
        <Card withBorder padding={0}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Record Date</Table.Th>
                <Table.Th>Uploaded</Table.Th>
                <Table.Th w={60} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {r.title}
                    </Text>
                    {r.description && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {r.description}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="light"
                      color={TYPE_COLOR[r.record_type] ?? "gray"}
                    >
                      {r.record_type.replace(/_/g, " ")}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="var(--mantine-font-family-monospace)">
                      {dayjs(r.record_date).format("MMM D, YYYY")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="var(--mantine-font-family-monospace)">
                      {dayjs(r.created_at).format("MMM D, YYYY")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => deleteMutation.mutate(r.id)}
                      loading={deleteMutation.isPending}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title="Add Medical Record"
        size="lg"
      >
        <Stack gap="md">
          <Group grow>
            <Select
              label="Record Type"
              data={RECORD_TYPES}
              value={recordType}
              onChange={(v) => v && setRecordType(v as RecordType)}
            />
            <TextInput
              label="Record Date"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.currentTarget.value)}
              max={dayjs().format("YYYY-MM-DD")}
            />
          </Group>

          <TextInput
            label="Title"
            placeholder="e.g. Chest X-Ray, CBC Panel"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Brief description or findings"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            autosize
            minRows={2}
          />

          <Textarea
            label="Raw Text / Notes"
            placeholder="Paste lab values, clinical notes, etc."
            value={rawText}
            onChange={(e) => setRawText(e.currentTarget.value)}
            autosize
            minRows={3}
          />

          <Dropzone
            onDrop={(files) => setFile(files[0] ?? null)}
            maxSize={50 * 1024 * 1024}
            maxFiles={1}
          >
            <Group
              justify="center"
              gap="xl"
              mih={80}
              style={{ pointerEvents: "none" }}
            >
              {file ? (
                <Group gap="xs">
                  <IconFile size={20} />
                  <Text size="sm">{file.name}</Text>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    style={{ pointerEvents: "all" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ) : (
                <Group gap="xs">
                  <IconUpload size={20} />
                  <Text size="sm" c="dimmed">
                    Drop a file here or click to browse
                  </Text>
                </Group>
              )}
            </Group>
          </Dropzone>

          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!title || !recordDate}
            >
              Save Record
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
