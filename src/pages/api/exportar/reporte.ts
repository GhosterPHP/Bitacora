import type { APIRoute } from 'astro';

export const prerender = false;

function aCsv(filas: string[][]): string {
  const escapar = (valor: string) => {
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  };
  return filas.map((fila) => fila.map(escapar).join(',')).join('\n');
}

export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase } = locals;

  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');

  if (!desde || !hasta) {
    return new Response('Faltan las fechas del rango (desde/hasta).', { status: 400 });
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('codce, ce, fecha, usuario(tipo)')
    .gte('fecha', `${desde}T00:00:00`)
    .lte('fecha', `${hasta}T23:59:59.999`);

  if (error) {
    console.error('Error al generar reporte:', error);
    return new Response('No se pudo generar el reporte.', { status: 400 });
  }

  // Agrupa por centro (codce), contando cuántos tickets fueron de
  // Estudiante y cuántos de Docente.
  const porCentro = new Map<number, { ce: string; estudiante: number; docente: number }>();

  for (const t of data ?? []) {
    const tipo = (t as any).usuario?.tipo as 'Estudiante' | 'Docente' | undefined;
    if (!porCentro.has(t.codce)) {
      porCentro.set(t.codce, { ce: t.ce, estudiante: 0, docente: 0 });
    }
    const registro = porCentro.get(t.codce)!;
    if (tipo === 'Estudiante') registro.estudiante++;
    else if (tipo === 'Docente') registro.docente++;
  }

  const filas: string[][] = [['Centro escolar', 'Estudiante', 'Docente']];

  // Ordenado por código de centro, formato "00000 - Nombre".
  Array.from(porCentro.entries())
    .sort(([codA], [codB]) => codA - codB)
    .forEach(([cod, r]) => {
      filas.push([
        `${String(cod).padStart(5, '0')} - ${r.ce}`,
        String(r.estudiante),
        String(r.docente),
      ]);
    });

  const csv = aCsv(filas);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte_${desde}_a_${hasta}.csv"`,
    },
  });
};