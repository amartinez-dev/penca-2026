import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashPin, nameKey, normalizeName } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = normalizeName(String(body.name || ''));
    const pin = String(body.pin || '').trim();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, pin_hash')
      .eq('name_key', nameKey(name))
      .single();

    if (error || !data) return NextResponse.json({ ok: false, error: 'Nombre o PIN incorrecto.' }, { status: 401 });
    if (data.pin_hash !== hashPin(name, pin)) {
      return NextResponse.json({ ok: false, error: 'Nombre o PIN incorrecto.' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, data: { participant: { id: data.id, name: data.name } } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'Error entrando a la penca.' }, { status: 500 });
  }
}
