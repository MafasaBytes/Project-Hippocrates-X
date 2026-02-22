import { useState } from "react";
import {
  Card,
  Text,
  Stack,
  Textarea,
  Button,
  Group,
  Badge,
  ActionIcon,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { IconUpload, IconFile, IconX, IconSend } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import type { InputOut } from "../../types/api";

const ACCEPT_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".dcm"],
  "audio/*": [".wav", ".mp3", ".flac", ".ogg", ".m4a"],
  "video/*": [".mp4", ".webm"],
  "text/*": [".txt", ".csv", ".json"],
  "application/pdf": [".pdf"],
};

interface Props {
  consultationId: string;
}

export function InputPanel({ consultationId }: Props) {
  const qc = useQueryClient();
  const [textInput, setTextInput] = useState("");
  const [uploads, setUploads] = useState<InputOut[]>([]);

  const fileMutation = useMutation({
    mutationFn: (file: File) => consultationsApi.addFileInput(consultationId, file),
    onSuccess: (result) => {
      setUploads((prev) => [...prev, result]);
      qc.invalidateQueries({ queryKey: ["consultation", consultationId] });
      notifications.show({ title: "File uploaded", message: result.type, color: "green" });
    },
    onError: () => {
      notifications.show({ title: "Upload failed", message: "Check file format", color: "red" });
    },
  });

  const textMutation = useMutation({
    mutationFn: (text: string) => consultationsApi.addTextInput(consultationId, text),
    onSuccess: (result) => {
      setUploads((prev) => [...prev, result]);
      setTextInput("");
      qc.invalidateQueries({ queryKey: ["consultation", consultationId] });
    },
  });

  return (
    <Card withBorder padding="md" h="100%">
      <Text fw={600} mb="sm">
        Inputs
      </Text>
      <Stack gap="sm">
        <Dropzone
          onDrop={(files) => files.forEach((f) => fileMutation.mutate(f))}
          accept={ACCEPT_TYPES}
          loading={fileMutation.isPending}
          maxSize={50 * 1024 * 1024}
        >
          <Group justify="center" gap="sm" py="md" style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconUpload size={28} stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={28} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconUpload size={28} stroke={1.5} color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>
            <div>
              <Text size="sm" inline>
                Drop files here
              </Text>
              <Text size="xs" c="dimmed" inline mt={4}>
                Images, audio, video, or documents
              </Text>
            </div>
          </Group>
        </Dropzone>

        <Textarea
          placeholder="Add clinical notes..."
          minRows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.currentTarget.value)}
        />
        <Button
          size="sm"
          variant="light"
          leftSection={<IconSend size={14} />}
          onClick={() => textInput.trim() && textMutation.mutate(textInput.trim())}
          loading={textMutation.isPending}
          disabled={!textInput.trim()}
        >
          Submit Text
        </Button>

        {uploads.length > 0 && (
          <>
            <Text size="xs" c="dimmed" fw={500} mt="xs">
              Uploaded ({uploads.length})
            </Text>
            {uploads.map((u) => (
              <Group key={u.input_id} gap="xs">
                <IconFile size={14} />
                <Badge size="xs" variant="light">
                  {u.type}
                </Badge>
                <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                  {u.input_id.slice(0, 8)}
                </Text>
              </Group>
            ))}
          </>
        )}
      </Stack>
    </Card>
  );
}
