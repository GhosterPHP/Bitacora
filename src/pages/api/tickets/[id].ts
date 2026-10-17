import type { APIRoute } from 'astro';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { supabase } = locals;
  const id = params.id;

  try {
    const formData = await request.formData();
    const noticket = String(formData.get('noticket') ?? '').trim();
    const tipoUsuario = String(formData.get('tipoUsuario') ?? '');
    const codce = Number(formData.get('codce'));
    const ce = String(formData.get('ce') ?? '').trim();
    const imagenRaw = String(formData.get('imagen') ?? '').trim();
    const imagen = imagenRaw.length > 0 ? imagenRaw : null;

    if (!noticket || !tipoUsuario || !codce || !ce) {
      return new Response(
        JSON.stringify({ error: 'Completa todos los campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: usuarioRow, error: errorUsuario } = await supabase
      .from('usuario')
      .select('id')
      .eq('tipo', tipoUsuario)
      .limit(1)
      .single();

    if (errorUsuario || !usuarioRow) {
      return new Response(
        JSON.stringify({ error: 'Tipo de usuario inválido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: errorUpdate } = await supabase
      .from('tickets')
      .update({
        noticket,
        usuario: usuarioRow.id,
        codce,
        ce,
        imagen,
      })
      .eq('id', id);

    if (errorUpdate) {
      console.error('Error al actualizar ticket:', errorUpdate);
      const mensaje = errorUpdate.code === '23505'
        ? 'Ya existe un ticket con ese número.'
        : 'No se pudo actualizar el ticket. Intenta de nuevo.';
      
      return new Response(
        JSON.stringify({ error: mensaje }),
        { status: errorUpdate.code === '23505' ? 409 : 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Ticket actualizado correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error procesando PATCH:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const id = params.id;

  try {
    const { error } = await supabase.from('tickets').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar ticket:', error);
      return new Response(
        JSON.stringify({ error: 'No se pudo eliminar el ticket.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Ticket eliminado correctamente.' }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error procesando DELETE:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};