import { NextResponse } from 'next/server';
import { isCronRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isCronRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  const baseUrl = new URL(request.url).origin;
  const res = await fetch(`${baseUrl}/api/admin/sync-api-football`, {
    method: 'POST',
    headers: { 'x-admin-password': process.env.ADMIN_PASSWORD || '' }
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
