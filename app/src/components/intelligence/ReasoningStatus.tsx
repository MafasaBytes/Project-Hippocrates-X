import { Group, Text, Loader, ThemeIcon } from "@mantine/core";
import {
  IconBrain,
  IconCheck,
  IconClock,
  IconFlask,
} from "@tabler/icons-react";

type Phase = "idle" | "analyzing" | "synthesizing" | "reviewing" | "complete";

const PHASE_CONFIG: Record<
  Phase,
  { icon: React.ElementType; label: string; color: string; animate: boolean }
> = {
  idle: { icon: IconClock, label: "Awaiting input", color: "slate", animate: false },
  analyzing: { icon: IconBrain, label: "Analyzing...", color: "clinical", animate: true },
  synthesizing: { icon: IconFlask, label: "Synthesizing...", color: "indigo", animate: true },
  reviewing: { icon: IconBrain, label: "Reviewing evidence...", color: "warning", animate: true },
  complete: { icon: IconCheck, label: "Analysis complete", color: "success", animate: false },
};

interface ReasoningStatusProps {
  phase: Phase;
  compact?: boolean;
}

export function ReasoningStatus({ phase, compact = false }: ReasoningStatusProps) {
  const config = PHASE_CONFIG[phase] ?? PHASE_CONFIG.idle;
  const Icon = config.icon;

  return (
    <Group gap="xs" wrap="nowrap" aria-live="polite" role="status">
      {config.animate ? (
        <Loader size={compact ? 14 : 18} color={`var(--mantine-color-${config.color}-5)`} type="dots" />
      ) : (
        <ThemeIcon size={compact ? "xs" : "sm"} variant="light" color={config.color} radius="xl">
          <Icon size={compact ? 10 : 14} />
        </ThemeIcon>
      )}
      <Text size={compact ? "xs" : "sm"} c={`${config.color}.4`} fw={500}>
        {config.label}
      </Text>
    </Group>
  );
}
