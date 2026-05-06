export function normalizeForSearch(value: string): string {
  const v = (value ?? '').trim().toLowerCase();
  // NFD separa letras y diacríticos; luego se eliminan diacríticos básicos.
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function slugify(value: string): string {
  const base = normalizeForSearch(value);
  return base
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

