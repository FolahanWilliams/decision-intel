'use client';

import { useEffect, useState } from 'react';
import { listApiKeys, revokeApiKey } from '@/app/actions/api-keys';
import { Trash } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    lastUsed: Date | null;
    createdAt: Date;
}

export function ApiKeyList() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listApiKeys()
            .then(setKeys)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this key? Any applications using it will stop working.')) return;

        await revokeApiKey(id);
        setKeys(keys.filter(k => k.id !== id));
    };

    if (loading) return <div className="text-xs text-muted">Loading keys...</div>;

    if (keys.length === 0) {
        return (
            <div className="text-center p-md border border-dashed border-gray-700 rounded-md">
                <p className="text-xs text-muted">No active API keys.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-sm">
            {keys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-sm bg-secondary rounded-sm border border-border">
                    <div>
                        <div className="flex items-center gap-sm">
                            <span className="font-mono text-sm font-bold text-accent-primary">{key.name}</span>
                            <span className="text-xs text-muted font-mono bg-black/20 px-1 rounded">
                                {key.keyPrefix}...
                            </span>
                        </div>
                        <div className="text-[10px] text-muted mt-1">
                            Created {format(new Date(key.createdAt), 'MMM d, yyyy')} •
                            Last used: {key.lastUsed ? format(new Date(key.lastUsed), 'MMM d, HH:mm') : 'Never'}
                        </div>
                    </div>
                    <button
                        onClick={() => handleRevoke(key.id)}
                        className="text-error hover:bg-error/10 p-1 rounded"
                        title="Revoke Key"
                    >
                        <Trash size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
