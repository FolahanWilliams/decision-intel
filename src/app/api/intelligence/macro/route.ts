import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getMacroSnapshot } from '@/lib/tools/macroContext';

export const maxDuration = 30;

/**
 * GET /api/intelligence/macro — Fetch current macro-economic indicators from FRED.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshot = await getMacroSnapshot();
        return NextResponse.json(snapshot);
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch macro data', indicators: [], summary: 'Macro data temporarily unavailable.' },
            { status: 500 }
        );
    }
}
