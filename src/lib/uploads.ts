import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const CARPETA_DESTINO = path.join(process.cwd(), 'public', 'uploads', 'tickets');

/**
 * Guarda un archivo subido en public/uploads/tickets y devuelve la ruta
 * pública con la que se sirve (ej. "/uploads/tickets/xxxx.jpg"), lista
 * para guardar en la columna "imagen" de la tabla tickets.
 *
 * Devuelve null si no se recibió un archivo válido (campo vacío).
 */
export async function guardarImagenTicket(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  await mkdir(CARPETA_DESTINO, { recursive: true });

  const extension = path.extname(file.name) || '.jpg';
  const nombreArchivo = `${randomUUID()}${extension}`;
  const rutaEnDisco = path.join(CARPETA_DESTINO, nombreArchivo);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(rutaEnDisco, buffer);

  // Ruta pública: todo lo que está en /public se sirve desde la raíz.
  return `/uploads/tickets/${nombreArchivo}`;
}