import React from "react";
import { Card, Text, Stack, Center, Button, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // In production, send to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card withBorder padding="lg" bg="red.0" style={{ border: "1px solid #ef4444" }}>
          <Center py="xl">
            <Stack gap="md" align="center">
              <ThemeIcon size="xl" variant="light" color="red">
                <IconAlertTriangle size={32} stroke={1.5} />
              </ThemeIcon>
              <Text fw={600} size="lg">
                Something went wrong
              </Text>
              {this.state.error && (
                <Text size="sm" c="dimmed" style={{ maxWidth: "400px", textAlign: "center" }}>
                  {import.meta.env.PROD
                    ? "An unexpected error occurred. Our team has been notified."
                    : this.state.error.message}
                </Text>
              )}
              <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
                Please try refreshing the page. If the problem persists, contact support.
              </Text>
              <Button onClick={this.handleReset} mt="md">
                Try Again
              </Button>
            </Stack>
          </Center>
        </Card>
      );
    }

    return this.props.children;
  }
}
