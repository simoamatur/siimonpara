import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, autoFetch = true): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null });

  const fetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await axios.get<T>(url);
      setState({ data: res.data, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.response?.data?.error || 'خطأ داخلي' });
    }
  }, [url]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  return { ...state, refetch: fetch };
}

export function useApiList<T>(url: string, autoFetch = true): UseApiState<T[]> & { refetch: () => Promise<void> } {
  const result = useApi<T[]>(url, autoFetch);
  return {
    ...result,
    data: result.data ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePost<TReq, TRes>(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (body: TReq): Promise<TRes | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<TRes>(url, body);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'خطأ داخلي';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { execute, loading, error };
}

export function useDelete(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(url);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطأ داخلي');
      return false;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { execute, loading, error };
}
