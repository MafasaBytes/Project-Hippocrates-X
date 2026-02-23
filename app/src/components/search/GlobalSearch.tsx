import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  SegmentedControl,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Badge,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { searchApi } from "../../api/search";
import { ConfidenceBadge } from "../consultation/ConfidenceBadge";
import { EmptyState } from "../shared/EmptyState";
import type { SearchResult, AnalysisSearchResult } from "../../types/api";
import dayjs from "dayjs";

interface Props {
  initialQuery?: string;
}

export function GlobalSearch({ initialQuery = "" }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"fulltext" | "semantic">("fulltext");
  const [ftResults, setFtResults] = useState<SearchResult[]>([]);
  const [semResults, setSemResults] = useState<AnalysisSearchResult[]>([]);

  const ftMutation = useMutation({
    mutationFn: (q: string) => searchApi.fulltext(q),
    onSuccess: (data) => setFtResults(data),
  });

  const semMutation = useMutation({
    mutationFn: (q: string) => searchApi.semantic({ query: q }),
    onSuccess: (data) => setSemResults(data),
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    if (mode === "fulltext") ftMutation.mutate(query.trim());
    else semMutation.mutate(query.trim());
  };

  const isLoading = ftMutation.isPending || semMutation.isPending;

  return (
    <Stack gap="md">
      <Group gap="sm" align="end">
        <TextInput
          aria-label="Search consultations and analyses"
          placeholder="Search consultations and analyses..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1 }}
          size="md"
        />
        <SegmentedControl
          aria-label="Search mode: full-text or semantic"
          data={[
            { label: "Full-text", value: "fulltext" },
            { label: "Semantic", value: "semantic" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "fulltext" | "semantic")}
          size="md"
        />
        <Button onClick={handleSearch} loading={isLoading} size="md" aria-label="Run search">
          Search
        </Button>
      </Group>

      {mode === "fulltext" && ftResults.length > 0 && (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {ftResults.length} result(s)
          </Text>
          {ftResults.map((r) => (
            <Card
              key={r.consultation_id}
              component="div"
              withBorder
              padding="sm"
              tabIndex={0}
              role="button"
              onClick={() => navigate(`/consultations/${r.consultation_id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/consultations/${r.consultation_id}`);
                }
              }}
              style={{ cursor: "pointer" }}
              aria-label={`Consultation ${r.consultation_id.slice(0, 8)}, ${dayjs(r.started_at).format("MMM D, YYYY")}`}
            >
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
                  Consultation {r.consultation_id.slice(0, 8)}
                </Text>
                <Text size="xs" c="dimmed">
                  {dayjs(r.started_at).format("MMM D, YYYY HH:mm")}
                </Text>
              </Group>
              {r.summary && (
                <Text size="sm" lineClamp={2}>
                  {r.summary}
                </Text>
              )}
            </Card>
          ))}
        </Stack>
      )}

      {mode === "semantic" && semResults.length > 0 && (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {semResults.length} result(s) by relevance
          </Text>
          {semResults.map((r, i) => (
            <Card
              key={r.analysis_id}
              component="div"
              withBorder
              padding="sm"
              tabIndex={0}
              role="button"
              onClick={() => navigate(`/consultations/${r.consultation_id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/consultations/${r.consultation_id}`);
                }
              }}
              style={{ cursor: "pointer" }}
              aria-label={`Analysis result ${i + 1}, consultation ${r.consultation_id.slice(0, 8)}`}
            >
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <Badge size="xs" variant="light">
                    #{i + 1}
                  </Badge>
                  <Text size="sm" fw={500} ff="var(--mantine-font-family-monospace)">
                    Analysis {r.analysis_id.slice(0, 8)}
                  </Text>
                </Group>
                <ConfidenceBadge value={Math.round(100 - i * 8)} />
              </Group>
              <Text size="xs" c="dimmed" mb={4}>
                Prompt: {r.prompt}
              </Text>
              <Text size="xs" c="dimmed">
                {dayjs(r.created_at).format("MMM D, YYYY HH:mm")}
              </Text>
            </Card>
          ))}
        </Stack>
      )}

      {!isLoading && ftResults.length === 0 && semResults.length === 0 && query.trim() && (
        <EmptyState
          title="No results found"
          description={`No consultations or analyses matched "${query.trim()}". Try different keywords or search mode.`}
          icon="search"
        />
      )}
    </Stack>
  );
}
