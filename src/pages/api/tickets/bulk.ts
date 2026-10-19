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

    // 3. Lógica de Centros Educativos (Anti-Condición de Carrera)
    // Usa upsert + ignoreDuplicates: Intenta insertar, si el código ya existe, 
    // ignora la inserción silenciosamente sin arrojar error.
   await supabase
      .from('centroseducativos')
      .upsert(
        { cod: codce, nombre: ce },
        { onConflict: 'cod', ignoreDuplicates: true }
      );

    // 🔥 NUEVO: Ahora le pedimos a la BD el nombre oficial que tiene registrado
    const { data: ceOficial } = await supabase
      .from('centroseducativos')
      .select('nombre')
      .eq('cod', codce)
      .single();

    // Si encontró el nombre oficial en la BD lo usamos. Si por alguna extraña razón falla, usamos el del CSV.
    const nombreFinalCE = ceOficial ? ceOficial.nombre : ce;

// 4. Insertar el Ticket en la tabla tickets
    
    let valorTicketDB = noticket;
    
    if (noticket === '(Sin Ticket)') {
      // A) Buscamos en la base de datos el último ticket que empiece con "N/A-"
      // Al ordenarlo de forma descendente, el más alto (ej. N/A-015) quedará de primero.
      const { data: ultimoTicket } = await supabase
        .from('tickets')
        .select('noticket')
        .like('noticket', 'N/A-%')
        .order('noticket', { ascending: false })
        .limit(1)
        .maybeSingle();

      let siguienteNumero = 1;

      // B) Si ya existe un ticket anterior, le extraemos el número y le sumamos 1
      if (ultimoTicket && ultimoTicket.noticket) {
        // Separa "N/A" de "015"
        const partes = ultimoTicket.noticket.split('-'); 
        if (partes.length === 2) {
          const numeroActual = parseInt(partes[1], 10);
          if (!isNaN(numeroActual)) {
            siguienteNumero = numeroActual + 1;
          }
        }
      }

      // C) Formateamos el nuevo número con ceros a la izquierda (ej. 001, 002... 016)
      // padStart(3, '0') asegura que siempre tenga al menos 3 dígitos
      const numeroFormateado = siguienteNumero.toString().padStart(3, '0');
      valorTicketDB = `N/A-${numeroFormateado}`;
    }

    // Insertamos finalmente el ticket
    const { error: errorInsertTicket } = await supabase.from('tickets').insert({
      noticket: valorTicketDB, // Se enviará ej: "N/A-001"
      usuario: usuarioRow.id,
      codce,
      ce: nombreFinalCE 
    });

    if (errorInsertTicket) {
      console.error('Error al insertar ticket:', errorInsertTicket);
      if (errorInsertTicket.code === '23505') {
        return new Response(JSON.stringify({ error: 'Duplicado' }), { status: 409 });
      }
      return new Response(JSON.stringify({ error: 'Error al crear ticket en BD.' }), { status: 500 });
    }
    // Si todo salió perfecto, check verde ✅
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error en bulk.ts:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
};