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
  Progress,
  Transition,
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
    onError: (error: { message?: string }) => {
      notifications.show({
        title: "Upload failed",
        message: error.message || "Failed to upload file. Please check the file format and try again.",
        color: "red",
      });
    },
  });

  const textMutation = useMutation({
    mutationFn: (text: string) => consultationsApi.addTextInput(consultationId, text),
    onSuccess: (result) => {
      setUploads((prev) => [...prev, result]);
      setTextInput("");
      qc.invalidateQueries({ queryKey: ["consultation", consultationId] });
    },
    onError: (error: { message?: string }) => {
      notifications.show({
        title: "Failed to submit text",
        message: error.message || "Please try again.",
        color: "red",
      });
    },
  });

  return (
    <Card withBorder padding="md" h="100%" role="region" aria-label="Input file uploads and clinical notes">
      <Text fw={600} mb="sm">
        Inputs
      </Text>
      <Stack gap="sm">
        <Dropzone
          onDrop={(files) => files.forEach((f) => fileMutation.mutate(f))}
          accept={ACCEPT_TYPES}
          loading={fileMutation.isPending}
          maxSize={MAX_FILE_SIZE}
          aria-label="Upload images, audio, video or documents (max 50MB)"
        >
          <Group justify="center" gap="sm" py="md" style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconUpload size={28} stroke={1.5} aria-hidden="true" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={28} stroke={1.5} aria-hidden="true" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconUpload size={28} stroke={1.5} color="var(--mantine-color-dimmed)" aria-hidden="true" />
            </Dropzone.Idle>
            <div>
              <Text size="sm" inline>
                Drop files here
              </Text>
              <Text size="xs" c="dimmed" inline mt={4}>
                Images, audio, video, or documents (max 50MB)
              </Text>
            </div>
          </Group>
        </Dropzone>

        <Textarea
          placeholder="Add clinical notes..."
          minRows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.currentTarget.value)}
          aria-label="Clinical notes input"
          description="Enter any additional clinical information or observations"
        />
        <Button
          size="sm"
          variant="light"
          leftSection={<IconSend size={14} />}
          onClick={() => textInput.trim() && textMutation.mutate(textInput.trim())}
          loading={textMutation.isPending}
          disabled={!textInput.trim()}
          aria-label="Submit clinical notes"
        >
          Submit Text
        </Button>

        {uploads.length > 0 && (
          <>
            <Text size="xs" c="dimmed" fw={500} mt="xs">
              Uploaded ({uploads.length})
            </Text>
            <div role="list" aria-label="Uploaded files list">
              {uploads.map((u) => (
                <Group key={u.input_id} gap="xs" role="listitem">
                  <IconFile size={14} aria-hidden="true" />
                  <Badge size="xs" variant="light">
                    {u.type}
                  </Badge>
                  <Text size="xs" c="dimmed" ff="var(--mantine-font-family-monospace)">
                    {u.input_id.slice(0, 8)}
                  </Text>
                </Group>
              ))}
            </div>
          </>
        )}
      </Stack>
    </Card>
  );
}
