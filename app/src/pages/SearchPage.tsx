import { useSearchParams } from "react-router-dom";
import { Title } from "@mantine/core";
import { GlobalSearch } from "../components/search/GlobalSearch";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  return (
    <>
      <Title order={2} mb="lg">
        Search
      </Title>
      <GlobalSearch initialQuery={initialQuery} />
    </>
  );
}
