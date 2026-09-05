import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import {
  IconLoader2,
  IconArrowLeft,
  IconMail,
  IconCheck,
  IconX,
  IconSparkles,
} from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 30

type AuthFlow = 'sign_in' | 'sign_up'

/** Check if a Clerk error has a specific error code */
function isClerkError(err: unknown, code: string): boolean {
  if (err && typeof err === 'object' && 'errors' in err) {
    const clerkErr = err as { errors: Array<{ code: string }> }
    return clerkErr.errors?.some((e) => e.code === code) ?? false
  }
  return false
}

/** Map a Clerk send-code error to friendly copy */
function describeSendError(err: unknown): string {
  if (isClerkError(err, 'too_many_requests')) {
    return 'Too many codes requested. Wait a minute and try again.'
  }
  if (isClerkError(err, 'captcha_invalid')) {
    return "Security check failed. Disable any ad blockers or VPN, refresh the page, and try again."
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
 * 6-Box OTP Input Component (unchanged from original)
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
 * Step 1: Email Entry
 * ──────────────────────────────────────────────────────────── */
function EmailStep({
  initialEmail,
  onCodeSent,
  onBack,
}: {
  initialEmail: string
  onCodeSent: (email: string, flow: AuthFlow) => void
  onBack: () => void
}) {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()

  const [email, setEmail] = useState(initialEmail)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const emailTrimmed = email.trim()
  const emailLooksValid = EMAIL_PATTERN.test(emailTrimmed)
  const isLoaded = isSignInLoaded && isSignUpLoaded

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailLooksValid || !isLoaded || !signIn || !signUp) return

    setIsSending(true)
    setSendError(null)

    try {
      // Try sign-in first (existing user)
      await signIn.create({ strategy: 'email_code', identifier: emailTrimmed })
      onCodeSent(emailTrimmed, 'sign_in')
    } catch (err) {
      if (isClerkError(err, 'form_identifier_not_found')) {
        // User doesn't exist → sign-up flow
        try {
          await signUp.create({ emailAddress: emailTrimmed })
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
          onCodeSent(emailTrimmed, 'sign_up')
        } catch (signUpErr) {
          setSendError(describeSendError(signUpErr))
        }
      } else {
        setSendError(describeSendError(err))
      }
    } finally {
      setIsSending(false)
    }
  }

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
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 w-full rounded-xl bg-elevated/30 border pl-10 pr-10 text-base text-primary placeholder:text-muted transition-all outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20 border-border-default`}
                />
                {/* Trailing indicator / Clear action */}
                {email && (
                  <div className="absolute right-3 flex items-center">
                    {emailLooksValid ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <IconCheck size={12} stroke={2.5} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEmail('')}
                        aria-label="Clear email"
                        className="text-muted hover:text-primary transition-colors cursor-pointer"
                      >
                        <IconX size={16} stroke={2} />
                      </button>
                    )}
                  </div>
                )}
              </div>
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
              disabled={!emailLooksValid || isSending || !isLoaded}
              className="mt-2 h-12 w-full rounded-full bg-accent text-card text-sm font-semibold shadow-warm active:bg-accent-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending && (
                <IconLoader2 size={18} className="animate-spin text-card" />
              )}
              <span>{isSending ? 'Sending code…' : 'Send 6-digit code →'}</span>
            </button>

            {/* Clerk Bot Protection (Smart CAPTCHA) mount point.
                Clerk injects its Cloudflare Turnstile widget into this div
                when signUp.create() runs. Without it, Clerk falls back to
                Invisible CAPTCHA, which can fail with `captcha_invalid` and
                block all new sign-ups. Must be in the DOM while this step
                is rendered — the sign-up attempt is fired from here. */}
            <div id="clerk-captcha" className="flex justify-center mt-3" />
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
  flow,
  onVerified,
  onBackToEmail,
}: {
  email: string
  flow: AuthFlow
  onVerified: () => void
  onBackToEmail: () => void
}) {
  const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp()

  const [code, setCode] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [codeExpired, setCodeExpired] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const cooldown = useResendCooldown(RESEND_COOLDOWN_SECONDS)

  const isLoaded = isSignInLoaded && isSignUpLoaded

  async function verify(tokenToVerify = code) {
    if (tokenToVerify.length !== 6 || verifying || !isLoaded) return
    setVerifying(true)
    setVerifyError(null)
    setCodeExpired(false)

    try {
      if (flow === 'sign_in' && signIn) {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code: tokenToVerify,
        })
        if (result.status === 'complete') {
          await setSignInActive!({ session: result.createdSessionId })
          onVerified()
          return
        }
      } else if (flow === 'sign_up' && signUp) {
        const result = await signUp.attemptEmailAddressVerification({
          code: tokenToVerify,
        })
        if (result.status === 'complete') {
          await setSignUpActive!({ session: result.createdSessionId })
          onVerified()
          return
        }
      }
    } catch (err) {
      if (isClerkError(err, 'verification_expired') || isClerkError(err, 'verification_failed')) {
        setCodeExpired(true)
      } else if (isClerkError(err, 'form_code_incorrect')) {
        setVerifyError("That code doesn't look right. Please try again.")
      } else {
        setVerifyError("Couldn't verify the code. Try again.")
      }
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  async function resend() {
    if (cooldown.remaining > 0 || resending || !isLoaded) return
    setResending(true)
    setResendError(null)

    try {
      if (flow === 'sign_in' && signIn) {
        await signIn.create({ strategy: 'email_code', identifier: email })
      } else if (flow === 'sign_up' && signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      }
      cooldown.start()
    } catch (err) {
      setResendError(describeSendError(err))
    } finally {
      setResending(false)
    }
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
  const { user } = useAuth()
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [authFlow, setAuthFlow] = useState<AuthFlow>('sign_in')

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

  // If already signed in, redirect immediately
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

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

  if (step === 'email') {
    return (
      <EmailStep
        initialEmail={email}
        onCodeSent={(sentEmail, flow) => {
          setEmail(sentEmail)
          setAuthFlow(flow)
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
        flow={authFlow}
        onVerified={() => setStep('success')}
        onBackToEmail={() => setStep('email')}
      />
    )
  }

  return <SuccessStep onDone={() => navigate(from, { replace: true })} />
}

export default LoginPage
