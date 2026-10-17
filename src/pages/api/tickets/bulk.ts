import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

  try {
    // 1. Recibimos los datos del ticket enviados por el bucle del frontend
    const body = await request.json();
    const { noticket, tipoUsuario, codce, ce } = body;

    if (!noticket || !tipoUsuario || !codce || !ce) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios.' }), { status: 400 });
    }

    // 2. Validar el tipo de usuario (Estudiante o Docente) y obtener su ID
    const { data: usuarioRow, error: errorUsuario } = await supabase
      .from('usuario')
      .select('id')
      .eq('tipo', tipoUsuario)
      .limit(1)
      .single();

    if (errorUsuario || !usuarioRow) {
      return new Response(JSON.stringify({ error: 'Tipo de usuario inválido.' }), { status: 400 });
    }

    // 3. Lógica de Centros Educativos (Evitar duplicados)
    // Verificamos si el código del centro ya existe en el directorio
    const { data: ceExistente } = await supabase
      .from('centroseducativos')
      .select('id')
      .eq('cod', codce)
      .maybeSingle();

    if (!ceExistente) {
      // Si el centro no existe, lo registramos en la tabla centroseducativos
      await supabase
        .from('centroseducativos')
        .insert({ cod: codce, nombre: ce });
    }
    // Si ya existe, no hacemos nada con la tabla centroseducativos, simplemente continuamos.

    // 4. Insertar el Ticket en la tabla tickets
    // No enviamos "creado_por" ni "imagen" porque Supabase o maneja el default o permite nulos
    const { error: errorInsertTicket } = await supabase.from('tickets').insert({
      noticket,
      usuario: usuarioRow.id,
      codce,
      ce
    });

    if (errorInsertTicket) {
      console.error('Error al insertar masivo:', errorInsertTicket);
      // Validamos si el error es por ticket duplicado (Código 23505 en PostgreSQL)
      if (errorInsertTicket.code === '23505') {
        return new Response(JSON.stringify({ error: 'Duplicado' }), { status: 409 });
      }
      return new Response(JSON.stringify({ error: 'Error al crear ticket en BD.' }), { status: 500 });
    }

    // Si todo salió perfecto, le decimos al frontend que marque el check verde ✅
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error en bulk.ts:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
};