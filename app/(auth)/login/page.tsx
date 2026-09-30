'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { LiverpoolLogo } from '@/components/liverpool-logo'
import { SquareSpinner } from '@/components/ui/square-spinner'
import {
  LOGIN_ERROR_MESSAGES,
  LOGIN_SUCCESS_MESSAGES,
  pickLoginMessage,
} from './login-messages'

type LoginFeedback = {
  type: 'error' | 'success'
  message: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState<LoginFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!email.trim() || !password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Completa tu usuario y contraseña para continuar.',
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (res.ok) {
        const message = pickLoginMessage(LOGIN_SUCCESS_MESSAGES)
        setFeedback({ type: 'success', message })
        router.push('/modulos')
        router.refresh()
      } else {
        const message = pickLoginMessage(LOGIN_ERROR_MESSAGES, feedback?.message)
        setFeedback({ type: 'error', message })
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'No fue posible conectar con el portal en este momento. Inténtalo nuevamente en unos minutos.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F2F7] flex flex-col font-sans">
      <header className="w-full bg-[#833177] h-[60px] flex items-center px-4 sm:px-6 shrink-0">
        <div className="flex items-center">
          <LiverpoolLogo className="h-7 w-auto text-white" />
        </div>
      </header>

      <main className="min-h-[calc(100vh-60px)] flex-1 flex flex-col items-center justify-center px-5 py-6 sm:px-6 sm:py-8">
        <section
          aria-labelledby="login-heading"
          className="w-full max-w-[420px] bg-white border border-[#CAC4D0] rounded-none p-6 sm:p-8 flex flex-col gap-6 shadow-none"
        >
          <div className="flex flex-col gap-1.5 text-left">
            <p className="text-[10px] sm:text-[10px] font-semibold text-[#49454F] tracking-wider uppercase">
              PORTAL INTERNO
            </p>
            <h1
              id="login-heading"
              className="text-[10px] sm:text-[10px] font-bold text-[#1D1B20] leading-tight"
            >
              Bienvenido a Liverpool Galerías Perinorte
            </h1>
            <p className="text-[10px] text-[#49454F] leading-relaxed mt-1">
              Ingresa tus credenciales para acceder al portal interno.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[10px] font-medium text-[#49454F]">
                Correo institucional <span className="text-[#833177]">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@liverpool.com.mx"
                className="w-full h-12 px-3 border border-[#CAC4D0] rounded-none text-[10px] text-[#1D1B20] bg-white outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus-visible:outline-none focus:border-[#833177]/50 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:shadow-none focus-visible:shadow-none transition-colors"
                spellCheck="false"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[10px] font-medium text-[#49454F]">
                Contraseña <span className="text-[#833177]">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full h-12 px-3 pr-11 border border-[#CAC4D0] rounded-none text-[10px] text-[#1D1B20] bg-white outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus-visible:outline-none focus:border-[#833177]/50 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:shadow-none focus-visible:shadow-none transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#49454F] hover:text-[#1D1B20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#833177] cursor-liverpool-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-[52px]" aria-live="polite" aria-atomic="true">
              {feedback && (
                <div
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  className={`h-full border-l-4 px-3 py-2 rounded-none flex items-center ${
                    feedback.type === 'error'
                      ? 'border-[#ff6d01] bg-[#ff6d01]/10'
                      : 'border-[#833177]/50 bg-[#833177]/10'
                  }`}
                >
                  <p className="text-[10px] text-[#1D1B20] font-medium leading-snug">
                    {feedback.message}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || feedback?.type === 'success'}
                className="w-full h-12 bg-[#833177] hover:bg-[#6f2764] text-white rounded-none font-semibold text-[10px] transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#833177] cursor-liverpool-pointer"
              >
                {feedback?.type === 'success' ? (
                  'Acceso confirmado'
                ) : isLoading ? (
                  <span className="flex items-center gap-2">
                    <SquareSpinner className="w-5 h-5" />
                    <span>Verificando acceso...</span>
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </form>

          <footer className="pt-2 border-t border-[#CAC4D0]/60">
            <p className="text-[10px] text-[#49454F] text-center">
              Liverpool Galerías Perinorte · Uso interno
            </p>
          </footer>
        </section>
      </main>
    </div>
  )
}
