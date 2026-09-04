import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthError } from '@supabase/supabase-js'
import { IconLoader2, IconToolsKitchen2, IconArrowLeft } from '@tabler/icons-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface EmailFormValues {
  email: string
  room_number: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 30

// Map a signInWithOtp failure to friendly copy (docs/3-App-Flow.md §4)
function describeSendError(error: AuthError): string {
  const msg = error.message.toLowerCase()
  if (
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit' ||
    msg.includes('rate limit')
  ) {
    return 'Too many codes requested. Wait a minute and try again.'
  }
  return "Couldn't send the code. Check your internet and try again."
}

// "Resend code" is disabled for 30s after each send (docs/3-App-Flow.md §4)
function useResendCooldown(seconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))
  return { remaining, start: () => setEndsAt(Date.now() + seconds * 1000) }
}

function BrandMark() {
  return (
    <div className="w-14 h-14 rounded-2xl bg-card border border-border-subtle shadow-warm flex items-center justify-center mb-3 mx-auto shrink-0">
      <IconToolsKitchen2 size={28} className="text-accent" />
    </div>
  )
}

// Step 1 — email entry + optional room number (docs/3-App-Flow.md §4)
function EmailStep({
  initialEmail,
  initialRoom,
  onCodeSent,
  onBack,
}: {
  initialEmail: string
  initialRoom: string
  onCodeSent: (email: string, roomNumber: string) => void
  onBack: () => void
}) {
  const [sendError, setSendError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    mode: 'onTouched',
    defaultValues: { email: initialEmail, room_number: initialRoom },
  })

  // Render-friendly form subscription (useWatch instead of watch())
  const emailValue = useWatch({ control, name: 'email', defaultValue: initialEmail })
  const emailLooksValid = EMAIL_PATTERN.test((emailValue ?? '').trim())

  const onSubmit = handleSubmit(async (values) => {
    setSendError(null)
    // Unified login/signup — a new email creates the account implicitly
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setSendError(describeSendError(error))
      return
    }
    onCodeSent(values.email, values.room_number.trim())
  })

  return (
    <div className="w-full max-w-[430px] min-h-dvh flex flex-col bg-app text-primary">
      {/* Top Header with Back Navigation per docs/3-App-Flow.md */}
      <header className="flex items-center justify-between px-4 h-14 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors cursor-pointer"
        >
          <IconArrowLeft size={22} stroke={1.75} />
        </button>
        <span className="text-xs font-semibold tracking-wider text-muted uppercase">TuckRate</span>
        <div className="w-10" />
      </header>

      {/* Centered, balanced form body */}
      <div className="flex-1 flex flex-col justify-start px-5 pt-4 pb-10">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark />
          <h1 className="text-xl font-semibold text-primary mb-1">Log in or sign up</h1>
          <p className="text-sm text-secondary max-w-[280px]">
            We&apos;ll email you a 6-digit code. No password needed.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="w-full">
          <div className="mb-4">
            <label htmlFor="email" className="block text-xs font-medium text-secondary mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`h-12 w-full rounded-xl bg-card border px-4 text-base text-primary placeholder:text-muted transition-colors focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-warm ${
                errors.email ? 'border-bad bg-bad-bg/30' : 'border-border-default'
              }`}
              {...register('email', {
                required: 'Enter your email',
                pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
                setValueAs: (v: string) => v.trim(),
              })}
            />
            {errors.email && (
              <p className="text-xs text-bad mt-1.5 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="room_number" className="block text-xs font-medium text-secondary mb-1.5 uppercase tracking-wider">
              Room number <span className="normal-case text-muted font-normal">(optional)</span>
            </label>
            <input
              id="room_number"
              type="text"
              maxLength={16}
              autoComplete="off"
              placeholder="e.g. B-214"
              className="h-12 w-full rounded-xl bg-card border border-border-default px-4 text-base text-primary placeholder:text-muted transition-colors focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-warm"
              {...register('room_number')}
            />
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Just for community trust — never verified, not used for access.
            </p>
          </div>

          {sendError && (
            <div className="p-3 mb-4 rounded-xl bg-bad-bg text-bad text-xs font-medium border border-bad/20">
              {sendError}
            </div>
          )}

          <button
            type="submit"
            disabled={!emailLooksValid || isSubmitting}
            className="mt-2 h-12 w-full rounded-full bg-accent text-card text-sm font-semibold shadow-warm active:bg-accent-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <IconLoader2 size={18} className="animate-spin text-card" />}
            {isSubmitting ? 'Sending code…' : 'Send code'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Step 2 — 6-digit OTP entry (docs/3-App-Flow.md §4)
function CodeStep({
  email,
  roomNumber,
  onVerified,
  onBackToEmail,
}: {
  email: string
  roomNumber: string
  onVerified: () => void
  onBackToEmail: () => void
}) {
  const [code, setCode] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [codeExpired, setCodeExpired] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const cooldown = useResendCooldown(RESEND_COOLDOWN_SECONDS)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function verify() {
    if (code.length !== 6 || verifying) return
    setVerifying(true)
    setVerifyError(null)
    setCodeExpired(false)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (error) {
        const expired =
          error.code === 'otp_expired' || error.message.toLowerCase().includes('expired')
        if (expired) {
          setCodeExpired(true)
        } else {
          setVerifyError("That code's not right. Try again.")
        }
        setCode('')
        inputRef.current?.focus()
        return
      }

      if (data.user && roomNumber) {
        const { error: roomError } = await supabase
          .from('users')
          .update({ room_number: roomNumber })
          .eq('id', data.user.id)
        if (roomError) {
          console.warn('[TuckRate] Could not save room number:', roomError.message)
        }
      }

      onVerified()
    } finally {
      setVerifying(false)
    }
  }

  async function resend() {
    if (cooldown.remaining > 0 || resending) return
    setResending(true)
    setResendError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setResending(false)
    if (error) {
      setResendError(describeSendError(error))
      return
    }
    cooldown.start()
  }

  const showError = codeExpired || verifyError !== null

  return (
    <div className="w-full max-w-[430px] min-h-dvh flex flex-col bg-app text-primary">
      {/* Top Header with Back Navigation */}
      <header className="flex items-center justify-between px-4 h-14 shrink-0">
        <button
          type="button"
          onClick={onBackToEmail}
          aria-label="Back to email entry"
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors cursor-pointer"
        >
          <IconArrowLeft size={22} stroke={1.75} />
        </button>
        <span className="text-xs font-semibold tracking-wider text-muted uppercase">Verification</span>
        <div className="w-10" />
      </header>

      {/* Centered form body */}
      <div className="flex-1 flex flex-col justify-start px-5 pt-4 pb-10">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark />
          <h1 className="text-xl font-semibold text-primary mb-1">Enter the code</h1>
          <p className="text-sm text-secondary mb-2">
            We sent a 6-digit code to <span className="font-medium text-primary">{email}</span>.
          </p>
          <button
            type="button"
            onClick={onBackToEmail}
            className="text-xs text-accent font-medium hover:underline underline-offset-2 cursor-pointer"
          >
            Use a different email
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await verify()
          }}
          noValidate
          className="w-full"
        >
          <label htmlFor="otp" className="sr-only">
            6-digit code
          </label>
          <input
            id="otp"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`h-14 w-full rounded-xl bg-card border text-center text-2xl font-semibold tracking-[0.4em] text-primary placeholder:text-muted transition-colors focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-warm ${
              showError ? 'border-bad bg-bad-bg/30' : 'border-border-default'
            }`}
          />

          {codeExpired && (
            <p className="text-xs text-bad mt-2 text-center font-medium">That code expired. Resend a new one below.</p>
          )}
          {verifyError && (
            <p className="text-xs text-bad mt-2 text-center font-medium">{verifyError}</p>
          )}
          {resendError && (
            <p className="text-xs text-bad mt-2 text-center font-medium">{resendError}</p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || verifying}
            className="mt-8 h-12 w-full rounded-full bg-accent text-card text-sm font-semibold shadow-warm active:bg-accent-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying && <IconLoader2 size={18} className="animate-spin text-card" />}
            {verifying ? 'Checking code…' : 'Verify'}
          </button>
        </form>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown.remaining > 0 || resending}
          className={`mt-4 h-11 w-full text-center text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            codeExpired ? 'text-accent underline underline-offset-2' : 'text-secondary hover:text-primary'
          }`}
        >
          {resending
            ? 'Resending…'
            : cooldown.remaining > 0
              ? `Resend code (${cooldown.remaining}s)`
              : 'Resend code'}
        </button>
      </div>
    </div>
  )
}

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [roomNumber, setRoomNumber] = useState('')

  // Redirect target: the screen that triggered login, else Home (docs/3-App-Flow.md §4).
  // Internal paths only — no open redirects.
  const from = (() => {
    const path = (location.state as { from?: string } | null)?.from
    return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/'
  })()

  if (!isSupabaseConfigured) {
    return (
      <div className="w-full max-w-[430px] min-h-dvh flex flex-col bg-app text-primary">
        <header className="flex items-center px-4 h-14 shrink-0">
          <button
            type="button"
            onClick={() => navigate(from, { replace: true })}
            aria-label="Go back"
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-secondary active:text-primary active:bg-card transition-colors cursor-pointer"
          >
            <IconArrowLeft size={22} stroke={1.75} />
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-14">
          <BrandMark />
          <h1 className="text-xl font-semibold text-primary mb-2">TuckRate</h1>
          <p className="text-sm text-secondary max-w-[280px]">
            The app isn&apos;t connected to its backend yet, so logging in is disabled.
          </p>
        </div>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <EmailStep
        initialEmail={email}
        initialRoom={roomNumber}
        onCodeSent={(sentEmail, room) => {
          setEmail(sentEmail)
          setRoomNumber(room)
          setStep('code')
        }}
        onBack={() => navigate(from, { replace: true })}
      />
    )
  }

  return (
    <CodeStep
      email={email}
      roomNumber={roomNumber}
      onVerified={() => navigate(from, { replace: true })}
      onBackToEmail={() => setStep('email')}
    />
  )
}

export default LoginPage
