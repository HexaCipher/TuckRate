import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthError } from '@supabase/supabase-js'
import {
  IconLoader2,
  IconArrowLeft,
  IconMail,
  IconHome,
  IconCheck,
  IconX,
  IconSparkles,
} from '@tabler/icons-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface EmailFormValues {
  email: string
  room_number: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 30

/** Map a signInWithOtp failure to friendly copy */
function describeSendError(error: AuthError): string {
  const msg = error.message.toLowerCase()
  if (
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit' ||
    msg.includes('rate limit')
  ) {
    return 'Too many codes requested. Wait a minute and try again.'
  }
  return "Couldn't send the code. Check your internet connection and try again."
}

/** Resend code countdown hook */
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

/** Format countdown as 00:SS */
function formatCooldown(seconds: number): string {
  const s = seconds % 60
  return `00:${s < 10 ? '0' : ''}${s}`
}

/* ────────────────────────────────────────────────────────────
 * 6-Box OTP Input Component
 * ──────────────────────────────────────────────────────────── */
interface OtpInputProps {
  value: string
  onChange: (code: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  hasError?: boolean
}

function OtpInput({ value, onChange, onComplete, disabled, hasError }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')

  useEffect(() => {
    // Focus first box on mount
    inputRefs.current[0]?.focus()
  }, [])

  function handleDigitChange(index: number, char: string) {
    const cleanDigit = char.replace(/\D/g, '').slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = cleanDigit
    const nextValue = nextDigits.join('')
    onChange(nextValue)

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (nextValue.length === 6) {
      onComplete?.(nextValue)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous and clear
        const nextDigits = [...digits]
        nextDigits[index - 1] = ''
        onChange(nextDigits.join(''))
        inputRefs.current[index - 1]?.focus()
      } else {
        const nextDigits = [...digits]
        nextDigits[index] = ''
        onChange(nextDigits.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    onChange(pasted)
    const focusTarget = Math.min(pasted.length, 5)
    inputRefs.current[focusTarget]?.focus()

    if (pasted.length === 6) {
      onComplete?.(pasted)
    }
  }

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-sm mx-auto">
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = digits[index]
        const isFilled = digit !== ''

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of 6`}
            className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl text-center text-xl sm:text-2xl font-bold transition-all outline-none select-none ${
              hasError
                ? 'border-2 border-bad bg-bad-bg/30 text-bad focus:border-bad'
                : isFilled
                  ? 'border border-border-default bg-card text-primary shadow-warm'
                  : 'border border-border-subtle bg-elevated/40 text-primary hover:border-border-default'
            } focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/20`}
          />
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 * Step 1: Email & Optional Room Number
 * ──────────────────────────────────────────────────────────── */
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    mode: 'onTouched',
    defaultValues: { email: initialEmail, room_number: initialRoom },
  })

  const emailValue = useWatch({ control, name: 'email', defaultValue: initialEmail })
  const emailLooksValid = EMAIL_PATTERN.test((emailValue ?? '').trim())

