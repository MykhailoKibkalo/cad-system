// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER = process.env.NEXT_PUBLIC_BASIC_AUTH_USER
const PASS = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS

export function middleware(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''

    const expected = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

    if (auth === expected) {
        return NextResponse.next()
    }

    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Protected Area"',
        },
    })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login).*)',
    ],
}
