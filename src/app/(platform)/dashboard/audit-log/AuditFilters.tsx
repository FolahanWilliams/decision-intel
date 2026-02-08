'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, Filter } from 'lucide-react';

export default function AuditFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (term: string) => {
        startTransition(() => {
            router.push(`?${createQueryString('search', term)}`);
        });
    };

    const handleActionFilter = (action: string) => {
        startTransition(() => {
            router.push(`?${createQueryString('action', action)}`);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-md mb-lg">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="Search resources or details..."
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('search') || ''}
                />
            </div>

            {/* Filter */}
            <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <select
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background appearance-none cursor-pointer"
                    onChange={(e) => handleActionFilter(e.target.value)}
                    defaultValue={searchParams.get('action') || ''}
                >
                    <option value="">All Actions</option>
                    <option value="SCAN_DOCUMENT">Scan Document</option>
                    <option value="EXPORT_PDF">Export Report</option>
                    <option value="VIEW_DOCUMENT">View Document</option>
                    <option value="LOGIN">Login</option>
                </select>
            </div>
            {isPending && <div className="flex items-center text-xs text-muted-foreground">Updating...</div>}
        </div>
    );
}
