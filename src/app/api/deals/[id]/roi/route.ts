import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeROIAttribution } from '@/lib/analytics/roi-attribution';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const attribution = await computeROIAttribution(id);

  if (!attribution) {
    return NextResponse.json({ error: 'Not found or no data' }, { status: 404 });
  }

  return NextResponse.json(attribution);
}
