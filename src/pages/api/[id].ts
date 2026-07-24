import type { APIRoute } from 'astro';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, redirect, locals }) => {
  const { supabase } = locals;
  const id = params.id;

  const formData = await request.formData();
  const noticket = String(formData.get('noticket') ?? '').trim();
  const tipoUsuario = String(formData.get('tipoUsuario') ?? '');
  const codce = Number(formData.get('codce'));
  const ce = String(formData.get('ce') ?? '').trim();

  if (!noticket || !tipoUsuario || !codce || !ce) {
    return redirect(`/tickets/editar/${id}?error=` + encodeURIComponent('Completa todos los campos obligatorios.'));
  }

  const { data: usuarioRow, error: errorUsuario } = await supabase
    .from('usuario')
    .select('id')
    .eq('tipo', tipoUsuario)
    .limit(1)
    .single();

  if (errorUsuario || !usuarioRow) {
    return redirect(`/tickets/editar/${id}?error=` + encodeURIComponent('Tipo de usuario inválido.'));
  }

  // RLS se encarga de impedir que se edite un ticket que no te
  // pertenece: si el id no es tuyo, esta consulta simplemente no
  // actualiza ninguna fila.
  const { error: errorUpdate } = await supabase
    .from('tickets')
    .update({
      noticket,
      usuario: usuarioRow.id,
      codce,
      ce,
    })
    .eq('id', id);

  if (errorUpdate) {
    console.error('Error al actualizar ticket:', errorUpdate);
    const mensaje =
      errorUpdate.code === '23505'
        ? 'Ya existe un ticket con ese número.'
        : 'No se pudo actualizar el ticket.';
    return redirect(`/tickets/editar/${id}?error=` + encodeURIComponent(mensaje));
  }

  return redirect('/');
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const id = params.id;

  const { error } = await supabase.from('tickets').delete().eq('id', id);

  if (error) {
    console.error('Error al eliminar ticket:', error);
    return new Response(JSON.stringify({ error: 'No se pudo eliminar el ticket.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};