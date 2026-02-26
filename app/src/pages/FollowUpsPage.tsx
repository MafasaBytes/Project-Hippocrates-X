import { Title, Stack } from "@mantine/core";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { FollowUpPanel } from "../components/follow-up/FollowUpPanel";

export function FollowUpsPage() {
  useDocumentTitle("Follow-Ups");

  return (
    <Stack gap="md">
      <Title order={1}>Follow-Ups</Title>
      <FollowUpPanel showTitle={false} limit={50} />
    </Stack>
  );
}
