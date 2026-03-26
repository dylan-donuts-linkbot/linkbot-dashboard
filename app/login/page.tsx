'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      setStatus('error')
      setErrorMessage(decodeURIComponent(err))
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    const supabase = getSupabase()
    if (!supabase) {
      setStatus('error')
      setErrorMessage('Supabase is not configured. Check your environment variables.')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>✉️</div>
        <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Check your email
        </p>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Magic link sent to <strong style={{ color: 'var(--text-light)' }}>{email}</strong>.
          Click the link in the email to sign in.
        </p>
        <button
          onClick={() => { setStatus('idle'); setEmail('') }}
          className="btn-ghost"
          style={{ width: '100%' }}
        >
          Send a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: 'block', marginBottom: '16px' }}>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-light)', marginBottom: '6px' }}>
          Email address
        </span>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          disabled={status === 'loading'}
          style={{ width: '100%' }}
        />
      </label>

      {status === 'error' && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#f87171',
        }}>
          {errorMessage || 'Something went wrong. Try again.'}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={status === 'loading' || !email.trim()}
        style={{ width: '100%', padding: '10px', fontSize: '14px' }}
      >
        {status === 'loading' ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep)',
      zIndex: 9999,
    }}>
      <div style={{ width: '100%', maxWidth: '380px', margin: '0 16px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            margin: '0 auto 16px',
          }}>
            🔗
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Project HQ
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '28px',
        }}>
          <Suspense fallback={<div style={{ height: '80px' }} />}>
            <LoginForm />
          </Suspense>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#4b5563' }}>
          Single-user access only
        </p>
      </div>
    </div>
  )
}
