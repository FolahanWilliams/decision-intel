import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

/**
 * SWR hook for fetching a single document by ID.
 * Used by the document detail page.
 */
export function useDocument(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        id ? `/api/documents/${id}` : null, // null key = don't fetch
        fetcher,
        {
            revalidateOnFocus: false,
        }
    );

    return {
        document: data ?? null,
        isLoading,
        error,
        mutate,
    };
}
