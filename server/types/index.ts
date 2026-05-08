export interface PaginationParams {
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
