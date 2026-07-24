import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const { supabase } = locals;

  const formData = await request.formData();
  const cod = Number(formData.get('cod'));
  const nombre = String(formData.get('nombre') ?? '').trim();

  if (!cod || !nombre) {
    return redirect('/centros-escolares/nuevo?error=' + encodeURIComponent('Completa todos los campos obligatorios.'));
  }

  const { error } = await supabase.from('centroseducativos').insert({ cod, nombre });

  if (error) {
    console.error('Error al crear centro educativo:', error);
    const mensaje =
      error.code === '23505'
        ? 'Ya existe un centro registrado con ese código.'
        : 'No se pudo crear el centro educativo.';
    return redirect('/centros-escolares/nuevo?error=' + encodeURIComponent(mensaje));
  }

  return redirect('/centros-escolares');
};