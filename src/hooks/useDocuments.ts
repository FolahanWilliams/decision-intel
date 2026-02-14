import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface UploadedDoc {
    id: string;
    filename: string;
    status: string;
    score?: number;
    uploadedAt: string;
}

/**
 * SWR hook for fetching the user's document list.
 * Caches results and automatically deduplicates concurrent requests.
 * 
 * @param detailed If true, fetches the detailed view (?detailed=true)
 */
export function useDocuments(detailed = false) {
    const url = detailed ? '/api/documents?detailed=true' : '/api/documents';

    const { data, error, isLoading, mutate } = useSWR<UploadedDoc[]>(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000, // Don't re-fetch within 5 seconds
        }
    );

    return {
        documents: data ?? [],
        isLoading,
        error,
        mutate, // Expose mutate for optimistic updates on upload/delete
    };
}
