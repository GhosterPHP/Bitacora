import type { APIRoute } from 'astro';

export const prerender = false;

// Convierte un array de objetos a texto CSV, escapando comas/comillas.
function aCsv(filas: Record<string, any>[], columnas: string[]): string {
  const escapar = (valor: any) => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const encabezado = columnas.join(',');
  const cuerpo = filas.map((fila) => columnas.map((col) => escapar(fila[col])).join(','));
  return [encabezado, ...cuerpo].join('\n');
}

export const GET: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const tipo = params.tipo;

  if (tipo === 'tickets') {
    const { data, error } = await supabase
      .from('tickets')
      .select('noticket, codce, ce, fecha, imagen, usuario(tipo)')
      .order('fecha', { ascending: false });

    if (error) {
      return new Response('No se pudieron obtener los tickets.', { status: 400 });
    }

    const filas = (data ?? []).map((t: any) => ({
      noticket: t.noticket,
      tipo_usuario: t.usuario?.tipo ?? '',
      codce: t.codce,
      ce: t.ce,
      fecha: t.fecha,
      imagen: t.imagen ?? '',
    }));

    const csv = aCsv(filas, ['noticket', 'tipo_usuario', 'codce', 'ce', 'fecha', 'imagen']);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tickets.csv"',
      },
    });
  }

  if (tipo === 'rutas') {
    const { data, error } = await supabase
      .from('rutas')
      .select('codce, ce, fecha')
      .order('fecha', { ascending: false });

    if (error) {
      return new Response('No se pudieron obtener las rutas.', { status: 400 });
    }

    const csv = aCsv(data ?? [], ['codce', 'ce', 'fecha']);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rutas.csv"',
      },
    });
  }

  return new Response('Tipo de exportación no válido.', { status: 400 });
};