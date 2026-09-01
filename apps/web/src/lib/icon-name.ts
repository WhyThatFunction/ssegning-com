/**
 * Converts a Strapi-authored lucide icon name (kebab-case, e.g. "cloud-cog")
 * into the PascalCase export name lucide-react uses (e.g. "CloudCog").
 */
export function toPascalCase(kebab: string): string {
  return kebab
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
