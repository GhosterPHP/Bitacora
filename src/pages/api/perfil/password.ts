import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const { supabase } = locals;

  const formData = await request.formData();
  const nuevaPassword = String(formData.get('password') ?? '');
  const confirmarPassword = String(formData.get('confirmarPassword') ?? '');

  if (nuevaPassword.length < 6) {
    return redirect('/configuracion?error=' + encodeURIComponent('La contraseña debe tener al menos 6 caracteres.'));
  }

  if (nuevaPassword !== confirmarPassword) {
    return redirect('/configuracion?error=' + encodeURIComponent('Las contraseñas no coinciden.'));
  }

  // supabase aquí ya está autenticado con la sesión del usuario
  // (vía cookies), así que updateUser actualiza SU PROPIA cuenta.
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });

  if (error) {
    console.error('Error al cambiar contraseña:', error);
    return redirect('/configuracion?error=' + encodeURIComponent('No se pudo cambiar la contraseña.'));
  }

  return redirect('/configuracion?exito=' + encodeURIComponent('Contraseña actualizada correctamente.'));
};