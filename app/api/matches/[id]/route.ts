import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ ok: false, error: 'Partido no encontrado.' }, { status: 404 });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el partido.' }, { status: 500 });
  }
}
