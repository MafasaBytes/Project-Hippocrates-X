import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  ScrollArea,
  Badge,
  Transition,
} from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranscription } from "../../hooks/useTranscription";

export function TranscriptionPanel() {
  const {
    connected,
    transcript,
    connect,
    flush,
    finish,
    disconnect,
  } = useTranscription();

  return (
    <Card withBorder padding="md" h="100%" role="region" aria-label="Live transcription panel">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Live Transcription</Text>
        <Badge
          color={connected ? "green" : "gray"}
          variant="dot"
          size="sm"
          aria-label={`Connection status: ${connected ? "Connected" : "Disconnected"}`}
        >
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </Group>

      <Stack gap="sm">
        <Group gap="xs">
          {!connected ? (
            <Button
              size="xs"
              leftSection={<IconMicrophone size={14} />}
              onClick={connect}
              aria-label="Connect to transcription service"
            >
              Connect
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
                leftSection={<IconPlayerPause size={14} />}
                onClick={() => {
                  finish();
                  disconnect();
                }}
                aria-label="Stop transcription"
              >
                Stop
              </Button>
            </>
          )}
        </Group>

        <ScrollArea h={320} type="always">
          <div aria-live="polite" aria-atomic="true">
            {transcript ? (
              <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {transcript}
              </Text>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {connected ? (
                  <span>
                    <IconAlertCircle size={16} /> Listening... Send audio data to begin transcription.
                  </span>
                ) : (
                  "Click Connect to start live transcription."
                )}
              </Text>
            )}
          </div>
        </ScrollArea>
      </Stack>
    </Card>
  );
}
