import { NextResponse } from 'next/server'

const ALLOWED_USERS = {
  'freyesb02@gmail.com': {
    password: 'admin',
    name: 'FREDY REYES BASURTO',
  },

  'freyesb01@liverpool.com.mx': {
    password: 'Liverpool1',
    name: 'FREDY REYES BASURTO',
  },

  'acmejiav@liverpool.com.mx': {
    password: 'Liverpool1',
    name: 'Ana Cristina Mejía Valero',
  },

  'acortezl@liverpool.com.mx': {
    password: 'Liverpool1',
    name: 'Abigail Cortez Luna',
  },
} as const

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = String(body.email || '')
    .trim()
    .toLowerCase()

    const password = String(body.password || '')

    const user =
    ALLOWED_USERS[email as keyof typeof ALLOWED_USERS]

    if (user && user.password === password) {
      const response = NextResponse.json({
        success: true,
      })

      response.cookies.set({
        name: 'auth-token',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      response.cookies.set({
        name: 'user-name',
        value: user.name,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    }

    return NextResponse.json(
      {
        error: 'Credenciales inválidas.',
      },
      {
        status: 401,
      }
    )
  } catch {
    return NextResponse.json(
      {
        error: 'Error processing request.',
      },
      {
        status: 500,
      }
    )
  }
}
