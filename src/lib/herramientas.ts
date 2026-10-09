// Validaciones compartidas por los endpoints de herramientas.

/** Devuelve la URL normalizada (con https:// si faltaba) o null si no es válida. */
export function normalizarUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let valor = raw.trim();
  if (!valor) return null;

  if (!/^https?:\/\//i.test(valor)) valor = `https://${valor}`;

  try {
    const u = new URL(valor);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null; // descarta "algo" sin dominio
    return u.toString();
  } catch {
    return null;
  }
}

/** Devuelve el nombre limpio (1 a 60 caracteres) o null si no es válido. */
export function normalizarNombre(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const valor = raw.trim().replace(/\s+/g, ' ');
  return valor.length >= 1 && valor.length <= 60 ? valor : null;
}