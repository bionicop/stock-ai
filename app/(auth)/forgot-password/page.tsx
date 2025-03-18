import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-2xl font-bold text-foreground">Reset Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>
        <AuthForm mode="forgot-password" />
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-semibold text-foreground hover:text-muted-foreground transition-colors"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
