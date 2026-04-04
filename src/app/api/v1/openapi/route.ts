import { NextResponse } from 'next/server';
import spec from '../openapi.json';

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
