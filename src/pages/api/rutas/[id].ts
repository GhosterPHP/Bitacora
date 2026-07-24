import type { APIRoute } from 'astro';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const id = params.id;

  // RLS se encarga de impedir que se elimine una ruta ajena: si el id
  // no pertenece al usuario logueado, simplemente no borra nada.
  const { error } = await supabase.from('rutas').delete().eq('id', id);

  if (error) {
    console.error('Error al eliminar ruta:', error);
    return new Response(JSON.stringify({ error: 'No se pudo eliminar la ruta.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};