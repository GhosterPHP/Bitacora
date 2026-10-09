import type { APIRoute } from 'astro';
import { normalizarNombre, normalizarUrl } from '../../../lib/herramientas';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { supabase, isAdmin } = locals;

  if (!isAdmin) {
    return json({ error: 'Solo los administradores pueden editar herramientas.' }, 403);
  }

  const body = await request.json().catch(() => null);
  const nombre = normalizarNombre(body?.nombre);
  const url = normalizarUrl(body?.url);

  if (!nombre) return json({ error: 'Escribe un nombre (máximo 60 caracteres).' }, 400);
  if (!url) return json({ error: 'El enlace no es válido. Ejemplo: https://ejemplo.com' }, 400);

  const { data, error } = await supabase
    .from('herramientas')
    .update({ nombre, url })
    .eq('id', params.id)
    .select('id');

  if (error) {
    console.error('Error al editar herramienta:', error);
    if (error.code === '23505') {
      return json({ error: 'Ya existe una herramienta con ese enlace.' }, 409);
    }
    return json({ error: 'No se pudo actualizar la herramienta.' }, 400);
  }

  if (!data || data.length === 0) {
    return json({ error: 'La herramienta no existe.' }, 404);
  }

  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase, isAdmin } = locals;

  if (!isAdmin) {
    return json({ error: 'Solo los administradores pueden eliminar herramientas.' }, 403);
  }

  const { error } = await supabase.from('herramientas').delete().eq('id', params.id);

  if (error) {
    console.error('Error al eliminar herramienta:', error);
    return json({ error: 'No se pudo eliminar la herramienta.' }, 400);
  }

  return json({ ok: true });
};