import { useState, useEffect } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "../api/patients";

export function usePatientLookup(initialQuery = "") {
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [debounced] = useDebouncedValue(searchValue, 350);

  const {
    data: patients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["patients", "search", debounced],
    queryFn: () => patientsApi.search(debounced),
    enabled: debounced.length >= 2,
  });

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  return {
    searchValue,
    setSearchValue,
    patients: patients ?? [],
    isLoading,
    error,
  };
}
