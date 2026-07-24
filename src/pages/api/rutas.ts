import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const { supabase } = locals;

  const formData = await request.formData();
  const centroId = String(formData.get('centroId') ?? '');

  if (!centroId) {
    return redirect('/rutas/nueva?error=' + encodeURIComponent('Selecciona un centro educativo.'));
  }

  // Se busca el codce/nombre en la base de datos a partir del id
  // seleccionado, en vez de confiar en texto escrito a mano. Así el
  // valor siempre coincide exactamente con el directorio.
  const { data: centro, error: errorCentro } = await supabase
    .from('centroseducativos')
    .select('cod, nombre')
    .eq('id', centroId)
    .single();

  if (errorCentro || !centro) {
    return redirect('/rutas/nueva?error=' + encodeURIComponent('El centro educativo seleccionado no es válido.'));
  }

  // No enviamos "creado_por" ni "fecha": ambas columnas tienen sus
  // propios default (auth.uid() y now()), Supabase las llena solas.
  const { error } = await supabase.from('rutas').insert({ codce: centro.cod, ce: centro.nombre });

  if (error) {
    console.error('Error al crear ruta:', error);
    return redirect('/rutas/nueva?error=' + encodeURIComponent('No se pudo crear la ruta.'));
  }

  return redirect('/rutas');
};