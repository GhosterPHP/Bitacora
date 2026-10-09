import type { APIRoute } from 'astro';
import { normalizarNombre, normalizarUrl } from '../../lib/herramientas';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, isAdmin } = locals;

  // Validación explícita para dar un mensaje claro; RLS también lo bloquea.
  if (!isAdmin) {
    return json({ error: 'Solo los administradores pueden agregar herramientas.' }, 403);
  }

  const body = await request.json().catch(() => null);
  const nombre = normalizarNombre(body?.nombre);
  const url = normalizarUrl(body?.url);

  if (!nombre) return json({ error: 'Escribe un nombre (máximo 60 caracteres).' }, 400);
  if (!url) return json({ error: 'El enlace no es válido. Ejemplo: https://ejemplo.com' }, 400);

  const { error } = await supabase.from('herramientas').insert({ nombre, url });

  if (error) {
    console.error('Error al agregar herramienta:', error);
    if (error.code === '23505') {
      return json({ error: 'Ya existe una herramienta con ese enlace.' }, 409);
    }
    return json({ error: 'No se pudo guardar la herramienta.' }, 400);
  }

  return json({ ok: true }, 201);
};