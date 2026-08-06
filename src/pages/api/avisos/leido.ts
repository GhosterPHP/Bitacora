import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autenticado.' }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const avisoId = String(body.avisoId ?? '');

  if (!avisoId) {
    return new Response(JSON.stringify({ error: 'Falta el id del aviso.' }), { status: 400 });
  }

  const { error } = await supabase.from('avisos_leidos').insert({ usuario: user.id, aviso_id: avisoId });

  if (error) {
    console.error('Error al marcar aviso como leído:', error);
    return new Response(JSON.stringify({ error: 'No se pudo guardar.' }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};