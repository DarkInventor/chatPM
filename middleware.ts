import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname

  // Define paths that require authentication
  const protectedPaths = ['/dashboard']
  
  // Define paths that should redirect authenticated users away (auth pages)
  const authPaths = ['/login', '/signup']
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  )
  
  // Check if the current path is an auth page
  const isAuthPath = authPaths.includes(path)

  // For now, we'll use a simple approach since we can't access Firebase auth in middleware
  // We'll handle the authentication logic on the client side
  // This middleware will just pass through all requests
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}