import { Link } from "react-router-dom";
import { Title, Button } from "@mantine/core";
import { EmptyState } from "../components/shared/EmptyState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <>
      <Title order={1} mb="lg">
        Page not found
      </Title>
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        icon="error"
        action={
          <Button component={Link} to="/" variant="light">
            Go to Dashboard
          </Button>
        }
      />
    </>
  );
}
