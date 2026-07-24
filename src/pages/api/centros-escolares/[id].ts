import type { APIRoute } from 'astro';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase, isAdmin } = locals;
  const id = params.id;

  // Verificación explícita para dar un mensaje claro. RLS también lo
  // bloquearía aunque se salte esta validación (doble seguridad).
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'No tienes permisos de administrador.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase.from('centroseducativos').delete().eq('id', id);

  if (error) {
    console.error('Error al eliminar centro educativo:', error);
    return new Response(JSON.stringify({ error: 'No se pudo eliminar el centro educativo.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};