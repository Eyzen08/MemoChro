/* Private signed images bypass shared image caches; originals remain private. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Brand } from "./archive";
import { AuthForm, ThemeToggle } from "./forms";
import { ArrowLeft, LockKeyhole } from "lucide-react";
export function AuthPage({
  mode,
  message,
}: {
  mode: "login" | "signup" | "recover";
  message?: string;
}) {
  return (
    <div className="auth-page">
      <div className="auth-art">
        <img src="/quiet-lake.jpg" alt="A quiet lake between mountains" />
        <Brand />
        <div>
          <p className="eyebrow">Your life, through time.</p>
          <h2>
            Some things
            <br />
            are worth keeping.
          </h2>
          <p>A moment. A feeling. A whole chapter.</p>
        </div>
        <span className="auth-art-caption">Make room for what matters.</span>
      </div>
      <main id="main" className="auth-main">
        <div className="auth-top">
          <Link href="/">
            <ArrowLeft size={16} />
            Back to MemoChro
          </Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">
            {mode === "signup"
              ? "The beginning of your chronicle"
              : mode === "recover"
                ? "Find your way back"
                : "Your archive awaits"}
          </p>
          <h1>
            {mode === "signup"
              ? "Every life has a story."
              : mode === "recover"
                ? "A little help getting in."
                : "Welcome back."}
          </h1>
          <p className="muted">
            {mode === "signup"
              ? "Let’s give yours a place to live."
              : mode === "recover"
                ? "We’ll send you a link to reset your password."
                : "Your moments are right where you left them."}
          </p>
          {message && (
            <p className="feedback" role="status">
              {message.slice(0, 300)}
            </p>
          )}
          <AuthForm mode={mode} />
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                New to MemoChro?{" "}
                <Link href="/signup">Begin your chronicle</Link>
              </>
            ) : (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            )}
          </p>
          <span className="private-note">
            <LockKeyhole size={12} />
            Private by default. Yours to keep.
          </span>
          {mode === "signup" && (
            <p className="hint">
              By creating an account, you agree to the{" "}
              <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy notice</Link>.
            </p>
          )}
        </div>
        <span className="auth-bottom">
          A little of your life. Kept with care.
        </span>
      </main>
    </div>
  );
}
