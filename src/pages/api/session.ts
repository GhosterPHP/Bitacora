import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return redirect('/login?error=' + encodeURIComponent('Completa email y contraseña.'));
  }

  const supabase = createSupabaseServerClient(cookies, request.headers);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect('/login?error=' + encodeURIComponent('Credenciales incorrectas.'));
  }

  return redirect('/');
};

export const DELETE: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies, request.headers);
  await supabase.auth.signOut();
  return redirect('/login');
};