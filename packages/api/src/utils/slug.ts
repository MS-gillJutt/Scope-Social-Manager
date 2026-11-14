import { PrismaClient } from '@scope/db';

/**
 * Converts a workspace name to a URL-safe slug.
 * e.g. "My Cool Workspace!" -> "my-cool-workspace"
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Generates a unique workspace slug, appending a random suffix if needed.
 */
export async function generateUniqueSlug(
  prisma: PrismaClient,
  name: string
): Promise<string> {
  const base = nameToSlug(name) || 'workspace';

  // Try the base slug first
  const existing = await prisma.workspace.findUnique({ where: { slug: base } });
  if (!existing) return base;

  // Append random 4-char hex suffix until unique
  for (let i = 0; i < 10; i++) {
    const suffix = Math.random().toString(36).substring(2, 6);
    const candidate = `${base}-${suffix}`;
    const conflict = await prisma.workspace.findUnique({ where: { slug: candidate } });
    if (!conflict) return candidate;
  }

  // Fallback: timestamp-based
  return `${base}-${Date.now().toString(36)}`;
}
