import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware principal de Next.js.
 * 1. Refresca session de Supabase (doc 07)
 * 2. Genera y propaga request_id (doc 12)
 * 3. Protege rutas que requieren autenticación
 */
export async function middleware(request: NextRequest) {
  // Generar request_id (formato req_<timestamp> para edge runtime, sin dep de ulid)
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  request.headers.set('x-request-id', requestId);

  // Refrescar session de Supabase
  const response = await updateSession(request);

  // Propagar request_id en response header (doc 12)
  response.headers.set('X-Request-Id', requestId);

  // Protected routes check
  const protectedPaths = ['/builder', '/collection', '/settings', '/decks'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: Array<{ name: string; value: string; options?: object }>,
          ) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
              request.cookies.set(name, value),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
