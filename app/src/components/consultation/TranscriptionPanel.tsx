import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  ScrollArea,
  Badge,
} from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconRefresh,
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
    <Card withBorder padding="md" h="100%">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Live Transcription</Text>
        <Badge color={connected ? "green" : "gray"} variant="dot" size="sm">
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
              >
                Stop
              </Button>
            </>
          )}
        </Group>

        <ScrollArea h={320}>
          {transcript ? (
            <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {transcript}
            </Text>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {connected
                ? "Listening... Send audio data to begin transcription."
                : "Click Connect to start live transcription."}
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
}
