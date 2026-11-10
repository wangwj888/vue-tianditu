export interface SearchLocalState {
  tdtMap: T.Map | null;
  localSearch: T.LocalSearch | null;
  keyword: string;
  queryType: number;
  showRoute: boolean;
  loading: boolean;
  hasSearched: boolean;
  error: Error | null;
}
export interface SearchResultState extends Pick<
  T.LocalSearchResult,
  "pois" | "statistics" | "area" | "suggests" | "prompt" | "lineData"
> {}
export interface SearchViewState {
  target: VT.LngLat | null;
  content: string;
  current: number;
  total: number;
}
export type SearchState = SearchLocalState & SearchResultState & SearchViewState;
export interface SearchRouteButtons {
  driving?: boolean;
  transit?: boolean;
  walking?: boolean;
}
export interface SearchExposed {
  search(keyword?: string): void;
  clear(): void;
  getSearch(): T.LocalSearch | null;
}
export interface SearchItemSlot {
  poi: T.LocalSearchPoi;
  index: number;
  select(): void;
}
