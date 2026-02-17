import { type NextRequest, NextResponse } from 'next/server';
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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Cookie bridging (middleware) para evitar "random logouts" por refresh de sesión.
  // Importante: setAll debe persistir cookies hacia la response FINAL (Next/redirect).
  const cookiesToSet: Array<{ name: string; value: string; options?: object }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies: Array<{ name: string; value: string; options?: object }>) {
          nextCookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    },
  );

  // Protected routes check
  const protectedPaths = ['/builder', '/collection', '/settings', '/decks', '/admin'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // Refrescar session + obtener user (no remover este getUser).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let response: NextResponse;
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    response = NextResponse.redirect(redirectUrl);
  } else if (request.nextUrl.pathname === '/' && user) {
    // Logged-in users go straight to catalog instead of marketing landing
    response = NextResponse.redirect(new URL('/catalog', request.url));
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Persistir cookies de Supabase en la response final.
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));

  // Propagar request_id en response header (doc 12)
  response.headers.set('X-Request-Id', requestId);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
