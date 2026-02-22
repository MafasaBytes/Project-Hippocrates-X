import { api } from "./client";
import type {
  SearchResult,
  SemanticSearchRequest,
  AnalysisSearchResult,
} from "../types/api";

export const searchApi = {
  fulltext: (q: string, limit = 20) =>
    api
      .get<SearchResult[]>("/api/search", { params: { q, limit } })
      .then((r) => r.data),

  semantic: (data: SemanticSearchRequest) =>
    api
      .post<AnalysisSearchResult[]>("/api/search/semantic", data)
      .then((r) => r.data),
};
