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

interface DocumentsResponse {
    documents: UploadedDoc[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * SWR hook for fetching the user's document list with pagination.
 * Caches results keyed by page so different pages are cached independently.
 *
 * @param detailed If true, fetches the detailed view (?detailed=true)
 * @param page     Page number (1-based, default 1)
 * @param limit    Number of documents per page (default 10, max 100)
 */
export function useDocuments(detailed = false, page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (detailed) params.set('detailed', 'true');
    params.set('page', String(page));
    params.set('limit', String(limit));
    const url = `/api/documents?${params.toString()}`;

    const { data, error, isLoading, mutate } = useSWR<DocumentsResponse>(
        url,
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000, // Don't re-fetch within 5 seconds
        }
    );

    return {
        documents: data?.documents ?? [],
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 1,
        isLoading,
        error,
        mutate, // Expose mutate for optimistic updates on upload/delete
    };
}
