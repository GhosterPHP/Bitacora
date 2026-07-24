import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

const RUTAS_PUBLICAS = ['/login', '/api/session'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request, redirect, locals, url } = context;

  const supabase = createSupabaseServerClient(cookies, request.headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guarda la sesión y el cliente para usarlos dentro de cualquier página
  // vía Astro.locals, sin tener que recrear el cliente cada vez.
  locals.supabase = supabase;
  locals.user = user;

  // Solo se consulta si hay sesión (evita una llamada extra en /login).
  if (user) {
    const { data: esAdmin } = await supabase.rpc('is_admin');
    locals.isAdmin = esAdmin ?? false;
  } else {
    locals.isAdmin = false;
  }

  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => url.pathname.startsWith(ruta));

  if (!user && !esRutaPublica) {
    return redirect('/login');
  }

  return next();
});