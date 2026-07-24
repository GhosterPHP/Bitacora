import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const { supabase } = locals;

  const formData = await request.formData();
  const noticket = String(formData.get('noticket') ?? '').trim();
  const tipoUsuario = String(formData.get('tipoUsuario') ?? '');
  const codce = Number(formData.get('codce'));
  const ce = String(formData.get('ce') ?? '').trim();

  if (!noticket || !tipoUsuario || !codce || !ce) {
    return redirect('/tickets/nuevo?error=' + encodeURIComponent('Completa todos los campos obligatorios.'));
  }

  // "usuario" (tabla) guarda solo el tipo Estudiante/Docente y ya viene
  // sembrada con esos dos valores. Buscamos su id para usarlo como FK.
  const { data: usuarioRow, error: errorUsuario } = await supabase
    .from('usuario')
    .select('id')
    .eq('tipo', tipoUsuario)
    .limit(1)
    .single();

  if (errorUsuario || !usuarioRow) {
    return redirect('/tickets/nuevo?error=' + encodeURIComponent('Tipo de usuario inválido.'));
  }

  // No enviamos "creado_por": la columna tiene default auth.uid(),
  // así que Supabase lo asigna solo con la sesión activa.
  const { error: errorInsert } = await supabase.from('tickets').insert({
    noticket,
    usuario: usuarioRow.id,
    codce,
    ce,
  });

  if (errorInsert) {
    console.error('Error al crear ticket:', errorInsert);
    const mensaje =
      errorInsert.code === '23505'
        ? 'Ya existe un ticket con ese número.'
        : 'No se pudo crear el ticket. Intenta de nuevo.';
    return redirect('/tickets/nuevo?error=' + encodeURIComponent(mensaje));
  }

  return redirect('/');
};