import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface UsePaginatedState<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export function usePaginatedApi<T>(baseUrl: string, defaultLimit = 50) {
  const [state, setState] = useState<UsePaginatedState<T>>({
    data: [],
    total: 0,
    page: 1,
    limit: defaultLimit,
    totalPages: 0,
    loading: false,
    error: null,
  });

  const fetch = useCallback(
    async (page = 1, limit = state.limit) => {
      setState((prev) => ({ ...prev, loading: true, error: null, page }));
      try {
        const res = await axios.get<PaginatedResult<T>>(baseUrl, {
          params: { page, limit },
        });
        const { data, total } = res.data;
        setState((prev) => ({
          ...prev,
          data: data ?? [],
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          loading: false,
          error: null,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.response?.data?.error || 'خطأ داخلي',
        }));
      }
    },
    [baseUrl, state.limit]
  );

  useEffect(() => {
    fetch(1, state.limit);
  }, [fetch]);

  const setPage = useCallback(
    (page: number) => fetch(page, state.limit),
    [fetch, state.limit]
  );

  const setLimit = useCallback(
    (limit: number) => fetch(1, limit),
    [fetch]
  );

  return {
    ...state,
    setPage,
    setLimit,
    refetch: () => fetch(state.page, state.limit),
  };
}
