import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashPin, nameKey, normalizeName, validatePin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = normalizeName(String(body.name || ''));
    const pin = String(body.pin || '').trim();
    const key = nameKey(name);

    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Ingresá un nombre válido.' }, { status: 400 });
    if (!validatePin(pin)) return NextResponse.json({ ok: false, error: 'El PIN debe tener entre 4 y 8 números.' }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('participants')
      .insert({ name, name_key: key, pin_hash: hashPin(name, pin) })
      .select('id, name')
      .single();

    if (error?.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Ese nombre ya está registrado. Entrá con tu PIN o usá un nombre más específico.' }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({ ok: true, data: { participant: data } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'Error registrando participante.' }, { status: 500 });
  }
}
