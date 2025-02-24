import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/main/:path*'], // Protege todas las rutas dentro de /main
};

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const response = await fetch('http://localhost:8000/auth/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.value}`,
            },
        });

        if (response.ok) {
            return NextResponse.next();
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } catch (error) {
        console.error('Middleware error:', error);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
