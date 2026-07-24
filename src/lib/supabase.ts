import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

// Crea un cliente de Supabase ligado a las cookies de la petición actual.
// Esto permite que Auth funcione correctamente en SSR: al hacer login,
// las cookies de sesión quedan guardadas en el navegador del usuario.
export function createSupabaseServerClient(cookies: AstroCookies, headers: Headers) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(
            Object.fromEntries(
              (headers.get('cookie') ?? '')
                .split('; ')
                .filter(Boolean)
                .map((c) => {
                  const [key, ...v] = c.split('=');
                  return [key, decodeURIComponent(v.join('='))];
                })
            )
          ).map(([name, value]) => ({ name, value: String(value) }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
          });
        },
      },
    }
  );
}