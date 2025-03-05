import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-2xl font-bold text-foreground">Sign In</h3>
          <p className="text-sm text-muted-foreground">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm mode="login" />
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link
              href="/signup"
              className="font-semibold text-foreground hover:text-muted-foreground transition-colors"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
          <p className="text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-semibold text-foreground hover:text-muted-foreground transition-colors"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
