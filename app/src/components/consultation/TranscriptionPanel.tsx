import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  ScrollArea,
  Badge,
  Alert,
  Loader,
} from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerStop,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
} from "@tabler/icons-react";
import { useTranscription } from "../../hooks/useTranscription";

const STATUS_COLOR: Record<string, string> = {
  idle: "gray",
  connecting: "yellow",
  recording: "green",
  error: "red",
};

const STATUS_LABEL: Record<string, string> = {
  idle: "Disconnected",
  connecting: "Connecting…",
  recording: "Recording",
  error: "Error",
};

export function TranscriptionPanel() {
  const {
    status,
    transcript,
    error,
    connect,
    flush,
    finish,
    disconnect,
    reset,
  } = useTranscription();

  return (
    <Card
      withBorder
      padding="md"
      h="100%"
      role="region"
      aria-label="Live transcription panel"
    >
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Live Transcription</Text>
        <Badge
          color={STATUS_COLOR[status]}
          variant="dot"
          size="sm"
          aria-label={`Status: ${STATUS_LABEL[status]}`}
        >
          {status === "recording" && (
            <Loader color="green" size={10} type="dots" mr={4} />
          )}
          {STATUS_LABEL[status]}
        </Badge>
      </Group>

      {error && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          mb="sm"
          withCloseButton
          onClose={() => reset()}
        >
          {error}
        </Alert>
      )}

      <Stack gap="sm">
        <Group gap="xs">
          {status === "idle" || status === "error" ? (
            <Button
              size="xs"
              leftSection={<IconMicrophone size={14} />}
              onClick={connect}
              aria-label="Start recording"
            >
              Record
            </Button>
          ) : status === "connecting" ? (
            <Button size="xs" loading disabled>
              Connecting…
            </Button>
          ) : (
            <>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={flush}
                aria-label="Flush transcription buffer"
              >
                Flush
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconPlayerStop size={14} />}
                onClick={() => {
                  finish();
                  disconnect();
                }}
                aria-label="Stop recording"
              >
                Stop
              </Button>
            </>
          )}

          {transcript && status === "idle" && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconTrash size={14} />}
              onClick={reset}
              aria-label="Clear transcript"
            >
              Clear
            </Button>
          )}
        </Group>

        <ScrollArea h={320} type="always">
          <div aria-live="polite" aria-atomic="false">
            {transcript ? (
              <Text
                size="sm"
                style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
              >
                {transcript}
              </Text>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {status === "recording"
                  ? "Listening — speak into your microphone…"
                  : "Click Record to start live transcription."}
              </Text>
            )}
          </div>
        </ScrollArea>
      </Stack>
    </Card>
  );
}
