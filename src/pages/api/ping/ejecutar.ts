import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const { supabase, isAdmin } = locals;

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'No tienes permisos de administrador.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase.rpc('ejecutar_ping');

  if (error) {
    console.error('Error al ejecutar ping manual:', error);
    return new Response(JSON.stringify({ error: 'No se pudo ejecutar el ping.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};