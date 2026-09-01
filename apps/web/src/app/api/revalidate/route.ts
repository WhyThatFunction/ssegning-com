import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KNOWN_TAGS = [
  'site-setting',
  'home-page',
  'about-page',
  'contact-page',
  'legal-page',
  'services',
  'projects',
  'posts',
];

interface RevalidateBody {
  tags?: string[];
  paths?: string[];
}

export async function POST(request: Request) {
  const expectedSecret = process.env.REVALIDATE_SECRET;
  const providedSecret = request.headers.get('x-revalidate-secret');

  if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ revalidated: false, message: 'Invalid secret' }, { status: 401 });
  }

  let body: RevalidateBody = {};
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    body = {};
  }

  const tags = body.tags && body.tags.length > 0 ? body.tags : KNOWN_TAGS;
  for (const tag of tags) {
    // 'max' forces an immediate purge regardless of the tag's own
    // time-based revalidate window (see src/lib/strapi.ts).
    revalidateTag(tag, 'max');
  }

  const paths = body.paths ?? [];
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, tags, paths });
}