  const onSubmit = handleSubmit(async (values) => {
    setSendError(null)
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
    <div className="w-full max-w-md mx-auto min-h-dvh flex flex-col justify-between px-4 sm:px-6 py-4">
      {/* Top Header */}
      <div>
        <header className="flex items-center justify-between h-14">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 -ml-1.5 flex items-center justify-center rounded-full bg-card border border-border-subtle shadow-warm text-secondary hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
          <img
            src="/wordmark.png"
            alt="WorthIt"
            className="h-6 sm:h-7 w-auto object-contain select-none"
            draggable={false}
          />
          <div className="w-10" />
        </header>

        {/* Title Intro */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight leading-tight">
            Welcome to WorthIt!
          </h1>
          <p className="text-sm text-secondary mt-1.5 leading-relaxed max-w-sm">
            Get a 6-digit code to log in or sign up. No password needed.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-card border border-border-subtle shadow-warm-md p-5 sm:p-7">
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-secondary uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative flex items-center">
                <IconMail
                  size={18}
                  stroke={1.8}
                  className="absolute left-3.5 text-muted pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@college.edu"
                  className={`h-12 w-full rounded-xl bg-elevated/30 border pl-10 pr-10 text-base text-primary placeholder:text-muted transition-all outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                    errors.email
                      ? 'border-bad bg-bad-bg/20'
                      : 'border-border-default'
                  }`}
                  {...register('email', {
                    required: 'Please enter your email',
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: 'Please enter a valid email address',
                    },
                    setValueAs: (v: string) => v.trim(),
                  })}
                />
                {/* Trailing indicator / Clear action */}
                {emailValue && (
                  <div className="absolute right-3 flex items-center">
                    {emailLooksValid ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <IconCheck size={12} stroke={2.5} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setValue('email', '')}
                        aria-label="Clear email"
                        className="text-muted hover:text-primary transition-colors cursor-pointer"
                      >
                        <IconX size={16} stroke={2} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-xs text-bad mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Room Number Field (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="room_number"
                  className="block text-xs font-bold text-secondary uppercase tracking-wider"
                >
                  Room number <span className="text-muted font-normal lowercase">(optional)</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <IconHome
                  size={18}
                  stroke={1.8}
                  className="absolute left-3.5 text-muted pointer-events-none"
                />
                <input
                  id="room_number"
                  type="text"
                  maxLength={16}
                  autoComplete="off"
                  placeholder="e.g. B-214"
                  className="h-12 w-full rounded-xl bg-elevated/30 border border-border-default pl-10 pr-4 text-base text-primary placeholder:text-muted transition-all outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20"
                  {...register('room_number')}
                />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Helps us show relevant reviews from your hostel.
              </p>
            </div>

            {/* Error Message */}
            {sendError && (
              <div className="p-3 rounded-xl bg-bad-bg text-bad text-xs font-medium border border-bad/20 leading-relaxed">
                {sendError}
              </div>
            )}

            {/* Primary Action */}
            <button
              type="submit"
              disabled={!emailLooksValid || isSubmitting}
              className="mt-2 h-12 w-full rounded-full bg-accent text-card text-sm font-semibold shadow-warm active:bg-accent-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <IconLoader2 size={18} className="animate-spin text-card" />
              )}
              <span>{isSubmitting ? 'Sending code…' : 'Send 6-digit code →'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Subtle Bottom Note */}
      <footer className="py-4 text-center">
        <p className="text-xs text-muted inline-flex items-center gap-1.5">
          <IconSparkles size={14} className="text-accent" />
          <span>Real students. Real opinions. Honest hostel food.</span>
        </p>
      </footer>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 * Step 2: 6-Digit OTP Code Verification
 * ──────────────────────────────────────────────────────────── */
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

  async function verify(tokenToVerify = code) {
    if (tokenToVerify.length !== 6 || verifying) return
    setVerifying(true)
    setVerifyError(null)
    setCodeExpired(false)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: tokenToVerify,
        type: 'email',
      })
      if (error) {
        const expired =
          error.code === 'otp_expired' || error.message.toLowerCase().includes('expired')
        if (expired) {
          setCodeExpired(true)
        } else {
          setVerifyError("That code doesn't look right. Please try again.")
        }
        setCode('')
        return
      }

      if (data.user && roomNumber) {
        const { error: roomError } = await supabase
          .from('users')
          .update({ room_number: roomNumber })
          .eq('id', data.user.id)
        if (roomError) {
          console.warn('[WorthIt] Could not save room number:', roomError.message)
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
    <div className="w-full max-w-md mx-auto min-h-dvh flex flex-col justify-between px-4 sm:px-6 py-4">
      <div>
        {/* Top Header */}
        <header className="flex items-center justify-between h-14">
          <button
            type="button"
            onClick={onBackToEmail}
            aria-label="Back to email entry"
            className="w-10 h-10 -ml-1.5 flex items-center justify-center rounded-full bg-card border border-border-subtle shadow-warm text-secondary hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
          <span className="text-xs font-bold tracking-widest text-muted uppercase">
            Verification
          </span>
          <div className="w-10" />
        </header>

        {/* Title Intro */}
        <div className="pt-4 pb-6 sm:pt-6 sm:pb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight leading-tight">
            Check your email
          </h1>
          <p className="text-sm text-secondary mt-1.5 leading-relaxed">
            We&apos;ve sent a 6-digit code to{' '}
            <span className="font-semibold text-primary">{email}</span>
          </p>
          <button
            type="button"
            onClick={onBackToEmail}
            className="text-xs text-accent font-semibold hover:underline mt-1 cursor-pointer"
          >
            Use a different email
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-card border border-border-subtle shadow-warm-md p-5 sm:p-7 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void verify()
            }}
            noValidate
          >
            {/* 6-Box OTP Input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider text-center mb-3">
                Enter 6-digit code
              </label>
              <OtpInput
                value={code}
                onChange={(newVal) => setCode(newVal)}
                onComplete={(completeCode) => void verify(completeCode)}
                disabled={verifying}
                hasError={showError}
              />
            </div>

            {/* Error Feedback */}
            {codeExpired && (
              <p className="text-xs text-bad text-center font-medium mb-3">
                This code has expired. Send a new one below.
              </p>
            )}
            {verifyError && (
              <p className="text-xs text-bad text-center font-medium mb-3">
                {verifyError}
              </p>
            )}
            {resendError && (
              <p className="text-xs text-bad text-center font-medium mb-3">
                {resendError}
              </p>
            )}

            {/* Resend Timer / Action */}
            <div className="text-center mb-5">
              {cooldown.remaining > 0 ? (
                <span className="text-xs text-secondary font-medium tabular-nums">
                  Resend code in {formatCooldown(cooldown.remaining)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  disabled={resending}
                  className="text-xs font-semibold text-accent hover:underline cursor-pointer transition-colors"
                >
                  {resending ? 'Sending new code…' : "Didn't get the code? Resend code"}
                </button>
              )}
            </div>

            {/* Primary Action */}
            <button
              type="submit"
              disabled={code.length !== 6 || verifying}
              className="h-12 w-full rounded-full bg-accent text-card text-sm font-semibold shadow-warm active:bg-accent-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying && (
                <IconLoader2 size={18} className="animate-spin text-card" />
              )}
              <span>{verifying ? 'Verifying code…' : 'Verify & Continue'}</span>
            </button>
          </form>
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-xs text-muted">
          Need help? Contact tuck shop hostel reps.
        </p>
      </footer>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 * Step 3: Success Screen (Brief transition)
 * ──────────────────────────────────────────────────────────── */
function SuccessStep({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone()
    }, 900)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="w-full max-w-md mx-auto min-h-dvh flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-300">
      <div className="rounded-3xl bg-card border border-border-subtle shadow-warm-md p-8 sm:p-10 w-full space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-warm">
          <IconCheck size={32} stroke={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">
          You&apos;re in!
        </h2>
        <p className="text-sm text-secondary max-w-xs mx-auto">
          Welcome to WorthIt! Let&apos;s find some great food.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 h-11 px-6 rounded-full bg-accent text-card text-xs sm:text-sm font-semibold shadow-warm active:scale-95 transition-all cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 * Main Login Page
 * ──────────────────────────────────────────────────────────── */
function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [roomNumber, setRoomNumber] = useState('')

  // Redirect target: screen that triggered login, else Home
  const from = (() => {
    const path = (location.state as { from?: string } | null)?.from
    return typeof path === 'string' &&
      path.startsWith('/') &&
      !path.startsWith('//') &&
      path !== '/login'
      ? path
      : '/'
  })()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      let safeFallback = from
      const rateMatch = from.match(/^\/item\/([^/]+)\/rate$/)
      if (rateMatch) {
        safeFallback = `/item/${rateMatch[1]}`
      } else if (
        from === '/profile' ||
        from.startsWith('/profile/') ||
        from === '/admin' ||
        from.startsWith('/admin/') ||
        from === '/login' ||
        from.startsWith('/login/')
      ) {
        safeFallback = '/'
      }
      navigate(safeFallback, { replace: true })
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="w-full max-w-md mx-auto min-h-dvh flex flex-col bg-app text-primary">
        <header className="flex items-center px-4 h-14 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-10 h-10 -ml-1.5 flex items-center justify-center rounded-full bg-card border border-border-subtle shadow-warm text-secondary hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-14">
          <img
            src="/wordmark.png"
            alt="WorthIt"
            className="h-7 w-auto object-contain select-none mb-3"
            draggable={false}
          />
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
        onBack={handleBack}
      />
    )
  }

  if (step === 'code') {
    return (
      <CodeStep
        email={email}
        roomNumber={roomNumber}
        onVerified={() => setStep('success')}
        onBackToEmail={() => setStep('email')}
      />
    )
  }

  return <SuccessStep onDone={() => navigate(from, { replace: true })} />
}

export default LoginPage
